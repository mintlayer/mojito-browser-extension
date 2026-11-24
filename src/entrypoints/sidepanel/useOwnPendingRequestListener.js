import { useEffect, useRef } from 'react'

// Approval requests are keyed by window id (`pendingRequest:<windowId>`):
// every surface (side panel, sidebar or popup window) only ever needs the
// record written for its own window. Picks the new value THIS surface must
// act on from a storage change set, or null when there is none: another
// window's key, a removal, a non-local area or an own window id that is not
// known yet all route nothing.
const ownPendingRequestChange = (changes, areaName, ownWindowId) => {
  if (areaName !== 'local') return null
  if (typeof ownWindowId !== 'number') return null
  return changes?.[`pendingRequest:${ownWindowId}`]?.newValue ?? null
}

// Approvals can arrive while an approval surface is already open: react to
// the storage write immediately instead of waiting for the next effect run.
// `onRequest.current` is the surface's handler; the returned ref holds this
// surface's own window id, recorded by the mount read, and is what binds
// the listener to this window.
export const useOwnPendingRequestListener = (storage, onRequest) => {
  const ownWindowIdRef = useRef(null)

  useEffect(() => {
    if (!storage?.onChanged) return
    const listener = (changes, areaName) => {
      const request = ownPendingRequestChange(
        changes,
        areaName,
        ownWindowIdRef.current,
      )
      if (request) onRequest.current(request)
    }
    storage.onChanged.addListener(listener)
    return () => storage.onChanged.removeListener(listener)
  }, [storage, onRequest])

  return ownWindowIdRef
}
