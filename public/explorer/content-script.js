/* eslint-disable no-undef */
function start() {
  const api = typeof browser !== 'undefined' ? browser : chrome
  window.addEventListener('InitWalletRequest', function (evt) {
    var content = {
      type: 'MOJITO_INIT',
      version: api.runtime.getManifest().version,
      extension_id: api.runtime.id,
    }

    if (typeof cloneInto !== 'undefined') {
      // Firefox
      content = cloneInto(content, window)
    }

    var event = new CustomEvent('InitWalletResponse', { detail: content })

    window.dispatchEvent(event)
    window.addEventListener('message', (event) => {
      if (
        event.source == window &&
        event.data &&
        event.data.direction == 'from-page-script'
      ) {
        const port = browser.runtime.connect({ name: 'my-connection' })
        port.postMessage({ myProperty: event.data })
      }
    })
  })
}

start()
