// Usage example
const bookmarkManager = new BookmarkManager('bookmarksTable');

document.addEventListener('DOMContentLoaded', function () {
    var addButton = document.getElementById('addButton');

    addButton.addEventListener('click', function () {
        bookmarkManager.addBookmarkFromPage();
    });
    document.getElementById('clearAllButton').addEventListener('click', function () {
        chrome.storage.sync.set({ bookmarks: [] }, function () {
            var table = document.getElementById('bookmarksTable').getElementsByTagName('tbody')[0];
            table.innerHTML = "";  // Clear the table
        });
    });

    function isJsonString(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }
        return true;
    }

    loadBookmarksFromStorage();

    // Export function
    function exportData() {
        // Fetch the bookmarks from chrome storage
        chrome.storage.sync.get({ bookmarks: [] }, function (result) {
            var dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(result.bookmarks));
            var downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "bookmarks_export.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        });
    }

    // Import function
    function importData() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'application/json';

        input.onchange = function (event) {
            var reader = new FileReader();
            reader.onload = function () {
                var bookmarks = JSON.parse(reader.result);
                chrome.storage.sync.set({ bookmarks: bookmarks }, function () {
                    alert("Bookmarks Imported Successfully");
                });
            };
            reader.readAsText(event.target.files[0]);
        };

        input.click();
    }

    document.getElementById('export').addEventListener('click', exportData);
    document.getElementById('import').addEventListener('click', importData);

    // Add Column Resize Support
    document.querySelectorAll('th').forEach(th => {
        const grip = document.createElement('div');
        grip.innerHTML = "&nbsp;";
        grip.style.cursor = 'col-resize';
        grip.style.top = 0;
        grip.style.right = 0;
        grip.style.bottom = 0;
        grip.style.width = '5px';
        grip.style.position = 'absolute';
        grip.style.zIndex = '10';
        grip.addEventListener('mousedown', e => {
            const thElm = th;
            const startOffset = th.offsetWidth - e.pageX;

            const mouseMoveHandler = function (e) {
                thElm.style.width = startOffset + e.pageX + 'px';
            };
            const mouseUpHandler = function () {
                thElm.style.userSelect = 'auto';
                document.removeEventListener('mousemove', mouseMoveHandler);
                document.removeEventListener('mouseup', mouseUpHandler);
            };

            thElm.style.userSelect = 'none';
            document.addEventListener('mousemove', mouseMoveHandler);
            document.addEventListener('mouseup', mouseUpHandler);
        });
        th.style.position = 'relative';
        th.appendChild(grip);
    });

});
