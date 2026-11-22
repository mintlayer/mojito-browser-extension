/* eslint-disable no-undef */
/* global chrome */

import { LOGIN_TIMEOUT_MINUTES } from '../utils/Constants/WalletLifecycle'

/**
 * SECURITY CONTRACT — dApp connections are PERMISSION-LEVEL AUTHORIZATIONS.
 *
 * - A grant is created ONLY by an explicit user approval (handlePopupResponse
 *   with a connect result) and stored per-origin in `connectedSites`.
 * - A grant is revoked IMMEDIATELY and durably on disconnect — from the
 *   dApp itself (`disconnect` method), from the wallet settings
 *   (`disconnectSite`), or on wallet lock/logout — the wallet UI announces
 *   both with the `walletLocked` action and mirrors its lock clock to
 *   chrome.storage.local ('walletLockAt'), which the worker sweeps against
 *   even when no wallet page is open to observe the 30-minute auto-lock
 *   (the worker cannot read the wallet pages' localStorage) — and every
 *   revocation is persisted to storage and PROPAGATED to the site's open
 *   tabs (notifyOriginRevoked), so no page keeps acting on a dead grant.
 * - A grant authorizes ONLY the network it was approved on. The wallet UI
 *   publishes its active network to chrome.storage.local ('networkType' —
 *   the worker cannot read the wallet pages' localStorage); switching
 *   networks REVOKES every grant approved on another network (with tab
 *   propagation), and connect/checkConnection/getSession re-validate the
 *   grant's network against the CURRENT one before answering — a stale
 *   grant is treated as absent.
 * - No code path may return wallet addresses (getSession/connect/
 *   checkConnection/signTransaction/signChallenge) without a live grant.
 * - Any change to these handlers must keep this invariant and add a
 *   regression test (see src/background/main.test.js).
 */

