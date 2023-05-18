document.addEventListener('DOMContentLoaded', function () {
    var addButton = document.getElementById('addButton');

    addButton.addEventListener('click', function () {
        addBookmarkFromPage();
    });

    function isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    function parseURLForShortName(url) {
        var parsedUrl = new URL(url);
        return parsedUrl.hostname;
    }

    function addBookmarkFromPage() {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var tab = tabs[0];
            if (tab.url.startsWith('https://platform.lumigo.io')) {
                var bookmark = {
                    url: tab.url,
                    shortName: parseURLForShortName(tab.url),
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
                            addBookmarkToTable(bookmark);
                        });
                    }
                });
            } else {
                alert('This extension only works on pages under the domain platform.lumigo.io.');
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
        document.getElementById("shortname-" + bookmarkId).href = parsedUrl.toString();

        // Update the URL in the storage
        chrome.storage.sync.get({ bookmarks: [] }, function (result) {
            var bookmarks = result.bookmarks;
            var index = bookmarks.findIndex(b => b.url === bookmarkUrl);
            if (index > -1) {
                bookmarks[index].url = parsedUrl.toString();
                chrome.storage.sync.set({ bookmarks: bookmarks });
            }
        });

        // Remove the option tag
        event.target.parentElement.remove();
    }

    function addBookmarkToTable(bookmark) {
        var table = document.getElementById('bookmarksTable').getElementsByTagName('tbody')[0];
        var row = table.insertRow(-1);
        var cell1 = row.insertCell(0);
        var cell2 = row.insertCell(1);
        var cell3 = row.insertCell(2);
        var cell4 = row.insertCell(3);
        var cell5 = row.insertCell(4);
        var cell6 = row.insertCell(5);

        cell1.innerHTML = '<a id="' + bookmark.id + '" href="' + bookmark.url + '" target="_blank"><img src="http://www.google.com/s2/favicons?domain=' + bookmark.url + '" /></a>';
        cell2.innerHTML = '<a id="shortname-' + bookmark.id + '" href="' + bookmark.url + '" target="_blank">' + bookmark.shortName + '</a>';
        cell3.innerHTML = bookmark.name;
        cell4.innerHTML = bookmark.description;

        // Parse the query string of the URL
        var parsedUrl = new URL(bookmark.url);
        var searchParams = parsedUrl.searchParams;

        // Create a div to contain the option tags
        var optionsDiv = document.createElement('div');

        // Create a tag for each option
        Array.from(searchParams).forEach(param => {

            var optionTag = document.createElement('span');
            optionTag.textContent = param[0]; // Show only the parameter name
            optionTag.title = param[1]; // Use the parameter value as a tooltip
            optionTag.style = 'background-color: #ddd; margin: 2px; padding: 2px; border-radius: 5px; border: 1px solid #000; margin: 5px; white-space: nowrap; padding: 5px;'; // Added padding

            // Add a delete button to the option tag
            var deleteButton = document.createElement('button');
            deleteButton.textContent = 'X';
            deleteButton.style = 'margin-left: 5px; background-color: red; color: white; border: none; border-radius: 2px; cursor: pointer;';

            deleteButton.onclick = function () {
                // Get the original URL before updating it
                var originalUrl = bookmark.url;
            
                // Remove the option from the URL's query string
                searchParams.delete(param[0]);
                bookmark.url = parsedUrl.toString();
            
                // Update the URL in the table
                cell2.innerHTML = '<a href="' + bookmark.url + '" target="_blank">' + bookmark.shortName + '</a>';
            
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
        cell5.appendChild(optionsDiv);

        var actionDiv = document.createElement('div');
        actionDiv.style = 'display: flex; justify-content: space-between;';

        var deleteButton = document.createElement('button');
        deleteButton.innerHTML = '&#128465;';

        deleteButton.addEventListener('click', function () {
            deleteBookmarkFromStorage(bookmark, row);
        });

        actionDiv.appendChild(deleteButton);

        var updateButton = document.createElement('button');
        updateButton.innerHTML = '&#x1F589;'; // Unicode character for refresh icon
        updateButton.addEventListener('click', function () {
            updateBookmarkFromPage(bookmark, row);
        });
        actionDiv.appendChild(updateButton);

        cell6.appendChild(actionDiv);
    }

    function updateBookmarkFromPage(bookmark, row) {
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            var tab = tabs[0];
            if (tab.url.startsWith('https://platform.lumigo.io')) {
                chrome.storage.sync.get({ bookmarks: [] }, function (result) {
                    var bookmarks = result.bookmarks;
                    var index = bookmarks.findIndex(b => b.url === bookmark.url);
                    if (index > -1) {
                        // Remove the bookmark from the array and save the modified array
                        bookmarks.splice(index, 1);
                        chrome.storage.sync.set({ bookmarks: bookmarks }, function () {
                            // Only call addBookmarkFromPage after the bookmark is removed from storage
                            addBookmarkFromPage();
                        });
                    }
                });
            } else {
                alert('This extension only works on pages under the domain platform.lumigo.io.');
            }
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

    function loadBookmarksFromStorage() {
        chrome.storage.sync.get({ bookmarks: [] }, function (result) {
            var bookmarks = result.bookmarks;
            bookmarks.forEach(bookmark => addBookmarkToTable(bookmark));
        });
    }

    loadBookmarksFromStorage();
});
