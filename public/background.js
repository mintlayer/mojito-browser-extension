/* eslint-disable max-depth */
/* global chrome */

var popupWindowId = false
var connectWindowId = false

chrome.runtime.onMessageExternal.addListener(
  function (request, sender, sendResponse) {
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
                url: chrome.runtime.getURL('popup.html'),
                type: 'popup',
                width: 800,
                height: 600,
                focused: true,
              },
              function (win) {
                connectWindowId = win.id
                setTimeout(function () {
                  chrome.runtime.sendMessage(
                    {
                      action: 'connect',
                    },
                    function (response) {
                      sendResponse(response)
                    },
                  )
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
                url: chrome.runtime.getURL('popup.html'),
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
                    data: {
                      pool_id: request.pool_id,
                      referral_code: request.referral_code || '',
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

        if (request.message === 'output') {
          if (popupWindowId === false) {
            popupWindowId = true
            chrome.windows.create(
              {
                url: chrome.runtime.getURL('popup.html'),
                type: 'popup',
                width: 800,
                height: 600,
                focused: true,
              },
              function (win) {
                popupWindowId = win.id
                setTimeout(function () {
                  chrome.runtime.sendMessage({
                    action: 'customOutput',
                    data: {
                      output: request.output,
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

        if (request.message === 'stake') {
          if (popupWindowId === false) {
            popupWindowId = true
            chrome.windows.create(
              {
                url: chrome.runtime.getURL('popup.html'),
                type: 'popup',
                width: 800,
                height: 630,
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
  },
)

chrome.windows.onRemoved.addListener(function (winId) {
  if (popupWindowId === winId) {
    popupWindowId = false
  }
  if (connectWindowId === winId) {
    connectWindowId = false
  }
})