export const initBackground = () => {
  // Detect browser API (Chrome or Firefox)
  const api = typeof browser !== 'undefined' ? browser : chrome

  // One slot tracks the state of each approval surface: connect vs signing.
  // Approvals open in the browser side panel (panelMode) or, when the panel
  // cannot be opened/displayed, in a popup window — and while a panel
  // approval is pending a popup may open as a SECOND surface (popupWindowId):
  // the first surface to display or answer the request owns it, the loser
  // is dismissed. Each slot remembers which surfaces are live.
  const createApprovalSlot = () => ({
    id: false,
    opening: false,
    requestId: null,
    panelMode: false,
    windowId: null,
    // overlap fallback popup while a panel approval is still pending
    popupWindowId: null,
    // the panel confirmed it displayed the request (owns the approval)
    panelAcked: false,
  })

  const popupSlot = createApprovalSlot()
  const connectSlot = createApprovalSlot()
  let connectedSites = {}
  // The wallet's CURRENT network, as published by the wallet UI to
  // chrome.storage.local ('networkType'). `null` = not published yet (fresh
  // install/update before the UI first opens): grants cannot be
  // re-validated and nothing is revoked until the UI publishes a value.
  let activeNetwork = null
  // Set once the storage.onChanged listener has adopted a network: a boot
  // snapshot landing afterwards is OLDER (read before the switch) and must
  // not revert the adopted value — reverting would un-sweep grants the
  // adoption already revoked.
  let networkAdopted = false
  // The wallet UI mirrors its lock clock here ('walletLockAt' in
  // chrome.storage.local — ms epoch): stamped on pagehide/logout, cleared on
  // unlock/resume. The worker cannot read the wallet pages' localStorage, so
  // without this mirror the 30-minute auto-lock would fire only when a LIVE
  // wallet page happens to re-check — with no page open, locked-wallet
  // grants would keep answering checkConnection/getSession forever, across
  // worker and browser restarts.
  let walletLockAt = null
  // Set once the storage.onChanged listener has adopted a mirror write: a
  // boot snapshot landing afterwards is OLDER (read before the write) and
  // must not revert the adopted value — a stale null would lose the pagehide
  // stamp for this worker's lifetime, a stale expired value would false-sweep
  // an unlocked wallet's live grants at boot.
  let lockMirrorAdopted = false
  // Same expiry semantics as AccountProvider.checkAccountLockState: whole
  // minutes since the stamp, rounded up.
  const isLockMirrorExpired = (value) =>
    typeof value === 'number' &&
    Math.ceil((Date.now() - value) / 60000) >= LOGIN_TIMEOUT_MINUTES
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

  // The wallet content script can only live on web pages. Restricted
  // targets (chrome://, about:, file:, other extensions' pages...) can
  // never be injected into — attempting it only produces permission
  // errors — so they are skipped up front. A hidden URL (undefined, e.g.
  // without the "tabs" permission) is NOT treated as restricted: the tab
  // may still be injectable.
  const isRestrictedTarget = (url) => {
    if (typeof url !== 'string' || url === '') return false
    try {
      const { protocol } = new URL(url)
      return protocol !== 'http:' && protocol !== 'https:'
    } catch {
      return true
    }
  }

  const ensureContentScript = (tabId, tabUrl) => {
    if (typeof tabId !== 'number') return
    if (isRestrictedTarget(tabUrl)) return
    api.tabs.sendMessage(tabId, { type: 'MOJITO_PING' }, () => {
      // lastError = no live content script in that tab: inject a fresh one.
      if (!api.runtime.lastError) return
      api.scripting
        .executeScript({
          target: { tabId },
          files: [CONTENT_SCRIPT_FILE],
        })
        .catch((error) => {
          // Best-effort sweep: the URL may be hidden from us (undefined,
          // restricted pages like chrome://) or the tab may have closed
          // mid-sweep. Those targets are unreachable by design — not
          // failures worth error noise.
          console.debug(
            '[Mintlayer] content-script re-injection skipped:',
            error.message,
          )
        })
    })
  }

  const sweepAllTabs = () => {
    api.tabs.query({}, (tabs) => {
      if (api.runtime.lastError) return
      for (const tab of tabs) {
        if (typeof tab.id === 'number') ensureContentScript(tab.id, tab.url)
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

  // The wallet UI (SettingsProvider) owns the active network and publishes
  // every value — initial and toggles — to chrome.storage.local, because
  // the service worker cannot read the wallet pages' localStorage.
  const normalizeNetwork = (value) =>
    value === 'mainnet' || value === 'testnet' ? value : null

  // A grant authorizes ONLY the network it was approved on. A grant without
  // a `network` stamp (pre-dating network-scoped grants) cannot be proven
  // current either and fails re-validation — fail closed. When the UI has
  // not published a network yet, nothing can be re-validated and grants
  // keep the pre-existing behavior.
  const hasLiveGrant = (origin) => {
    const grant = connectedSites[origin]
    if (!grant) return false
    if (!activeNetwork) return true
    return grant.network === activeNetwork
  }

  // Grants from another network must never answer, not even from storage:
  // DELETE them (a fresh approval always overwrites/recreates the grant, so
  // deletion leaves no read path to stale addresses) and notify the sites'
  // open tabs — same propagation as a disconnect — so cached SDK clients
  // drop the stale addresses.
  const revokeGrantsFromOtherNetworks = () => {
    if (!activeNetwork) return
    const staleOrigins = Object.keys(connectedSites).filter(
      (origin) => connectedSites[origin]?.network !== activeNetwork,
    )
    if (!staleOrigins.length) return
    for (const origin of staleOrigins) {
      delete connectedSites[origin]
    }
    api.storage.local.set({ connectedSites }, () => {
      if (api.runtime.lastError) {
        console.error('[Mintlayer] Storage set error:', api.runtime.lastError)
        return
      }
      for (const origin of staleOrigins) notifyOriginRevoked(origin)
    })
  }

  // Revokes EVERY grant — the walletLocked action and the lock-mirror sweep
  // share this path, with the same propagation as per-site disconnects:
  // durable deletion + notifyOriginRevoked to the sites' open tabs. The
  // persist is retried ONCE after a short backoff before reporting failure:
  // a silently lost revocation would reload the grants on the next boot.
  const REVOCATION_PERSIST_RETRY_MS = 250
  // True from the moment grants are dropped from the in-memory map until the
  // durable revocation is CONFIRMED by a successful persist. While set, the
  // storage snapshot still holds the grants: a re-send (or sweep) must
  // re-attempt persistence against it instead of answering {revoked: 0}
  // success for work that never landed.
  let revocationPending = false
  const persistRevocation = (origins, done, attempt) => {
    api.storage.local.set({ connectedSites }, () => {
      if (api.runtime.lastError) {
        if (attempt === 0) {
          setTimeout(
            () => persistRevocation(origins, done, 1),
            REVOCATION_PERSIST_RETRY_MS,
          )
          return
        }
        console.error('[Mintlayer] Storage set error:', api.runtime.lastError)
        done?.({ error: api.runtime.lastError.message })
        // revocationPending stays set: the snapshot still holds the grants
        return
      }
      revocationPending = false
      for (const origin of origins) notifyOriginRevoked(origin)
      done?.({ result: { revoked: origins.length } })
    })
  }
  const revokeOrigins = (origins, done) => {
    for (const origin of origins) {
      delete connectedSites[origin]
    }
    revocationPending = true
    persistRevocation(origins, done, 0)
  }
  const revokeAllGrants = (done) => {
    const origins = Object.keys(connectedSites)
    if (origins.length) {
      revokeOrigins(origins, done)
      return
    }

    // Empty in-memory map: a genuine no-op — UNLESS a previous attempt
    // emptied the map without ever persisting (both writes failed, or the
    // worker died mid-persist). Then the storage snapshot still holds the
    // grants and a re-send must re-attempt the whole revocation against it.
    if (!revocationPending) {
      done?.({ result: { revoked: 0 } })
      return
    }
    api.storage.local.get(['connectedSites'], (data) => {
      if (api.runtime.lastError) {
        done?.({ error: api.runtime.lastError.message })
        return
      }
      // Read the durable keys WITHOUT re-hydrating the in-memory map: a
      // fresh connect approval completing while this get was in flight must
      // not be clobbered by the stale snapshot. Deleting absent keys is a
      // no-op, and the whole-map persist preserves the newer grant.
      const durable = Object.keys(data.connectedSites || {})
      if (!durable.length) {
        // the failure self-healed elsewhere (e.g. another sweep persisted
        // the same removal): nothing left to revoke
        revocationPending = false
        done?.({ result: { revoked: 0 } })
        return
      }
      revokeOrigins(durable, done)
    })
  }

  // Enforcement entry point for an expired lock mirror: revokes every grant
  // the moment the worker observes the 30-minute auto-lock (at boot, on a
  // mirror write, or on any inbound message) even though no wallet page is
  // open to announce it — exactly the walletLocked lifecycle.
  const sweepExpiredLockMirror = () => {
    if (!isLockMirrorExpired(walletLockAt)) return
    revokeAllGrants()
  }

  // Load connected sites from storage. Messages arriving before the load
  // completes are queued: acting on a half-loaded session map would tell
  // already-connected sites they are NOT_CONNECTED.
  let connectedSitesLoaded = false
  const messageQueue = []
  const drainMessageQueue = () => {
    if (connectedSitesLoaded) return
    connectedSitesLoaded = true
    for (const [queuedMessage, queuedSender, queuedResponse] of messageQueue) {
      processMessage(queuedMessage, queuedSender, queuedResponse)
    }
    messageQueue.length = 0
  }
  api.storage.local.get(
    ['connectedSites', 'networkType', 'walletLockAt'],
    (data) => {
      if (api.runtime.lastError) {
        console.error('[Mintlayer] Storage get error:', api.runtime.lastError)
      } else {
        connectedSites = data.connectedSites || {}
        // Same adoption rule as the network: a live mirror write landing
        // while this read was in flight is NEWER than any snapshot — the
        // stale boot value must not revert it.
        if (!lockMirrorAdopted) {
          walletLockAt =
            typeof data.walletLockAt === 'number' ? data.walletLockAt : null
        }
        if (!networkAdopted) {
          activeNetwork = normalizeNetwork(data.networkType)
        }
        // A switch that happened while this worker was dead still left grants
        // approved on the OLD network in storage: revoke them before any
        // queued message is answered. Runs on whatever snapshot loaded, so a
        // stale snapshot can still only shrink the map, never answer from it.
        revokeGrantsFromOtherNetworks()
        // Same for a lock that expired while NO wallet page was open to
        // announce it: the mirror is the only witness — sweep before any
        // queued message is answered.
        sweepExpiredLockMirror()
      }
      // one-time cleanup of the pre-window-keyed pending request
      api.storage.local.remove('pendingRequest')
      // Sweep orphan `pendingRequest:<windowId>` keys left behind when the
      // service worker was killed before an approval resolved. The key list
      // is snapshotted BEFORE the queued messages drain, so a live approval
      // (which can only start after the drain) can never be swept.
      if (typeof api.storage.local.getKeys === 'function') {
        api.storage.local.getKeys((keys) => {
          if (api.runtime.lastError) {
            console.error(
              '[Mintlayer] Storage getKeys error:',
              api.runtime.lastError,
            )
          } else {
            const orphanKeys = keys.filter((key) =>
              key.startsWith('pendingRequest:'),
            )
            if (orphanKeys.length) {
              api.storage.local.remove(orphanKeys, () => {
                if (api.runtime.lastError) {
                  console.error(
                    '[Mintlayer] Storage remove error:',
                    api.runtime.lastError,
                  )
                }
              })
            }
          }
          drainMessageQueue()
        })
      } else {
        drainMessageQueue()
      }
    },
  )

  // Live network switch: the wallet UI persists the new network to
  // chrome.storage.local ('networkType'). Revoke every grant approved on
  // another network immediately, so open dApp tabs are told to drop cached
  // addresses even before their next request is re-validated.
  if (api.storage.onChanged?.addListener) {
    api.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return
      if (changes.networkType) {
        const next = normalizeNetwork(changes.networkType.newValue)
        if (next !== activeNetwork) {
          activeNetwork = next
          networkAdopted = true
          revokeGrantsFromOtherNetworks()
        }
      }
      // Lock-mirror writes land here too: pagehide/logout stamp it,
      // unlock/resume clears it. The write is ADOPTED (newer than any boot
      // snapshot in flight), and an already-expired value revokes
      // immediately; a fresh value just updates the in-memory clock.
      if (changes.walletLockAt) {
        walletLockAt =
          typeof changes.walletLockAt.newValue === 'number'
            ? changes.walletLockAt.newValue
            : null
        lockMirrorAdopted = true
        sweepExpiredLockMirror()
      }
    })
  }

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

  // Side-panel approvals wait for the panel to confirm it actually rendered
  // the request. Chrome silently no-ops sidePanel.open() when it is called
  // without a user gesture, and a cold panel load can take several seconds
  // — without this ack-or-fallback the dApp would hang with NO approval
  // surface at all. The budget is generous (full React bundle + wasm init
  // on first panel open); while it runs, the panel keeps priority.
  const PANEL_ACK_TIMEOUT_MS = 8000
  const approvalAcks = new Map() // requestId -> timeout id

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

  // Closes and unregisters the overlap popup (if any) that was opened while
  // a panel approval is pending. Safe to call repeatedly.
  const closeOverlapPopup = (slot) => {
    if (typeof slot.popupWindowId !== 'number') return
    clearPendingRequest(slot.popupWindowId)
    if (api.windows?.remove) {
      api.windows.remove(slot.popupWindowId, () => {
        // already closed is fine
        void api.runtime.lastError
      })
    }
    slot.popupWindowId = null
  }

  // Fails a pending approval: clears the slot and answers the waiting dApp.
  const failSlot = (slot, error) => {
    const windowId = slot.panelMode ? slot.windowId : slot.id
    slot.id = false
    slot.opening = false
    slot.panelMode = false
    slot.panelAcked = false
    // an overlap popup must not linger showing an approval the dApp no
    // longer waits for
    closeOverlapPopup(slot)

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
    // eslint-disable-next-line max-params -- message-handler plumbing; splitting it hides the flow
  ) => {
    const windowId = sender.tab.windowId
    slot.panelMode = true
    slot.windowId = windowId
    slot.opening = true
    slot.requestId = request.requestId
    slot.panelAcked = false
    pendingResponses.set(request.requestId, sendResponse)

    // Chrome silently no-ops sidePanel.open() without a user gesture — and
    // the gesture that produced this dApp request can expire across async
    // hops (e.g. a storage round-trip). Open the panel FIRST, while the
    // activation is still live, and persist the request only afterwards:
    // the panel picks it up either on mount or via its storage.onChanged
    // listener, so a late write is fine. The reverse (an open that silently
    // did nothing) is what the ack timer below guards against.
    api.sidePanel
      .open({ tabId: sender.tab.id })
      .then(() => {
        slot.opening = false
        api.storage.local.set(
          { [pendingRequestKeyFor(windowId)]: { ...request, windowId } },
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
              return
            }

            // The panel must confirm it rendered the approval. When no ack
            // arrives within the budget, open a popup as a SECOND surface
            // (never as a replacement): first surface to display or answer
            // owns the request, the other is dismissed — the dApp always
            // gets an approval without a fast panel load stealing the show
            // from a slow one.
            const ackTimer = setTimeout(() => {
              approvalAcks.delete(request.requestId)
              if (slot.requestId !== request.requestId) return // answered meanwhile
              console.error(
                '[Mojito] side panel did not display the approval — opening a popup as a second surface',
              )
              openOverlapPopup(slot, request)
            }, PANEL_ACK_TIMEOUT_MS)
            approvalAcks.set(request.requestId, ackTimer)
          },
        )
      })
      .catch((error) => {
        console.error(
          '[Mojito] sidePanel.open failed, using a popup window:',
          error,
        )
        // roll back the panel registration and use a popup instead — the
        // popup fallback re-opens the slot: without this reset the fallback
        // hits openPopupApproval's busy guard and the dApp is answered
        // REQUEST_IN_PROGRESS instead of getting a window
        pendingResponses.delete(request.requestId)
        slot.requestId = null
        slot.panelMode = false
        slot.windowId = null
        slot.opening = false
        onFallback()
      })
  }

  // Chooses the approval surface: side panel for the dApp's window when the
  // browser supports it, popup window otherwise. Returns true while the
  // dApp's message channel stays open.
  const openApprovalTarget = (slot, request, sendResponse, sender) => {
    // SECURITY: route the approval by a background-generated opaque id, never
    // by the dApp-supplied requestId. Page request ids share one
    // attacker-chosen namespace across all origins: routing by them let a
    // page overwrite another page's pending reply channel and capture its
    // approval result (signed transaction / addresses). The dApp-facing id
    // is irrelevant for routing anyway — the content script tags responses
    // with its own page-local id.
    request.requestId =
      globalThis.crypto?.randomUUID?.() ||
      Array.from(globalThis.crypto.getRandomValues(new Uint8Array(16)), (b) =>
        b.toString(16).padStart(2, '0'),
      ).join('')

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

  // Opens a popup window as a SECOND approval surface while a side-panel
  // approval is still pending (the panel never acked — it may still be
  // loading). Neither surface steals from the other: the first to display
  // (approvalDisplayed ack) or answer (popupResponse) owns the request, the
  // loser is dismissed. The dApp's channel registration (pendingResponses)
  // stays untouched — the panel slot remains its owner of record.
  const openOverlapPopup = (slot, request) => {
    api.windows.create(
      {
        url: api.runtime.getURL('popup.html'),
        type: 'popup',
        width: 800,
        height: 600,
        focused: true,
      },
      (win) => {
        // answered/released while the window was opening — never show it
        if (slot.requestId !== request.requestId) {
          if (typeof win?.id === 'number') {
            api.windows.remove(win.id, () => {
              void api.runtime.lastError
            })
          }
          return
        }
        if (typeof win?.id !== 'number') return // no window — the panel may still claim it
        slot.popupWindowId = win.id

        // The window may have been closed while it was being created, in
        // which case onRemoved fired before the id was tracked.
        api.windows.get(win.id, (existing) => {
          if (api.runtime.lastError || !existing) {
            if (slot.popupWindowId === win.id) {
              slot.popupWindowId = null
              if (!slot.panelAcked) {
                // no live surface left — do not hang the dApp forever
                failSlot(
                  slot,
                  errorOf('REQUEST_CANCELLED', 'Request cancelled'),
                )
              }
            }
            return
          }

          // Keyed by window id: the popup approves what ITS window was
          // opened for. Kept ALONGSIDE — never instead of — the panel's
          // key so a late-loading panel can still claim the request.
          api.storage.local.set(
            { [pendingRequestKeyFor(win.id)]: request },
            () => {
              if (api.runtime.lastError) {
                console.error(
                  '[Mintlayer] Storage set error:',
                  api.runtime.lastError,
                )
              }
            },
          )
        })
      },
    )
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

  // Overlap resolution when a surface ANSWERS: the answering surface wins.
  // Withdraw the other surface so no second prompt survives the decision.
  const releaseOverlapOnAnswer = (slot, answeredWindowId) => {
    if (!slot.panelMode || typeof slot.popupWindowId !== 'number') return
    if (answeredWindowId === slot.popupWindowId) {
      // the popup answered: withdraw the panel's pending request too
      if (typeof slot.windowId === 'number') {
        clearPendingRequest(slot.windowId)
      }
    } else {
      // the panel answered: dismiss the overlap popup
      closeOverlapPopup(slot)
    }
  }

  // Overlap resolution when a surface DISPLAYS the request (ack): the first
  // surface to display owns the request, the loser is dismissed. The ack
  // carries the acking surface's own window id (Browser.notifyApprovalDisplayed);
  // a missing id (older UI build) is treated as the panel's.
  const resolveOverlapOnAck = (slot, ackWindowId) => {
    const isPopupAck =
      typeof ackWindowId === 'number' && ackWindowId === slot.popupWindowId

    if (isPopupAck) {
      // the popup displayed first: it becomes the sole owner and the
      // panel's pending request is withdrawn, so a late-loading panel
      // will not prompt for an already-claimed request
      if (typeof slot.windowId === 'number') {
        clearPendingRequest(slot.windowId)
      }
      slot.id = slot.popupWindowId
      slot.panelMode = false
      slot.windowId = null
      slot.popupWindowId = null
      slot.opening = false
      slot.panelAcked = false
    } else {
      // the panel displayed: it owns the request; dismiss the popup
      slot.panelAcked = true
      closeOverlapPopup(slot)
    }
  }

  // Handle popup responses from the wallet UI
  const handlePopupResponse = (message) => {
    const { requestId, origin, result, error, method, windowId } = message
    const respond = pendingResponses.get(requestId)
    pendingResponses.delete(requestId)
    // stop a still-running ack timer for this request — the decision is in
    const timer = approvalAcks.get(requestId)
    if (timer) {
      clearTimeout(timer)
      approvalAcks.delete(requestId)
    }
    clearPendingRequest(windowId)

    // release the owning approval slot (panel-mode slots have no
    // window-removed event to reset them)
    for (const slot of [connectSlot, popupSlot]) {
      if (slot.requestId !== requestId) continue

      releaseOverlapOnAnswer(slot, windowId)

      slot.id = false
      slot.opening = false
      slot.panelMode = false
      slot.requestId = null
      slot.popupWindowId = null
      slot.panelAcked = false
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
      // an approval surface (side panel or popup) confirmed it rendered the
      // request: cancel the popup-fallback timer for that request
      if (!isFromExtensionPage(sender)) return false
      const timer = approvalAcks.get(message.requestId)
      if (timer) {
        clearTimeout(timer)
        approvalAcks.delete(message.requestId)
      }
      for (const slot of [connectSlot, popupSlot]) {
        if (slot.requestId !== message.requestId) continue
        if (!slot.panelMode) continue // popup-owned — nothing to arbitrate

        // During an overlap (panel pending + fallback popup open) the FIRST
        // surface to display owns the request (see resolveOverlapOnAck).
        resolveOverlapOnAck(slot, message.windowId)
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

    // Wallet lock/logout (manual logout or the 30-minute auto-lock expiry,
    // both observed by AccountProvider): revoke EVERY grant. This is the
    // lifecycle the revocation contract promises — a locked wallet must not
    // keep answering dApps on pre-lock grants. Gated to the wallet's own
    // pages like every other wallet-UI action. The reply reports failure so
    // the wallet can re-send: a silently lost revocation would reload the
    // grants on the next boot.
    if (message.action === 'walletLocked') {
      if (!isFromExtensionPage(sender)) return false
      revokeAllGrants(sendResponse)
      return true
    }

    if (!message.method) return false

    // A sender id different from ours can only be ANOTHER extension's page
    // (the browser sets both fields): ignore it instead of letting a
    // foreign extension drive approval flows. Content-script relays and
    // wallet pages always carry this extension's own runtime id.
    if (sender.id !== api.runtime.id && origin.startsWith('chrome-extension')) {
      return false
    }

    // Handle requests from content.js
    if (message.method === 'checkConnection') {
      // Re-validated against the CURRENT network: a grant approved on
      // another network is treated as absent.
      sendResponse({
        result: { isConnected: hasLiveGrant(origin) },
      })
    } else if (message.method === 'connect') {
      // Already connected ON THE CURRENT NETWORK: answer immediately
      // instead of asking again. A stale grant (approved on another
      // network — normally already swept at switch time; re-validated here
      // in case the sweep was missed) is treated as absent, so the dApp
      // gets a FRESH approval flow instead of the stale session.
      if (hasLiveGrant(origin)) {
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
      // origin would let any page read another origin's session. The grant
      // is re-validated against the CURRENT network: a stale grant answers
      // as "no session" instead of disclosing the old network's addresses.
      const session = connectedSites[origin]

      if (hasLiveGrant(origin) && session.address) {
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
    // Piggyback lock enforcement (no alarms permission): any message is
    // exactly the moment a stale grant could be used, so a mirror expiry
    // observed while this worker stays alive revokes BEFORE it is answered.
    sweepExpiredLockMirror()
    if (!connectedSitesLoaded) {
      messageQueue.push([message, sender, sendResponse])
      return true
    }
    return processMessage(message, sender, sendResponse)
  })

  // Clean up window state and answer waiting dApps when an approval window
  // is closed without a decision.
  api.windows.onRemoved.addListener((winId) => {
    for (const slot of [popupSlot, connectSlot]) {
      if (slot.id === winId) {
        failSlot(slot, errorOf('REQUEST_CANCELLED', 'Request cancelled'))
        return
      }
      // an overlap popup closed without deciding: if the panel already
      // displayed the request it owns it and keeps going — otherwise no
      // live surface is left and the dApp must not hang forever
      if (slot.popupWindowId === winId) {
        slot.popupWindowId = null
        clearPendingRequest(winId)
        if (!slot.panelAcked) {
          failSlot(slot, errorOf('REQUEST_CANCELLED', 'Request cancelled'))
        }
        return
      }
    }
  })
}
