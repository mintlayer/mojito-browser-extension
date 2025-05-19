// mojito.js — injected SDK
import { APP_VERSION } from '@Version'
;(function () {
  const NETWORKS = {
    mainnet: 'mainnet',
    testnet: 'testnet',
  }

  const mojito = {
    isExtension: true,
    version: APP_VERSION,
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
            if (data.error) reject(new Error(data.error))
            else resolve(data.result)
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
      mojito.connectedAddresses = result || {}
      return mojito.connectedAddresses
    },

    async restore() {
      return new Promise((resolve) => {
        const origin = window.location.origin
        const requestId = '__restore'

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

            if (data.result?.address) {
              mojito.connectedAddresses = data.result.address
              resolve(data.result.address)
            } else {
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

    disconnect() {
      mojito.connectedAddresses = []
      window.postMessage(
        {
          type: 'MINTLAYER_EVENT',
          event: 'disconnect',
          data: {},
        },
        '*',
      )
    },
  }

  if (!window.mojito) {
    window.mojito = mojito
    console.log('[Mojito] SDK injected')
  }
})()
