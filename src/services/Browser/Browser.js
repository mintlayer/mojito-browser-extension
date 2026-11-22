/* eslint-disable no-undef */

// Chrome exposes the extension APIs on `chrome`, Firefox on `browser`.
const api =
  typeof browser !== 'undefined' && browser?.runtime
    ? browser
    : typeof chrome !== 'undefined' && chrome?.runtime
      ? chrome
      : null

export const runtime = api?.runtime ?? null

export const windows = api?.windows ?? null

export const storage = api?.storage ?? null

// Answers the dApp request that opened this approval window, clears the
// pending request and closes the window. Exactly one of result/error.
export const sendPopupResponse = ({
  method,
  requestId,
  origin,
  result,
  error,
}) => {
  if (!runtime || !storage) return

  // The background clears the per-window pendingRequest entry when it
  // processes this response (keyed by THIS window's id, passed along so a
  // response can only ever clear its own request).
  const cleanup = () => {
    // Swallow the unchecked lastError (the background may be gone when the
    // response lands) to avoid Chrome's console noise.
    void runtime.lastError
    window.close()
    // Fallback for contexts where window.close() is ignored (e.g. the
    // approval page opened as a tab in dev): go back to the wallet.
    setTimeout(() => {
      if (!window.closed) window.location.replace('/')
    }, 150)
  }

  const send = (windowId) => {
    try {
      runtime.sendMessage(
        {
          action: 'popupResponse',
          method,
          requestId,
          origin,
          windowId,
          ...(error ? { error } : { result }),
        },
        cleanup,
      )
    } catch {
      cleanup()
    }
  }

  if (windows?.getCurrent) {
    windows.getCurrent((win) => send(win?.id ?? null))
  } else {
    send(null)
  }
}

// Mirrors the wallet's lock clock into chrome.storage.local ('walletLockAt'):
// the service worker cannot read the wallet pages' localStorage, so this is
// the only way it can enforce the 30-minute auto-lock when no wallet page is
// open to observe the expiry. `value` is the lock timestamp (stamped at
// every registry write: unlock, throttled activity refresh, pagehide and
// logout) or null (legacy/pre-fix writers only — the worker treats it as
// 'no clock observed', i.e. never expired).
export const stampWalletLock = (value) => {
  if (!storage?.local) return
  // One bounded rewrite on any failure signal (runtime.lastError from the
  // set callback): a lost stamp is NOT self-healing at unlock — until the
  // next pagehide/logout the mirror would keep the previous session's
  // already-expired clock, which the worker sweeps against the new
  // session's grants at its next boot. The rewrite is idempotent (same
  // value); a persistently failing storage just stays at one retry.
  let rewrote = false
  const write = () => {
    try {
      storage.local.set(
        { walletLockAt: typeof value === 'number' ? value : null },
        () => {
          // reading lastError here acknowledges it for Chrome
          const failed = runtime?.lastError
          if (failed && !rewrote) {
            rewrote = true
            write()
          }
        },
      )
    } catch {
      /* storage unavailable — the next lock state change re-stamps */
    }
  }
  write()
}

// Tells the background the wallet was locked or logged out — via the manual
// logout button or the 30-minute auto-lock expiry (AccountProvider is the
// only place that can observe both; the service worker cannot read the
// wallet pages' localStorage lock state). The background answers by
// revoking EVERY dApp connection grant, exactly like a manual disconnect.
export const notifyWalletLocked = () => {
  if (!runtime) return
  // One bounded re-send on any failure signal: an {error} reply from a live
  // worker (persist failed) or runtime.lastError from a dead one (worker
  // not yet restarted / context invalidated). A silently lost lock would
  // otherwise let the dead grants answer until the persisted lock mirror
  // expires them on the worker's next boot. The re-delivery is idempotent:
  // revokeAllGrants answers duplicate sends from the durable snapshot.
  let resent = false
  const send = () => {
    try {
      runtime.sendMessage({ action: 'walletLocked' }, (response) => {
        // reading lastError here acknowledges it for Chrome
        const undelivered = runtime.lastError
        if ((response?.error || undelivered) && !resent) {
          resent = true
          send()
        }
      })
    } catch {
      /* messaging unavailable — the persisted lock mirror still sweeps the
         grants on the worker's next boot */
    }
  }
  send()
}

// Tells the background the approval surface (side panel or popup) rendered
// the request: it cancels the popup-fallback timer for that requestId.
// Without this ack the background assumes the panel did not display the
// request and opens a new popup window for every approval.
// windowId (optional, this surface's own browser window) lets the
// background arbitrate when BOTH surfaces are showing the same request:
// the first to display owns it.
export const notifyApprovalDisplayed = (requestId, windowId) => {
  if (!runtime || !requestId) return
  try {
    runtime.sendMessage(
      {
        action: 'approvalDisplayed',
        requestId,
        ...(typeof windowId === 'number' ? { windowId } : {}),
      },
      () => {
        // Fire-and-forget: swallow the unchecked lastError (no responder
        // is expected for this message).
        void runtime.lastError
      },
    )
  } catch {
    /* messaging unavailable — the popup fallback then guarantees an
       approval surface, which is the safe outcome */
  }
}
