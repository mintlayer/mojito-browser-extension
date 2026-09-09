// mojito.js — injected SDK
//
// SECURITY NOTE: a wallet connection is a PERMISSION-LEVEL AUTHORIZATION.
// This provider must never return addresses without a live grant, and when
// the wallet revokes (settings disconnect / dApp disconnect) this provider
// clears its cached state and notifies the page so no stale session keeps
// acting as connected.

// eslint-disable-next-line no-extra-semi
;(function () {
  const NETWORKS = {
    mainnet: 'mainnet',
    testnet: 'testnet',
  }

  const mojito = {
    isExtension: true,
    version: '__APP_VERSION__',
    connectedAddresses: [],
    network: NETWORKS['testnet'], // default network

    isConnected() {
      return mojito.connectedAddresses[this.network]?.receiving?.length > 0
    },

    async request(method, params = {}) {
      return new Promise((resolve, reject) => {
        const requestId = Math.random().toString(36).substring(2)

        function handle(event) {
          if (event.source !== window) return
          const data = event.data
          if (
            data?.type === 'MINTLAYER_RESPONSE' &&
            data.requestId === requestId
          ) {
            window.removeEventListener('message', handle)
            if (data.error) {
              // Errors are `{ code, message }` (or a legacy plain string) so
              // callers can distinguish rejected / locked / cancelled /
              // wrong-network instead of string-sniffing.
              const err =
                typeof data.error === 'string'
                  ? new Error(data.error)
                  : new Error(data.error?.message || 'Wallet request failed')
              if (data.error?.code) err.code = data.error.code
              reject(err)
            } else {
              resolve(data.result)
            }
          }
        }

        window.addEventListener('message', handle)
        window.postMessage(
          {
            type: 'MINTLAYER_REQUEST',
            requestId,
            method,
            params,
          },
          '*',
        )
      })
    },

    async connect() {
      const result = await mojito.request('connect')
      // The session carries the per-network map under `address`; older
      // responses may already be that map.
      const map = result?.address ?? result ?? {}
      mojito.connectedAddresses = map
      if (result?.network) {
        mojito.network = result.network
      }
      // The @mintlayer/sdk Client.connect() reads
      // `addresses.addressesByChain.mintlayer` unguarded — a response from
      // a stale popup (map under `address` only) would crash the dApp with
      // "Cannot read properties of undefined (reading 'mintlayer')".
      // Synthesize the chain-keyed view when it is missing so any
      // extension build combination works.
      if (result && typeof result === 'object' && !result.addressesByChain) {
        const mlMap =
          map.mintlayer ?? Object.values(map).find((v) => v?.receiving) ?? {}
        return {
          ...result,
          addressesByChain: {
            mintlayer: {
              receiving: mlMap.receiving ?? [],
              change: mlMap.change ?? [],
              publicKeys: mlMap.publicKeys ?? { receiving: [], change: [] },
            },
          },
        }
      }
      return result
    },

    async restore() {
      return new Promise((resolve) => {
        const origin = window.location.origin
        // Unique per call: a fixed id would make a second concurrent restore
        // be swallowed by the content script's duplicate-request guard and
        // hang forever (e.g. React strict-mode double Client.create()).
        const requestId = `__restore_${Math.random().toString(36).slice(2)}`

        window.postMessage(
          {
            type: 'MINTLAYER_REQUEST',
            requestId,
            method: 'getSession',
            origin,
          },
          '*',
        )

        function handler(event) {
          if (event.source !== window) return
          const data = event.data

          if (
            data?.type === 'MINTLAYER_RESPONSE' &&
            data.requestId === requestId
          ) {
            window.removeEventListener('message', handler)

            const session = data.result
            if (session?.addressesByChain) {
              mojito.connectedAddresses = session.address ?? {}
              if (session.network) {
                mojito.network = session.network
              }
              // Resolve the whole session: the SDK's Client.restore() reads
              // `addressesByChain.mintlayer.receiving` to re-engage.
              resolve(session)
            } else {
              // No grant (or a pre-addressesByChain session): treat as
              // "nothing to restore".
              resolve(null)
            }
          }
        }

        window.addEventListener('message', handler)
      })
    },

    on(event, callback) {
      window.addEventListener('message', (eventObj) => {
        if (
          eventObj.data?.type === 'MINTLAYER_EVENT' &&
          eventObj.data.event === event
        ) {
          callback(eventObj.data.data)
        }
      })
    },

    async disconnect() {
      try {
        // Ask the wallet to drop the session too, not only the page state.
        await mojito.request('disconnect')
      } finally {
        mojito.connectedAddresses = []
        window.postMessage(
          {
            type: 'MINTLAYER_EVENT',
            event: 'disconnect',
            data: {},
          },
          '*',
        )
      }
    },
  }

  if (!window.mojito) {
    window.mojito = mojito
    console.log('[Mojito] SDK injected')

    // A revoked grant clears this provider's cached addresses immediately,
    // whether or not the page subscribed to the event.
    window.addEventListener('message', (event) => {
      if (event.source !== window) return
      if (
        event.data?.type === 'MINTLAYER_EVENT' &&
        event.data.event === 'disconnect'
      ) {
        mojito.connectedAddresses = []
      }
    })
  }
})()
