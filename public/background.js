/* global chrome */

var popupWindowId = false
var connectWindowId = false

// long-lived connection
chrome.runtime.onConnect.addListener(function (port) {
  port.onMessage.addListener(function (msg) {
    if (msg.action === 'connect') {
      console.log('background connect')
      chrome.runtime.sendMessage({
        action: 'connect',
      })
    }
  })
})

chrome.runtime.onMessageExternal.addListener(function (
  request,
  sender,
  sendResponse,
) {
  if (request) {
    if (request.message) {
      if (request.message === 'version') {
        sendResponse({ version: chrome.runtime.getManifest().version })
      }

      if (request.message === 'connect') {
        if (connectWindowId === false) {
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
              connectWindowId = win.id
              setTimeout(function () {
                chrome.runtime.sendMessage({
                  action: 'connect',
                }, function (response) {
                  sendResponse(response)
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

      if (request.message === 'stake') {
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
                  action: 'addStake',
                  data: {
                    delegation_id: request.delegation_id,
                    amount: request.amount,
                  },
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
  if (connectWindowId === winId) {
    connectWindowId = false
  }
})
