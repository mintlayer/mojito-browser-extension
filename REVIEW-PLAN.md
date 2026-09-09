# REVIEW-PLAN — findings & follow-ups from the 4-agent codebase review (2026-09-06)

Review agents: security / code-quality / UI-UX / DRYness. This file records
what was **deferred** (with enough context to implement correctly) and the
**accepted risks**. Fixed-in-this-branch items are in git history + HANDOFF.md.

## Done in this branch (summary)

- **P1 money correctness**: amount regex escaped (`/^\d+(\.\d+)?$/`, rejects
  `1e3`); `getParsedTransactions` accumulation fixed (no more string concat /
  value clobbering; regression tests added); `getAmountInCoins` /
  `getAmountInAtoms` / token-balance sums / coin balances / delegation total /
  `spendFromDelegation` now use Decimal; Dashboard 24h stats render neutral
  (not "+1,234,400%") when yesterday rates are missing (`proportionDiffs`/`balanceDiffs`
  can be `null` — treat `null` as "show nothing", never `0`).
- **P2 provider robustness**: `MintlayerProvider.fetchAllData` wrapped in
  try/catch/finally with a ref-based mutex (flags can no longer wedge; forced
  runs serialize after in-flight ones); network-switch effect owns
  `cancelAllRequests()`; `fetchDelegations` always releases its flag; new
  `fetchError` context field; ExchangeRatesProvider fetches coins in parallel
  with error/`fetching` state; BitcoinProvider never sets `btcUtxos` to
  `undefined`, dep-less effect now `[networkType]`.
- **P3 UX trust**: mock NFT grid + demo activity row removed (real empty
  states); `navigate('/wallet')` dead-ends → `/dashboard`; post-send returns →
  `/dashboard`; `/wallet/:coinType` and unknown routes redirect to
  `/dashboard`; pages/Wallet deleted; sign/confirm screens, SignChallenge,
  MessagePage, CreateDelegation overlay, Delegation cards/skeletons and the
  PopUp close icon restyled onto be-\* tokens; Sparkline `responsive` prop
  (used by AssetPage/StakePage chart cards); `body min-width: 400px` removed.
- **P4 security**: `getSession` no longer trusts caller-supplied `origin`;
  dead `customAPIServers` override removed from both API services; no source
  maps in production builds; SignInternalTransaction mock selector gated to
  dev; ecpair 3.0.2 / react-router-dom 7.18.3 / bn.js updated; Chromium
  manifest now HTTPS-only, top-frame only, `web_accessible_resources` no
  longer `<all_urls>`.
- **P5 dead code / DRY**: `WALLETS_NAVIGATION`, old Dashboard containers
  (CryptoList/Statistics/CryptoSharesChart/DashboardSkeleton + tests + CSS),
  `src/mocks/**` and the `@Mocks` aliases, `Navigation`'s unused
  `customNavigation` prop, meaningless `exact` on `<Route>`; provider now uses
  exported `MINTLAYER_ENDPOINTS` (placeholder names aligned to the server
  contract: `:address`); new `ML.getUnconfirmedTransactionKey` replaces 8
  hand-built localStorage keys; `'testnet'` literals use the constant.

## Missing / deferred (implement in this order)

