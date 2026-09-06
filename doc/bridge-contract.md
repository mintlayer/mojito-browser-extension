# Extension ↔ SDK contract — `window.mojito`

What the Mojito extension injects and what `@mintlayer/sdk`
(`MojitoAccountProvider` → `Client`) may rely on. Keep both sides aligned
against this file.

## Injection

- `public/explorer/content-script.js` runs at `document_start` (Chromium:
  HTTPS pages, top frames only; Firefox: allowlisted origins) and injects
  `public/mojito.js` from `chrome-extension://<id>/mojito.js`
  (declared in `web_accessible_resources`).
- Injection is idempotent: `window.mojito` is only assigned if absent.
- The content script relays `MINTLAYER_REQUEST` (page → background) and
  `MINTLAYER_RESPONSE` (background → page) via `window.postMessage`, and
  forwards `MINTLAYER_EVENT` broadcast events to the page.

## `window.mojito` surface

| Member                    | Type                       | Notes                                                                                                         |
| ------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `isExtension`             | `true`                     | presence detection                                                                                            |
| `version`                 | string                     | extension version                                                                                             |
| `network`                 | `'mainnet' \| 'testnet'`   | defaults `'testnet'`; updated from the session on connect/restore                                             |
| `connectedAddresses`      | object                     | network-keyed map `{ [network]: { receiving: string[], change: string[] } }`                                  |
| `isConnected()`           | `boolean`                  | true when the current network has receiving addresses                                                         |
| `request(method, params)` | `Promise<any>`             | generic relay; rejects with `Error` carrying `.code` (see errors)                                             |
| `connect()`               | `Promise<session>`         | opens the approval window unless already granted; resolves the stored session                                 |
| `restore()`               | `Promise<session \| null>` | silent re-connect from the persisted grant; `null` when none                                                  |
| `disconnect()`            | `Promise<void>`            | **revokes the grant in the wallet** (deletes `connectedSites[origin]`), clears page state, emits `disconnect` |
| `on(event, cb)`           | void                       | `'accountsChanged'`, `'disconnect'`                                                                           |

## Session object (resolved by `connect()` / `restore()`)

```ts
{
  network: 'mainnet' | 'testnet',      // network the grant was made on
  address: {                            // network-keyed (only the granted network)
    [network]: { receiving: string[], change: string[] },
  },
  addressesByChain: {                   // consumed by @mintlayer/sdk Client
    mintlayer: { receiving: string[], change: string[], publicKeys?: { receiving: string[], change: string[] } },
    bitcoin?:  { receiving: string[], change: string[], publicKeys?: ... }, // only when the user opted in
  },
  timestamp: number,
}
```

Notes:

- `address` contains **only** the wallet's active network — the extension
  never labels addresses with a network they don't belong to.
- `restore()` resolves `null` when there is no grant (SDK treats it as
  "no auto-restore").
- Restores use unique request ids; concurrent `restore()` calls all resolve.

## Error model

All dApp-facing errors are `{ code, message }`; `window.mojito` rejects with
`Error(message)` and `error.code` set. Messages intentionally never contain
the wallet brand (the bridge maps `/mojito/i` messages to an
"install the wallet" hint — only the SDK's own
`'Mojito extension not available'` when `window.mojito` is missing should
trigger that).

| code                  | meaning                                                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `USER_REJECTED`       | user denied the approval                                                                                                |
| `REQUEST_CANCELLED`   | approval window closed without a decision                                                                               |
| `REQUEST_IN_PROGRESS` | an approval window is already open                                                                                      |
| `NOT_CONNECTED`       | sign/challenge without a prior connect grant                                                                            |
| `WRONG_NETWORK`       | session granted on a different network than the wallet's active one                                                     |
| `UNSUPPORTED_METHOD`  | method not implemented by the wallet                                                                                    |
| `TIMEOUT`             | no answer from the wallet within 5 minutes                                                                              |
| `CONTEXT_INVALIDATED` | the extension was reloaded/updated/disabled while the page was open; the page must be reloaded and connect called again |
| `EXTENSION_ERROR`     | content script could not reach the background                                                                           |
| `STORAGE_ERROR`       | wallet failed to persist/read state                                                                                     |

## Method relayed by `request()`

| method                       | params                                                     | result                                                                                               |
| ---------------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `connect`                    | `{ permissions?: string[] }`                               | session (approval window)                                                                            |
| `getSession`                 | —                                                          | session or `null`                                                                                    |
| `disconnect`                 | —                                                          | `true` (grant revoked)                                                                               |
| `signTransaction`            | `{ txData }`; `txData.intent` present ⇒ bridge intent flow | plain hex string, or `{ transactionHex, intentEncode }` when `intent` was present (no `0x` prefixes) |
| `signChallenge`              | `{ message, address? }`                                    | `{ message, address, signature }`                                                                    |
| `checkConnection`, `version` | —                                                          | diagnostics                                                                                          |

## SDK mapping (v1.0.38)

- `Client.create({ network, autoRestore })` → `autoRestore` engages when
  `window.mojito.restore` exists; `restore()` fills
  `connectedAddresses` from `addressesByChain.mintlayer`.
- `client.getBalances()` / `getAddresses()` are computed **SDK-side** from the
  connected addresses via its own API provider — no wallet method involved.
  `getBalances()` returns `{ coin: number, token: Record<tokenId, number> }`
  (note: tokens live under `.token`, not at the top level).
- `client.buildTransfer()` builds locally from the SDK's API provider;
  `client.signIntentTransaction(tx)` / `client.signTransaction(tx)` relay as
  `request('signTransaction', { txData })`.
- Not implemented wallet-side: `requestSecretHash` → `UNSUPPORTED_METHOD`.
