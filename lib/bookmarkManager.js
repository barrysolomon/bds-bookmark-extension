class ColumnIndex {
    static ICON = 0;
    static LINK = 1;
    static DESCRIPTION = 2;
    static OPTIONS = 3;
    static ACTIONS = 4;
}

function loadBookmarksFromStorage() {
    chrome.storage.sync.get({ bookmarks: [] }, function (result) {
        var bookmarks = result.bookmarks;
        bookmarks.forEach(bookmark => bookmarkManager.addBookmarkToTable(bookmark));
    });
}

function deleteBookmarkFromStorage(bookmark, row) {
    chrome.storage.sync.get({ bookmarks: [] }, function (result) {
        var bookmarks = result.bookmarks;
        var index = bookmarks.findIndex(b => b.url === bookmark.url);
        if (index > -1) {
            bookmarks.splice(index, 1);
            chrome.storage.sync.set({ bookmarks: bookmarks }, function () {
                row.remove();
            });
        }
    });
}

function deleteQueryParamAndOptionTag(event) {

    var bookmarkId = event.target.dataset.bookmarkId;
    var bookmarkUrl = document.getElementById(bookmarkId).href;
    var parsedUrl = new URL(bookmarkUrl);
    parsedUrl.searchParams.delete(event.target.parentElement.textContent.slice(0, -1)); // Deleting the parameter from the URL

    // Update the URL in the bookmark link
    document.getElementById(bookmarkId).href = parsedUrl.toString();

    // Remove the option tag
    event.target.parentElement.remove();

    // Update the URL in the storage
    chrome.storage.sync.get({ bookmarks: [] }, function (result) {
        var bookmarks = result.bookmarks;
        var index = bookmarks.findIndex(b => b.url === bookmarkUrl);
        if (index > -1) {
            bookmarks[index].url = parsedUrl.toString();
            chrome.storage.sync.set({ bookmarks: bookmarks });
        }
    });

}

function parseURLForShortName(url) {
    var parsedUrl = new URL(url);
    return parsedUrl.hostname;
}

class BookmarkManager {

    constructor(tableId) {
        this.table = document.getElementById(tableId).getElementsByTagName('tbody')[0];
    }