1. **Real NFT data on the Dashboard NFTs tab** — mock grid deleted, tab shows
   an empty state. `MintlayerContext.nftData` already holds
   `[{ token_id, data }]` from `GET /nft/:id` (metadata + media links). Need:
   tile component (image from IPFS gateway — DONE for token icons 2026-09-06:
   manifest CSP `img-src` now allows `https:` and `TokenIcon` renders
   `icon_uri` with a fallback tile; the same treatment applies to NFT media
   when the NFT tab is implemented — privacy note: remote icon hosts see the
   user's IP for held tokens, standard wallet trade-off), collection
   grouping, and a detail sheet. Keep the empty state until then.
2. **ML bech32 checksum validation** — `isMlAddressValid/isMlPoolIdValid/
isMlDelegationIdValid` are charset regexes only; a 1-char typo still
   passes and funds are lost. Decode via the vendored wasm lib's bech32
   decoder (it exposes address decode) and verify checksum + HRP per network;
   keep the regex as a fast pre-filter. Apply in AddressField + send flows.
3. **Bitcoin dApp HTLC signing is broken** — `SignBitcoinTransaction.js`
   destructures `{ WIF }` from `Account.unlockAccount()` which never returns
   WIF (always `undefined` → `ECPair.fromWIF` throws), and `submitCreate`
   calls `BTC.BTCTransaction.buildTransaction({to, amount, fee, wif, from,
networkType})` while the function expects `{utxos, feeRate, walletType,
changeAddress, root}`. Fix key derivation (e.g. `getWIF(accountId,
password)` on the Account entity), align call-site params, add an E2E test
   for create/spend/refund.
4. **Extract `useMlTransactionForm`** — SendMlTransaction / CreateDelegation /
   DelegationStake / DelegationWithdraw / NftSend pages are ~70% identical
   (~800 LOC): walletType literal, fee trio + debounce effect (port the
   SendMl version — it's the only one with cancellation + error state),
   `buildXTransaction` useCallback, `confirmMlTransaction`, accountID guard,
   insufficient-funds error, `goBackToWallet`. Hook owns everything except the
   unique `buildTransaction` params + route.
5. **Design-system consolidation** — one `BeButton` (primary/secondary) to
   replace the per-page oklch gradient CSS (AssetPage/ReceivePage/StakePage);
   `BeSheet` for detail views (DelegationDetails still uses the pastel PopUp);
   shared `.be-card/.be-empty/.be-title` primitives or Card/Section components
   (5 pages redefine identical CSS); `EmptyList` basic for `.empty` divs.
6. **Accessibility pass** — zero `aria-label`/`role`/`tabIndex` in the app:
   convert clickable divs/spans/lis (Dashboard rows, chips, See-all, Delegation
   `<li>`, Navigation items) to buttons or add role/tabIndex/Enter handlers;
   aria-labels on icon-only buttons (Header back/menu, PopUp close, CopyButton,
   eye toggles); global `:focus-visible` ring; Escape + focus trap + `role="dialog"`
   for PopUp/Sheet/SliderMenu; raise `--be-text-3` to ~oklch(0.55) for text use
   (currently ~2.5:1 on bg-1); `prefers-reduced-motion` for the Counter.
7. **Formatting unification** — one `Format.amount(value, {decimals})` +
   `Format.dateTime(ts)` (today: `BTCValue`, ad-hoc `toLocaleString`, and
   `dd/MM/yyyy HH:mm` vs `toLocaleString` date formats coexist; fiat symbol
   appears as prefix `$1,234` on Dashboard but suffix `1,234 $` on AssetPage).
8. **Loading/empty/error states on the new pages** — Dashboard/ActivityPage/
   AssetPage ignore `fetchingBalances/fetchingTransactions` (ActivityPage says
   "No transactions" while loading); `fetchError` (added this branch) is not
   yet surfaced with a retry UI; `btcApiAvailable=false` has no visual state on
   Dashboard rows (`disabled` flag is dead data in AssetRow).
9. **Token Send from AssetPage** — Send is hidden for tokens because the send
   route never receives the `tokenId` (Wallet page built `walletType.tokenId`
   which is now deleted; route param `/wallet/:coinType/send-ml-transaction`
   can carry the token id as `coinType` — needs wiring in SendMlTransaction).
10. **Dashboard Send chain chooser** — quick action hardcodes the ML send
    flow; BTC send requires going via the BTC asset page. Small BeSheet with
    Bitcoin/Mintlayer.
11. **Provider plumbing consolidation (DRY)** — `usePolling(fetcher,
interval)` + `useNetworkSync()` shared by Mintlayer/Bitcoin/ExchangeRates
    providers; `createAbortRegistry()` (note: `requestMintlayer` registers
    controllers but never passes `signal` to fetch — abort is currently a
    no-op); `chunkedBatch()` shared by BTC/ML `getBatchData`; shared
    `renderWithProviders` test-utils (the `propValue` escape hatch on all
    three providers exists and is unused by tests).
12. **Truncation helper** — generalize `ML.formatAddress` into chain-agnostic
    `truncateMiddle(value, {head, tail})`; replace inline `slice(0,10)…`
    sites (AssetPage address, ActivityPage hash, TransactionBreakdown) and the
    5× duplicated receive-address resolution (→ `useReceiveAddress(chain)`).
13. **Explorer-link helper** — `DelegationDetails`, `NftDetails` and
    `StakePage` each hand-build `https://${testnet ? 'lovelace.' : ''}explorer…`
    URLs; extend the existing `ML.getMlAddressLink/getMlTransactionLink` into
    `getExplorerLink(kind, id, network)`; fix the raw-string drift (33
    networkType comparisons; literals now use the constant on Stake/Receive).
14. **Bundle/code splitting** — `main.js` ~760 KB + `vendors.js` ~1.6 MB: add
    `React.lazy` routes for legacy flows (sign screens, swap, NFT) once (11)
    lands.
15. **Housekeeping** — remove leftover `console.log`s (notably
    OrderDetails.js logs balances; "No account id." in 7 pages);
    `useMlWalletInfo(addresses, token)` signature ignores its first arg at
    call sites that still pass one; `fetchDelegations(addresses)` call-sites
    pass an ignored argument; `getNftsData` `error.message.includes` →
    optional-chain; ReceivePage clipboard write has no success/failure
    feedback; `jest.config` `testPathIgnorePatterns ['/tests/']` should be
    anchored to `<rootDir>/src/tests/`.

## Accepted risks (documented, not scheduled)

- **elliptic GHSA-848j (crypto-browserify webpack polyfill)**: no patched
  elliptic release exists; npm's only suggestion is downgrading
  crypto-browserify to 3.3.0 (older = strictly worse). The polyfill exists
  only to satisfy webpack's node-crypto resolution — wallet cryptography
  runs on the vendored wasm lib and noble curves. Revisit when
  crypto-browserify ships a fixed line or the polyfill can be dropped.
- **Public ipfs gateway rate limiting**: the wallet races ipfs.io /
  dweb.link / w3s.link once per token icon, then serves from an in-memory
  blob forever. Shared team IPs can still get throttled on first load —
  the proper long-term fix is an `/ipfs/<cid>` proxy on
  mojito-api.mintlayer.org (Cloudflare-cached), after which
  `IPFS_GATEWAYS` shrinks to that single trusted origin.
- **Dev tooling advisories** may reappear between lockfile refreshes
  (webpack-dev-server chain); none ship in the extension bundle — re-run
  `npm audit fix` periodically.

- **`window.mojito` fingerprinting**: any HTTPS site can detect the wallet.
  Inherent to the user-approved model (manual connect approval, no static
  allowlist). Mitigated: HTTPS-only, top-frame only, manual approval popup,
  origin taken from `sender`.
- **postMessage page-trust model** (mojito.js): any script in a _connected_
  page can call `signTransaction`/read responses — standard wallet-SDK trust
  model; approval origin is shown on sign pages (SiteBadge).
- **elliptic advisory (GHSA-848j-6mx2-7j84)** via crypto-browserify webpack
  polyfill: the only "fix" is a breaking crypto-browserify downgrade; risk
  accepted until the polyfill can be dropped entirely.
- **Dev-only npm advisories** (webpack-dev-server/ws/sockjs chain) — not
  shipped in the extension bundle.
- **30-min soft-unlock**: `unlockedAccount` in localStorage contains public
  addresses/pubkeys only; expiry is client-editable. Consider
  `chrome.storage.session` for the timestamp.
