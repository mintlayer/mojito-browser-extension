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

## Connection lifecycle / revocation (authoritative)

- A grant is created only by explicit user approval and is stored per-origin.
- The origin is the one the browser reports for the page. A page whose
  origin is not a bare `http(s)://host[:port]` origin (an opaque-origin
  document, an extension page) can never hold a grant: every request from
  it is refused with `UNSUPPORTED_ORIGIN`, before any approval is opened,
  and a grant an older build stored under such a key is removed when the
  background starts.
- Revoking it — from the wallet Settings, via `window.mojito.disconnect()`,
  or on wallet lock/logout — is **immediate and persistent**: the wallet
  deletes the session, and open tabs for that origin receive
  `MINTLAYER_EVENT: disconnect`.
- A grant is scoped to the network it was approved on: switching the
  wallet's active network (mainnet ↔ testnet) revokes it the same way, and
  `checkConnection`/`getSession` report disconnected/no session until the
  dApp calls `connect` again (fresh approval on the new network). Grants
  created by older wallet builds (no network stamp) are revoked the same
  way — with disconnect events to open tabs — the first time the wallet UI
  opens after the update; sign attempts on such a grant fail with
  `WRONG_NETWORK`.
- Bridges MUST treat that event as authoritative: drop every cached
  session/address from the SDK client. Do not trust an in-memory client
  state that predates the revocation (this caused an incident where the
  bridge "connected without authorization" from a stale client).
- Before performing wallet-dependent actions after a long-idle period,
  verify with `client.isConnected()` **plus** a fresh
  `window.mojito.request('checkConnection')`.

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
| `REQUEST_IN_PROGRESS` | an approval is already pending for this window; complete or reject it first                                             |
| `NOT_CONNECTED`       | sign/challenge without a prior connect grant                                                                            |
| `WRONG_NETWORK`       | session granted on a different network than the wallet's active one                                                     |
| `UNSUPPORTED_METHOD`  | method not implemented by the wallet                                                                                    |
| `UNSUPPORTED_ORIGIN`  | the page's origin is not a bare http(s) origin (an opaque-origin page, an extension page); nothing from it is processed |
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

- `signTransaction` with `chain: 'bitcoin'` is a Bitcoin HTLC request, routed to the Bitcoin approval. `txData.JSONRepresentation` must match exactly one of: a claim `{ type: 'spendHtlc', utxo, redeemScriptHex, to?, secret? }`, a refund `{ type: 'refundHtlc', utxo, redeemScriptHex, to? }`, or a new HTLC `{ secretHash, amount, timeoutBlocks, recipientPublicKey, refundPublicKey }`. For a claim or refund: `utxo` is `{ txid, vout, value }` with `value` in whole satoshis, above the wallet's fixed claim or refund fee (a claim may add `utxo.secretHash`, `{ secret_hash_hex }`, to locate the wallet's stored secret); `redeemScriptHex` is the HTLC script and must bind one of the wallet's keys; `secret` is the 64-hex-character claim secret, optional: the wallet signs with its stored secret for the hash when it has one, else with the request's `secret`, and prompts the user whenever the request carries none; `to` is optional — when present it must be one of the wallet's own addresses, when absent the wallet pays its own receiving address. For a new HTLC: `amount` is in whole satoshis, `timeoutBlocks` is a decimal count of blocks, the public keys are hex, and `secretHash` only marks the request — the wallet generates the secret itself, replaces the value and returns `secretHashHex` in the result. The result is `{ signedTxHex }` for a claim or refund and `{ signedTxHex, transactionId, htlcAddress, secretHashHex, redeemScript }` for a new HTLC. Any other shape, no match, or a claim or refund type next to `secretHash` is shown as unrecognised or ambiguous and cannot be approved.
- `signChallenge`: `message` must be a non-empty string, otherwise the request cannot be approved (the approval shows why and offers only Decline); a non-string `address` falls back to the wallet's default address.

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
