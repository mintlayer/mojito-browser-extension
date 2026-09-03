/* eslint-disable no-undef */
/* global chrome */

;(function () {
  // Detect browser API (Chrome or Firefox)
  const api = typeof browser !== 'undefined' ? browser : chrome

  // One slot tracks the state of each approval window: connect vs signing.
  const createApprovalSlot = () => ({
    id: false,
    opening: false,
    requestId: null,
  })

  const popupSlot = createApprovalSlot()
  const connectSlot = createApprovalSlot()
  let connectedSites = {}
  const pendingResponses = new Map()

  // Open the wallet in the browser side panel when the toolbar icon is clicked
  if (api.sidePanel && api.sidePanel.setPanelBehavior) {
    api.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) =>
        console.error('[Mintlayer] setPanelBehavior error:', error),
      )
  }

  // Firefox has no side panel: open the sidebar instead
  if (api.sidebarAction && api.action && api.action.onClicked) {
    api.action.onClicked.addListener(() => {
      api.sidebarAction.open().catch((error) => {
        console.error('[Mintlayer] sidebarAction.open error:', error)
      })
    })
  }

  // Load connected sites from storage
  api.storage.local.get(['connectedSites'], (data) => {
    if (api.runtime.lastError) {
      console.error('[Mintlayer] Storage get error:', api.runtime.lastError)
      return
    }
    connectedSites = data.connectedSites || {}
  })

  const clearPendingRequest = () => {
    api.storage.local.remove('pendingRequest', () => {
      if (api.runtime.lastError) {
        console.error(
          '[Mintlayer] Storage remove error:',
          api.runtime.lastError,
        )
      }
    })
  }

  const getRequestOrigin = (sender) => {
    if (sender.origin) return sender.origin

    try {
      return sender.url ? new URL(sender.url).origin : 'unknown'
    } catch {
      return 'unknown'
    }
  }

  // Approval responses and disconnections must come from the wallet's own
  // pages, never from a content script injected into a website.
  const isFromExtensionPage = (sender) =>
    sender.id === api.runtime.id &&
    typeof sender.url === 'string' &&
    sender.url.startsWith(api.runtime.getURL(''))

  const focusWindow = (windowId) => {
    api.windows.update(windowId, { focused: true }, () => {
      if (api.runtime.lastError) {
        console.error('[Mintlayer] Window focus error:', api.runtime.lastError)
      }
    })
  }

  // Fails a pending approval: clears the slot and answers the waiting dApp.
  const failSlot = (slot, errorMessage) => {
    slot.id = false
    slot.opening = false

    if (!slot.requestId) return

    const respond = pendingResponses.get(slot.requestId)
    pendingResponses.delete(slot.requestId)
    slot.requestId = null
    clearPendingRequest()
    respond?.({ error: errorMessage })
  }

  // Opens one approval window for the request and keeps the dApp's message
  // channel open until the wallet answers. Returns true while waiting.
  const openApprovalWindow = (slot, request, sendResponse, busyError) => {
    if (typeof slot.id === 'number' || slot.opening) {
      if (typeof slot.id === 'number') focusWindow(slot.id)
      sendResponse({ error: busyError })
      return false
    }

    slot.opening = true
    slot.requestId = request.requestId
    pendingResponses.set(request.requestId, sendResponse)

    api.windows.create(
      {
        url: api.runtime.getURL('popup.html'),
        type: 'popup',
        width: 800,
        height: 600,
        focused: true,
      },
      (win) => {
        slot.opening = false
        slot.id = win?.id ?? false

        if (typeof slot.id !== 'number') {
          failSlot(slot, 'Request cancelled')
          return
        }

        // The window may have been closed while it was being created, in
        // which case onRemoved fired before the id was tracked.
        api.windows.get(slot.id, (existing) => {
          if (!existing) {
            failSlot(slot, 'Request cancelled')
            return
          }

          api.storage.local.set({ pendingRequest: request }, () => {
            if (api.runtime.lastError) {
              console.error(
                '[Mintlayer] Storage set error:',
                api.runtime.lastError,
              )
              failSlot(slot, 'Could not create the wallet request')
            }
          })
        })
      },
    )

    return true
  }

  // Handle popup responses from the wallet UI
  const handlePopupResponse = (message) => {
    const { requestId, origin, result, error, method } = message
    const respond = pendingResponses.get(requestId)
    pendingResponses.delete(requestId)
    clearPendingRequest()

    if (!respond) {
      console.warn('[Mintlayer] Response for unknown request:', requestId)
      return
    }

    const rejected =
      !result || Boolean(error) || (method && method.endsWith('_reject'))

    if (rejected) {
      respond({ error: error || 'User rejected the request' })
      return
    }

    if (method === 'connect' && origin) {
      connectedSites[origin] = {
        address: result.address,
        timestamp: Date.now(),
      }
      api.storage.local.set({ connectedSites }, () => {
        if (api.runtime.lastError) {
          console.error('[Mintlayer] Storage set error:', api.runtime.lastError)
          respond({ error: 'Could not save the wallet connection' })
          return
        }
        respond({ result })
      })
      return
    }

    respond({ result, error })
  }

  // Single listener for all messages
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const origin = getRequestOrigin(sender)

    // Wallet-UI-only actions. These must be checked before dApp requests:
    // approval messages also carry a method field.
    if (message.action === 'popupResponse') {
      if (!isFromExtensionPage(sender)) return false
      handlePopupResponse(message)
      return false
    }

    if (message.action === 'disconnectSite') {
      if (!isFromExtensionPage(sender)) return false

      const targetOrigin = message.origin

      if (!targetOrigin || !connectedSites[targetOrigin]) {
        sendResponse({ result: null })
        return false
      }

      delete connectedSites[targetOrigin]
      api.storage.local.set({ connectedSites }, () => {
        if (api.runtime.lastError) {
          console.error('[Mintlayer] Storage set error:', api.runtime.lastError)
          sendResponse({ error: api.runtime.lastError.message })
          return
        }
        sendResponse({ result: { origin: targetOrigin } })
      })
      return true
    }

    if (!message.method) return false

    // Handle requests from content.js
    if (message.method === 'checkConnection') {
      sendResponse({
        result: { isConnected: !!connectedSites[origin] },
      })
    } else if (message.method === 'connect') {
      // Already connected: answer immediately instead of asking again.
      if (connectedSites[origin]) {
        sendResponse({ result: connectedSites[origin] })
        return false
      }

      return openApprovalWindow(
        connectSlot,
        {
          origin,
          requestId: message.requestId,
          permissions: message.params?.permissions || [],
          action: 'connect',
        },
        sendResponse,
        'Connection window already open',
      )
    } else if (message.method === 'signTransaction') {
      if (!connectedSites[origin]) {
        sendResponse({ error: 'Not connected. Call connect first.' })
        return false
      }

      return openApprovalWindow(
        popupSlot,
        {
          origin,
          requestId: message.requestId,
          action: 'signTransaction',
          data: message.params || {},
        },
        sendResponse,
        'Transaction signing window already open',
      )
    } else if (message.method === 'signChallenge') {
      if (!connectedSites[origin]) {
        sendResponse({ error: 'Not connected. Call connect first.' })
        return false
      }

      return openApprovalWindow(
        popupSlot,
        {
          origin,
          requestId: message.requestId,
          action: 'signChallenge',
          data: message.params || {},
        },
        sendResponse,
        'Transaction signing window already open',
      )
    } else if (message.method === 'version') {
      sendResponse({ result: api.runtime.getManifest().version })
    } else if (message.method === 'disconnect') {
      if (connectedSites[origin]) {
        delete connectedSites[origin]
        api.storage.local.set({ connectedSites }, () => {
          if (api.runtime.lastError) {
            console.error(
              '[Mintlayer] Storage set error:',
              api.runtime.lastError,
            )
            sendResponse({ error: 'Could not disconnect the site' })
            return
          }
          sendResponse({ result: true })
        })
        return true
      }

      sendResponse({ result: true })
    } else if (message.method === 'getSession') {
      const sessionOrigin = message.origin || origin
      const session = connectedSites[sessionOrigin]

      if (session && session.address) {
        sendResponse({
          result: {
            address: session.address,
          },
        })
      } else {
        sendResponse({ result: null })
      }

      return true
    } else {
      sendResponse({ error: 'Unknown method' })
    }

    return false
  })

  // Clean up window state and answer waiting dApps when an approval window
  // is closed without a decision.
  api.windows.onRemoved.addListener((winId) => {
    if (popupSlot.id === winId) failSlot(popupSlot, 'Request cancelled')
    if (connectSlot.id === winId) failSlot(connectSlot, 'Request cancelled')
  })

  console.log('[Mintlayer Extension] Background script loaded')
})()
