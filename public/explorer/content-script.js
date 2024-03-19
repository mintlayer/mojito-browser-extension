function start() {
  window.addEventListener('InitWalletRequest', function (evt) {
    var content = {
      type: 'MOJITO_INIT',
      version: chrome.runtime.getManifest().version,
      extension_id: chrome.runtime.id,
    }
    var event = new CustomEvent('InitWalletResponse', { detail: content })
    window.dispatchEvent(event)
  })
}

start()
