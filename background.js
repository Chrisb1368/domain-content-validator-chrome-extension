chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.save) {
      chrome.storage.session.set({suspicious: request.suspicious, urlPath: request.path});
    }
    return true;
});

chrome.tabs.onUpdated.addListener(async (tabId, change, tab)=> {
  if (change.status != "complete") return; //do not open until tab is completly loaded

  let {urlPath} = await chrome.storage.session.get("urlPath");

  if (urlPath == "" || !tab.url.includes(urlPath)) {
    chrome.tabs.sendMessage(tabId, {exe: true});
  }
});

chrome.tabs.onActivated.addListener(function(activeInfo) {
  let tabId = activeInfo.tabId;

  chrome.tabs.sendMessage(tabId, {exe: true});
});