/* eslint-disable no-undef */
let popupWindowId = null
let connectWindowId = null
let isPopupOpening = false

browser.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener((msg) => {
    if (msg && msg.myProperty && msg.myProperty.message) {
      switch (msg.myProperty.message.message) {
        case 'version':
          port.postMessage({ version: browser.runtime.getManifest().version })
          break
        case 'connect':
          handleConnect(msg, port)
          break
        case 'delegate':
          handleDelegate(msg)
          break
        case 'stake':
          handleStake(msg)
          break
        default:
          console.log('Unknown message')
      }
    }
  })

  async function handleConnect(request, port) {
    if (connectWindowId === null) {
      await createPopup('popup.html', async (win) => {
        connectWindowId = win.id
        setTimeout(async () => {
          const response = await browser.runtime.sendMessage({
            action: 'connect',
          })
          port.postMessage(response)
        }, 1000)
      })
    } else {
      await browser.windows.update(connectWindowId, { focused: true })
    }
  }

  async function handleDelegate(request) {
    if (popupWindowId === null && !isPopupOpening) {
      isPopupOpening = true
      await createPopup('popup.html', async (win) => {
        popupWindowId = win.id
        isPopupOpening = false
        setTimeout(async () => {
          await browser.runtime.sendMessage({
            action: 'createDelegate',
            data: {
              pool_id: request.myProperty.message.pool_id,
              referral_code: request.myProperty.message.referral_code || '',
            },
          })
        }, 1000)
      })
    } else if (popupWindowId !== null) {
      await browser.windows.update(popupWindowId, { focused: true })
    }
  }

  async function handleStake(request) {
    if (popupWindowId === null) {
      await createPopup('popup.html', async (win) => {
        popupWindowId = win.id
        setTimeout(async () => {
          await browser.runtime.sendMessage({
            action: 'addStake',
            data: {
              delegation_id: request.delegation_id,
              amount: request.amount,
            },
          })
        }, 1000)
      })
    } else {
      await browser.windows.update(popupWindowId, { focused: true })
    }
  }

  function createPopup(url, callback) {
    return new Promise((resolve, reject) => {
      browser.windows
        .create({
          url: browser.runtime.getURL(url),
          type: 'popup',
          width: 800,
          height: 630,
          focused: true,
        })
        .then((win) => {
          resolve(callback(win))
        })
        .catch((error) => {
          reject(error)
        })
    })
  }
  browser.windows.onRemoved.addListener((winId) => {
    if (popupWindowId === winId) {
      popupWindowId = null
    }
    if (connectWindowId === winId) {
      connectWindowId = null
    }
  })
})
