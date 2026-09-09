/* eslint-disable no-undef */
/* global chrome */

/**
 * SECURITY CONTRACT — dApp connections are PERMISSION-LEVEL AUTHORIZATIONS.
 *
 * - A grant is created ONLY by an explicit user approval (handlePopupResponse
 *   with a connect result) and stored per-origin in `connectedSites`.
 * - A grant is revoked IMMEDIATELY and durably on disconnect — from the
 *   dApp itself (`disconnect` method), from the wallet settings
 *   (`disconnectSite`), or on wallet lock/logout — and every revocation is
 *   persisted to storage and PROPAGATED to the site's open tabs
 *   (notifyOriginRevoked), so no page keeps acting on a dead grant.
 * - No code path may return wallet addresses (getSession/connect/
 *   checkConnection/signTransaction/signChallenge) without a live grant.
 * - Any change to these handlers must keep this invariant and add a
 *   regression test (see public/background.test.js).
 */

;(function () {
  // Detect browser API (Chrome or Firefox)
  const api = typeof browser !== 'undefined' ? browser : chrome

  // One slot tracks the state of each approval surface: connect vs signing.
  // Approvals open either in the browser side panel (panelMode) or, when the
  // panel cannot be opened, in a popup window — each slot remembers which.
  const createApprovalSlot = () => ({
    id: false,
    opening: false,
    requestId: null,
    panelMode: false,
    windowId: null,
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

  // --- Self-healing content-script injection -------------------------------
  // When the extension is reloaded/updated, Chrome wipes the old content
  // scripts (and the page-world window.mojito) from already-open tabs and
  // re-injects at nondeterministic times — so a dApp's first connect after
  // a reload can fail with "wallet not found". On install/update/reload
  // (runtime.onInstalled) and browser start (onStartup), ping every open
  // tab's content script and re-inject where it is dead.
  const CONTENT_SCRIPT_FILE = 'explorer/content-script.js'

  const ensureContentScript = (tabId) => {
    if (typeof tabId !== 'number') return
    api.tabs.sendMessage(tabId, { type: 'MOJITO_PING' }, () => {
      // lastError = no live content script in that tab: inject a fresh one.
      // (Restricted pages like chrome:// simply error here too — ignored.)
      if (!api.runtime.lastError) return
      api.scripting
        .executeScript({
          target: { tabId },
          files: [CONTENT_SCRIPT_FILE],
        })
        .catch((error) => {
          console.error(
            '[Mintlayer] content-script re-injection failed:',
            error.message,
          )
        })
    })
  }

  const sweepAllTabs = () => {
    api.tabs.query({}, (tabs) => {
      if (api.runtime.lastError) return
      for (const tab of tabs) {
        if (typeof tab.id === 'number') ensureContentScript(tab.id)
      }
    })
  }

  api.runtime.onInstalled.addListener(() => {
    sweepAllTabs()
  })
  if (api.runtime.onStartup) {
    api.runtime.onStartup.addListener(() => {
      sweepAllTabs()
    })
  }

  // Load connected sites from storage. Messages arriving before the load
  // completes are queued: acting on a half-loaded session map would tell
  // already-connected sites they are NOT_CONNECTED.
  let connectedSitesLoaded = false
  const messageQueue = []
  api.storage.local.get(['connectedSites'], (data) => {
    if (api.runtime.lastError) {
      console.error('[Mintlayer] Storage get error:', api.runtime.lastError)
    } else {
      connectedSites = data.connectedSites || {}
    }
    // one-time cleanup of the pre-window-keyed pending request
    api.storage.local.remove('pendingRequest')
    connectedSitesLoaded = true
    for (const [queuedMessage, queuedSender, queuedResponse] of messageQueue) {
      processMessage(queuedMessage, queuedSender, queuedResponse)
    }
    messageQueue.length = 0
  })

  const pendingRequestKeyFor = (windowId) => `pendingRequest:${windowId}`

  const clearPendingRequest = (windowId) => {
    if (typeof windowId !== 'number') return
    api.storage.local.remove(pendingRequestKeyFor(windowId), () => {
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

  // Errors sent to dApps are `{ code, message }` so the caller can
  // distinguish rejected / cancelled / busy / not-connected without string
  // sniffing. Keep messages free of wallet-brand words: the bridge shows an
  // "install the wallet" hint when an error message matches /mojito/i.
  const errorOf = (code, message) => ({ code, message })

  // Side-panel approvals wait a short moment for the panel to confirm it
  // actually rendered the request. Chrome silently no-ops sidePanel.open()
  // when it is called without a user gesture — without this ack-or-fallback
  // the dApp would hang with NO approval surface at all.
  const PANEL_ACK_TIMEOUT_MS = 2000
  const approvalAcks = new Map() // requestId -> timeout id

  // Revocation must reach open dApp tabs: broadcast to every tab, the
  // content script filters by its own origin. Rare + tiny, so spraying is
  // acceptable and needs no extra permissions.
  const notifyOriginRevoked = (origin) => {
    if (!origin || !api.tabs?.query || !api.tabs?.sendMessage) return
    api.tabs.query({}, (tabs) => {
      if (api.runtime.lastError) return
      for (const tab of tabs) {
        if (typeof tab.id !== 'number') continue
        api.tabs.sendMessage(
          tab.id,
          { type: 'MOJITO_SESSION_REVOKED', origin },
          () => {
            // no content script in that tab — expected, ignore
          },
        )
      }
    })
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
  const failSlot = (slot, error) => {
    const windowId = slot.panelMode ? slot.windowId : slot.id
    slot.id = false
    slot.opening = false
    slot.panelMode = false

    if (!slot.requestId) return

    const respond = pendingResponses.get(slot.requestId)
    pendingResponses.delete(slot.requestId)
    slot.requestId = null
    clearPendingRequest(windowId)
    respond?.({ error })
  }

  // Opens the approval in the browser side panel docked to the dApp's
  // window. The request is keyed by that window id so the panel reads its
  // own. Falls back to a popup when the panel cannot be opened.
  const openPanelApproval = (
    slot,
    request,
    sendResponse,
    sender,
    onFallback,
  ) => {
    const windowId = sender.tab.windowId
    slot.panelMode = true
    slot.windowId = windowId
    slot.opening = true
    slot.requestId = request.requestId
    pendingResponses.set(request.requestId, sendResponse)

    api.storage.local.set(
      { [pendingRequestKeyFor(windowId)]: { ...request, windowId } },
      () => {
        if (api.runtime.lastError) {
          console.error('[Mintlayer] Storage set error:', api.runtime.lastError)
          failSlot(
            slot,
            errorOf(
              'STORAGE_ERROR',
              'Could not create the wallet request. Please try again.',
            ),
          )
          return
        }

        // Chrome silently no-ops sidePanel.open() without a user gesture:
        // the promise resolves but nothing opens. If the panel does not
        // confirm it rendered the approval within the timeout, fall back to
        // a popup window so the dApp always gets an approval surface.
        const ackTimer = setTimeout(() => {
          approvalAcks.delete(request.requestId)
          console.error(
            '[Mojito] side panel did not display the approval — using a popup window',
          )
          pendingResponses.delete(request.requestId)
          slot.requestId = null
          slot.panelMode = false
          slot.windowId = null
          api.storage.local.remove(pendingRequestKeyFor(windowId))
          onFallback()
        }, PANEL_ACK_TIMEOUT_MS)
        approvalAcks.set(request.requestId, ackTimer)

        api.sidePanel
          .open({ tabId: sender.tab.id })
          .then(() => {
            // the panel displayed the approval; keep the slot open until
            // the response arrives
            slot.opening = false
          })
          .catch((error) => {
            console.error(
              '[Mojito] sidePanel.open failed, using a popup window:',
              error,
            )
            clearTimeout(approvalAcks.get(request.requestId))
            approvalAcks.delete(request.requestId)
            // roll back the panel registration and use a popup instead
            pendingResponses.delete(request.requestId)
            slot.requestId = null
            slot.panelMode = false
            slot.windowId = null
            // the popup fallback re-opens the slot: without this reset the
            // fallback hits openPopupApproval's busy guard and the dApp is
            // answered REQUEST_IN_PROGRESS instead of getting a window
            slot.opening = false
            api.storage.local.remove(pendingRequestKeyFor(windowId))
            onFallback()
          })
      },
    )
  }

  // Chooses the approval surface: side panel for the dApp's window when the
  // browser supports it, popup window otherwise. Returns true while the
  // dApp's message channel stays open.
  const openApprovalTarget = (slot, request, sendResponse, sender) => {
    const canUsePanel =
      Boolean(api.sidePanel?.open) &&
      sender?.tab?.id != null &&
      sender?.tab?.windowId != null

    if (!canUsePanel) {
      return openPopupApproval(slot, request, sendResponse)
    }

    const busy =
      slot.opening ||
      (typeof slot.id === 'number' && !slot.panelMode) ||
      (slot.panelMode && slot.requestId != null)

    if (busy) {
      // surface the pending request again
      api.sidePanel.open({ tabId: sender.tab.id }).catch(() => {})
      sendResponse({
        error: errorOf(
          'REQUEST_IN_PROGRESS',
          'An approval is already pending. Complete or reject it first.',
        ),
      })
      return false
    }

    openPanelApproval(slot, request, sendResponse, sender, () => {
      openPopupApproval(slot, request, sendResponse)
    })
    return true
  }

  // Popup fallback: opens one approval window for the request and keeps the
  // dApp's message channel open until the wallet answers.
  const openPopupApproval = (slot, request, sendResponse) => {
    if (typeof slot.id === 'number' || slot.opening) {
      if (typeof slot.id === 'number') focusWindow(slot.id)
      sendResponse({
        error: errorOf(
          'REQUEST_IN_PROGRESS',
          'An approval window is already open. Complete or close it first.',
        ),
      })
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
          failSlot(slot, errorOf('REQUEST_CANCELLED', 'Request cancelled'))
          return
        }

        // The window may have been closed while it was being created, in
        // which case onRemoved fired before the id was tracked.
        api.windows.get(slot.id, (existing) => {
          if (api.runtime.lastError || !existing) {
            // check lastError: a failed lookup used to log
            // "Unchecked runtime.lastError" alongside the intended path
            failSlot(slot, errorOf('REQUEST_CANCELLED', 'Request cancelled'))
            return
          }

          // Keyed by window id: two approval windows can be open at once
          // (a connect and a signing) and must never overwrite each other's
          // request — the popup approves what ITS window was opened for.
          api.storage.local.set(
            { [pendingRequestKeyFor(slot.id)]: request },
            () => {
              if (api.runtime.lastError) {
                console.error(
                  '[Mintlayer] Storage set error:',
                  api.runtime.lastError,
                )
                failSlot(
                  slot,
                  errorOf(
                    'STORAGE_ERROR',
                    'Could not create the wallet request. Please try again.',
                  ),
                )
              }
            },
          )
        })
      },
    )

    return true
  }

  // Handle popup responses from the wallet UI
  const handlePopupResponse = (message) => {
    const { requestId, origin, result, error, method, windowId } = message
    const respond = pendingResponses.get(requestId)
    pendingResponses.delete(requestId)
    clearPendingRequest(windowId)

    // release the owning approval slot (panel-mode slots have no
    // window-removed event to reset them)
    for (const slot of [connectSlot, popupSlot]) {
      if (slot.requestId === requestId) {
        slot.id = false
        slot.opening = false
        slot.panelMode = false
        slot.requestId = null
      }
    }

    if (!respond) {
      console.warn('[Mintlayer] Response for unknown request:', requestId)
      return
    }

    const rejected =
      !result || Boolean(error) || (method && method.endsWith('_reject'))

    if (rejected) {
      respond({
        error:
          error ||
          errorOf('USER_REJECTED', 'User rejected the request in the wallet'),
      })
      return
    }

    if (method === 'connect' && origin) {
      connectedSites[origin] = {
        // `address` is the network-keyed map for the injected SDK's
        // isConnected(); `addressesByChain` is what the @mintlayer/sdk
        // Client.connect()/restore() consume; `network` records which
        // network the grant was made on so signing can detect a switch.
        address: result.address,
        addressesByChain: result.addressesByChain,
        network: result.network,
        timestamp: Date.now(),
      }
      api.storage.local.set({ connectedSites }, () => {
        if (api.runtime.lastError) {
          console.error('[Mintlayer] Storage set error:', api.runtime.lastError)
          respond({
            error: errorOf(
              'STORAGE_ERROR',
              'Could not save the wallet connection. Please try again.',
            ),
          })
          return
        }
        respond({ result })
      })
      return
    }

    respond({ result, error })
  }

  const processMessage = (message, sender, sendResponse) => {
    const origin = getRequestOrigin(sender)

    // Wallet-UI-only actions. These must be checked before dApp requests:
    // approval messages also carry a method field.
    if (message.action === 'popupResponse') {
      if (!isFromExtensionPage(sender)) return false
      handlePopupResponse(message)
      return false
    }

    if (message.action === 'approvalDisplayed') {
      // the panel confirmed it rendered the request: cancel the popup
      // fallback for that request
      if (!isFromExtensionPage(sender)) return false
      const timer = approvalAcks.get(message.requestId)
      if (timer) {
        clearTimeout(timer)
        approvalAcks.delete(message.requestId)
      }
      for (const slot of [connectSlot, popupSlot]) {
        if (slot.requestId === message.requestId) slot.opening = false
      }
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
        notifyOriginRevoked(targetOrigin)
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

      return openApprovalTarget(
        connectSlot,
        {
          origin,
          requestId: message.requestId,
          permissions: message.params?.permissions || [],
          action: 'connect',
        },
        sendResponse,
        sender,
      )
    } else if (message.method === 'signTransaction') {
      if (!connectedSites[origin]) {
        sendResponse({
          error: errorOf(
            'NOT_CONNECTED',
            'This site is not connected to the wallet. Call connect first.',
          ),
        })
        return false
      }

      return openApprovalTarget(
        popupSlot,
        {
          origin,
          requestId: message.requestId,
          action: 'signTransaction',
          data: message.params || {},
          // The network the grant was made on: the approval UI compares it
          // with the wallet's active network so we never sign on the wrong
          // chain after a network switch.
          network: connectedSites[origin]?.network,
        },
        sendResponse,
        sender,
      )
    } else if (message.method === 'signChallenge') {
      if (!connectedSites[origin]) {
        sendResponse({
          error: errorOf(
            'NOT_CONNECTED',
            'This site is not connected to the wallet. Call connect first.',
          ),
        })
        return false
      }

      return openApprovalTarget(
        popupSlot,
        {
          origin,
          requestId: message.requestId,
          action: 'signChallenge',
          data: message.params || {},
          network: connectedSites[origin]?.network,
        },
        sendResponse,
        sender,
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
            sendResponse({
              error: errorOf(
                'STORAGE_ERROR',
                'Could not disconnect the site. Please try again.',
              ),
            })
            return
          }
          notifyOriginRevoked(origin)
          sendResponse({ result: true })
        })
        return true
      }

      sendResponse({ result: true })
    } else if (message.method === 'getSession') {
      // Origin MUST come from the browser's `sender` — a caller-supplied
      // origin would let any page read another origin's session.
      const session = connectedSites[origin]

      if (session && session.address) {
        sendResponse({
          result: {
            address: session.address,
            addressesByChain: session.addressesByChain,
            network: session.network,
          },
        })
      } else {
        sendResponse({ result: null })
      }

      return true
    } else {
      sendResponse({
        error: errorOf(
          'UNSUPPORTED_METHOD',
          `Unsupported wallet method: ${message.method}`,
        ),
      })
    }

    return false
  }

  // Single listener for all messages. Queue everything until the persisted
  // session map is loaded — answering a "connect" against a half-loaded map
  // would tell already-connected sites they are not connected.
  api.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (!connectedSitesLoaded) {
      messageQueue.push([message, sender, sendResponse])
      return true
    }
    return processMessage(message, sender, sendResponse)
  })

  // Clean up window state and answer waiting dApps when an approval window
  // is closed without a decision.
  api.windows.onRemoved.addListener((winId) => {
    if (popupSlot.id === winId) {
      failSlot(popupSlot, errorOf('REQUEST_CANCELLED', 'Request cancelled'))
    }
    if (connectSlot.id === winId) {
      failSlot(connectSlot, errorOf('REQUEST_CANCELLED', 'Request cancelled'))
    }
  })

  console.log('[Mintlayer Extension] Background script loaded')
})()