    addBookmarkFromPage() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var tab = tabs[0];
            if (tab.url.startsWith('https://platform.lumigo.io')) {
                var bookmark = {
                    url: tab.url,
                    shortName: tab.title, // parseURLForShortName(tab.url),
                    name: '', // Name will be empty string, adjust this if you can get the name somehow
                    description: tab.title // Description will be the title of the page
                };

                chrome.storage.sync.get({ bookmarks: [] }, function (result) {
                    var bookmarks = result.bookmarks;
                    // Prevent duplicates
                    if (bookmarks.findIndex(b => b.url === bookmark.url) === -1) {
                        bookmarks.push(bookmark);
                        // Only add the bookmark to the table after it's saved to storage
                        chrome.storage.sync.set({ bookmarks: bookmarks }, function () {
                            bookmarkManager.addBookmarkToTable(bookmark);
                        });
                    }
                });
            } else {
                alert('This extension only works on pages under the domain platform.lumigo.io.');
            }
        });
    }

    addBookmarkToTable(bookmark) {
        
        const row = this.table.insertRow(-1);
        const cell1 = row.insertCell(ColumnIndex.ICON);
        const cell2 = row.insertCell(ColumnIndex.LINK);
        const cell3 = row.insertCell(ColumnIndex.DESCRIPTION);
        const cell4 = row.insertCell(ColumnIndex.OPTIONS);
        const cell5 = row.insertCell(ColumnIndex.ACTIONS);

        // Parse the query string of the URL
        const parsedUrl = new URL(bookmark.url);

        cell1.innerHTML = '<a id="' + bookmark.id + '" href="' + bookmark.url + '" target="_blank"><img src="http://www.google.com/s2/favicons?domain=' + bookmark.url + '" /></a>';

        // Create a div to hold the link and edit button
        const linkDiv = document.createElement('div');
        linkDiv.style = 'display: flex; align-items: center;'; // style to align items

        // Create link
        const editableLink = document.createElement('a');
        editableLink.id = `link-${bookmark.id}`; // ID to identify the link later
        editableLink.href = bookmark.url;
        editableLink.title = bookmark.url;
        editableLink.target = "_blank";
        editableLink.textContent = bookmark.shortName;

        // Create edit button
        const editButton = document.createElement('button');
        editButton.innerHTML = '&#9998;'; // Unicode for edit icon
        editButton.style.border = 'none';

        editButton.addEventListener('click', function () {
            const linkEditInput = document.createElement('input');
            linkEditInput.value = editableLink.textContent;
            linkEditInput.addEventListener('blur', updateLink);
            linkEditInput.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    updateLink();
                }
            });

            linkDiv.replaceChild(linkEditInput, editableLink);
            linkEditInput.focus();

            function updateLink() {
                const newLinkText = linkEditInput.value.trim();
                editableLink.textContent = newLinkText;
                bookmark.shortName = newLinkText;
                linkDiv.replaceChild(editableLink, linkEditInput);

                // Save the new link text to storage
                chrome.storage.sync.get({ bookmarks: [] }, function (result) {
                    const bookmarks = result.bookmarks;
                    const index = bookmarks.findIndex(b => b.id === bookmark.id);
                    if (index > -1) {
                        bookmarks[index].shortName = newLinkText;
                        chrome.storage.sync.set({ bookmarks: bookmarks });
                    }
                });
            }
        });

        linkDiv.appendChild(editableLink);
        linkDiv.appendChild(editButton);
        cell2.appendChild(linkDiv);

        const descDiv = document.createElement('div');
        descDiv.style = 'display: flex; align-items: center;'; // style to align items

        const descriptionText = document.createElement('span');
        descriptionText.id = `desc-${bookmark.id}`; // ID to identify the description later
        descriptionText.textContent = bookmark.description;

        const editButtonDesc = document.createElement('button');
        editButtonDesc.innerHTML = '&#9998;'; // Unicode for edit icon
        editButtonDesc.style.border = 'none';

        let updating = false;
        editButtonDesc.addEventListener('click', function () {
            const descEditInput = document.createElement('input');
            descEditInput.value = descriptionText.textContent;

            descEditInput.addEventListener('blur', function () {
                if (!updating) {
                    updating = true;
                    updateDescription();
                }
            });

            descEditInput.addEventListener('keydown', function (event) {
                if (event.key === 'Enter') {
                    event.preventDefault(); // Prevents form submission
                    if (!updating) {
                        updating = true;
                        updateDescription();
                    }
                }
            });

            descDiv.replaceChild(descEditInput, descriptionText);
            descEditInput.focus();

            function updateDescription() {
                const newDescText = descEditInput.value.trim();
                descriptionText.textContent = newDescText;
                bookmark.description = newDescText;
                descDiv.replaceChild(descriptionText, descEditInput);

                // Save the new description text to storage
                chrome.storage.sync.get({ bookmarks: [] }, function (result) {
                    const bookmarks = result.bookmarks;
                    const index = bookmarks.findIndex(b => b.id === bookmark.id);
                    if (index > -1) {
                        bookmarks[index].description = newDescText;
                        chrome.storage.sync.set({ bookmarks: bookmarks });
                    }
                });

                updating = false;
            }
        });

        descDiv.appendChild(descriptionText);
        descDiv.appendChild(editButtonDesc);
        cell3.appendChild(descDiv);

        // OPTIONS CELL

        // Create a div to contain the option tags
        var optionsDiv = document.createElement('div');

        // Create a tag for each option
        var searchParams = parsedUrl.searchParams;
        Array.from(searchParams).forEach(param => {

            let parameterValues = [];

            if (param[0] === "XXXXXXdistributionFilters") {
                try {
                    // Parse JSON value of "distributionFilters" into array
                    parameterValues = JSON.parse(param[1]);
                } catch (e) {
                    console.error("Failed to parse distributionFilters value", e);
                    return; // Continue to next iteration
                }
            } else {
                parameterValues = [param[1]];
            }

            parameterValues.forEach(value => {

                var optionTag = document.createElement('span');

                switch (param[0]) {
                    case "timespan":
                        optionTag.title = param[0]; // Show only the parameter name
                        optionTag.textContent = value; // Use the parameter value as a tooltip
                        break;
                    default:
                        optionTag.textContent = param[0]; // Show only the parameter name
                        optionTag.title = value; // Use the parameter value as a tooltip
                        break;
                }

                optionTag.style = 'background-color: #ddd; margin: 2px; padding: 2px; border-radius: 5px; border: 1px solid #000; margin: 5px; white-space: nowrap; padding: 5px;'; // Added padding

               // Add a delete button to the option tag
                var deleteButton = document.createElement('button');
                deleteButton.textContent = 'X';
                deleteButton.style = 'margin-left: 5px; background-color: red; color: white; border: none; border-radius: 2px; cursor: pointer;';

                deleteButton.onclick = function () {

                    if (param[0] === "XXXXdistributionFilters") {
                        var newFilterValues = JSON.parse(searchParams.get("distributionFilters")).filter(filterValue => filterValue !== value);

                        if (newFilterValues.length > 0) {
                            // Update the value in the URL's query string
                            searchParams.set("distributionFilters", JSON.stringify(newFilterValues));
                        } else {
                            // If no filter values are left, remove the parameter
                            searchParams.delete("distributionFilters");
                        }
                    } else {
                        // Remove the option from the URL's query string
                        searchParams.delete(param[0]);
                    }

                    // Get the original URL before updating it
                    var originalUrl = bookmark.url;

                    // Remove the option from the URL's query string
                    searchParams.delete(param[0]);
                    bookmark.url = parsedUrl.toString();
                    bookmark.searchParams = searchParams;
                    
                    // Update the URL in the table
                    cell2.innerHTML = '<a href="' + bookmark.url + '" target="_blank">' + bookmark.description + '</a>';

                    // Remove the option tag
                    optionsDiv.removeChild(optionTag);

                    // Update the URL in the storage
                    chrome.storage.sync.get({ bookmarks: [] }, function (result) {
                        var bookmarks = result.bookmarks;
                        // Use the original URL to find the index of the bookmark
                        var index = bookmarks.findIndex(b => b.url === originalUrl);
                        if (index > -1) {
                            // Update the URL, then update the bookmark at the found index in the storage
                            bookmarks[index].url = bookmark.url;
                            chrome.storage.sync.set({ bookmarks: bookmarks });
                        }
                    });
                };

                optionTag.appendChild(deleteButton);

                optionsDiv.style = 'overflow: auto; padding: 5px;'; // Added padding to optionsDiv
                optionsDiv.appendChild(optionTag);

                // Attach delete event listener directly
                optionTag.addEventListener('click', function (event) {
                    var param = event.target.getAttribute('data-param');
                    deleteQueryParamAndOptionTag(event, param);
                });

            });

        });
        cell4.appendChild(optionsDiv);

        var actionDiv = document.createElement('div');
        actionDiv.style = 'display: flex; justify-content: space-between;';

        var deleteButton = document.createElement('button');
        deleteButton.innerHTML = '&#128465;';
        deleteButton.style.border = 'none';

        deleteButton.addEventListener('click', function () {
            deleteBookmarkFromStorage(bookmark, row);
        });

        actionDiv.appendChild(deleteButton);

        // var updateButton = document.createElement('button');
        // updateButton.innerHTML = '&#x1F589;'; // Unicode character for refresh icon
        // updateButton.addEventListener('click', function () {
        //     updateBookmarkFromPage(bookmark, row);
        // });
        // actionDiv.appendChild(updateButton);

        cell5.appendChild(actionDiv);
    }
}

// Usage example
// const bookmarkManager = new BookmarkManager('bookmarksTable');
// bookmarkManager.addBookmarkToTable(bookmark);
