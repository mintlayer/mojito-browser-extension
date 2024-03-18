/* global chrome */

var popupWindowId = false

chrome.runtime.onMessageExternal.addListener(function (
  request,
  sender,
  sendResponse,
) {
  if (request) {
    if (request.message) {
      if (request.message === 'version') {
        sendResponse({ version: '1.1.8' })
      }

      if (request.message === 'delegate') {
        if (popupWindowId === false) {
          popupWindowId = true
          chrome.windows.create(
            {
              url: chrome.runtime.getURL('index.html'),
              type: 'popup',
              width: 800,
              height: 600,
              focused: true,
            },
            function (win) {
              popupWindowId = win.id
              setTimeout(function () {
                chrome.runtime.sendMessage({
                  action: 'createDelegate',
                  data: { pool_id: request.pool_id },
                })
              }, 1000)
            },
          )
        } else if (typeof popupWindowId === 'number') {
          //The window is open, and the user clicked the button.
          //  Focus the window.
          chrome.windows.update(popupWindowId, { focused: true })
        }
      }
    }
  }
  return true
})

chrome.windows.onRemoved.addListener(function (winId) {
  if (popupWindowId === winId) {
    popupWindowId = false
  }
})
