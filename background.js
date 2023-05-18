// background.js
chrome.runtime.onInstalled.addListener(() => {
    console.log('Background script installed');
  });
  
  // Listen for messages from the popup script
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Here you could handle different types of messages and perform various tasks
    // For instance, updating a bookmark's URL from the popup script could look like this:
  
    if (request.action === 'updateBookmarkUrl') {
      var bookmarkId = request.id;
      var newUrl = request.url;
      // Perform some operation on the bookmark with the given id
      console.log(`Bookmark ${bookmarkId} URL updated to ${newUrl}`);
    }
  });
  
  console.log('Background script running');
  