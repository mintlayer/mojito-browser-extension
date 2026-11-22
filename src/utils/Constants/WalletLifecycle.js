/**
 * Wallet-lifecycle constants shared by the wallet UI and the background
 * service worker. Deliberately dependency-free: the service worker imports
 * this file directly because the @Constants barrel re-exports AppInfo, whose
 * JSX/images (and AppInfoCore's database import) must not enter the worker
 * bundle.
 */

// Minutes of idle time (stamped on pagehide) before the wallet locks — and
// every dApp connection grant is revoked. Single source of truth: the UI
// decides when the wallet is locked, the worker sweeps grants from the
// persisted lock mirror using the SAME threshold.
export const LOGIN_TIMEOUT_MINUTES = 30
