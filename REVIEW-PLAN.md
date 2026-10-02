# REVIEW-PLAN — findings & follow-ups from the 4-agent codebase review (2026-09-06)

Review agents: security / code-quality / UI-UX / DRYness. This file records
what was **deferred** (with enough context to implement correctly) and the
**accepted risks**. Fixed-in-this-branch items are in git history + HANDOFF.md.

## OCR pass 1 (2026-09-20, opencode code-reviewer over src/ in 15 batches)

~235 findings (1 CRITICAL / 21 HIGH / 113 MEDIUM / ~100 LOW). All CRITICAL,
HIGH and MEDIUM items were fixed in this branch; the LOW items were fixed
unless listed below. Converged over 5 review passes (each pass re-reviewed
only files whose hash changed since the previous one):

- pass 1 → full src/ (15 batches): the findings above
- pass 2 → 114 changed files: fixes verified, 13 follow-ups (1 HIGH
  regression, 6 MEDIUM, rest LOW) — all fixed
- pass 3 → 34 changed files: all verified, 3 LOW + 2 test-coverage asks —
  all fixed
- pass 4 → 3 changed files: fixes verified, 1 residual matcher drift found
- pass 5 → 1 changed file: **CONVERGED — 0 findings**

Final state: eslint clean · 140 jest suites, 906 tests passing, 0 failures ·
chrome/firefox production builds green.

Deliberately NOT fixed (do not re-report):

- **Internal/External sign-preview shared-component extraction**
  (~20 near-identical operation components duplicated across
  `InternalTransactionPreview.js` / `ExternalTransactionPreview.js`):
  deferred refactor; the divergent null-guards WERE aligned so both files
  behave identically. Do it together with item 4 (hook extraction).
- **Unused generic primitives kept intentionally**: `Timer`, `Carousel`,
  `ArcChart`, `InputInteger` (+ `Textarea`) have no production consumers;
  kept as basic/composed primitives for item 5 (design-system
  consolidation). Removed from barrels where applicable (`Carousel`,
  `ArcChart`, `PriceChart` deleted outright with its CSS). Their known
  defects (Timer cleanup leak, Toggle desync, InputInteger `~~` wrap,
  Carousel event bubbling) were fixed anyway.
- **`src/version/version.js` imports package.json** — RESOLVED (wave 1,
  2026-09-21): version now injected via `__APP_VERSION__` define in
  wxt.config.ts; jest parity via setupTests.js; both chrome/firefox page
  bundles verified free of package.json metadata.
- **`Passkey.unlockPasswordWithPasskey` alias** — RESOLVED (wave 1,
  2026-09-21): alias deleted; Account.js + both test files use
  `unwrapPasswordWithPasskey` directly.
- **jest `--runInBand --no-cache` required** — RESOLVED (wave 1,
  2026-09-21): `cacheDirectory` pinned to `node_modules/.cache/jest`
  (default /tmp cache hit the machine's quota); full suite runs parallel
  with cache in ~13 s.
- **Explorer verified-token registry integration** (noted 2026-09-21):
  the Mintlayer explorer runs a token verification system with manual
  approval. Once it exposes a queryable API, the wallet should check token
  properties against it and (a) show a "Verified" badge on verified token
  rows (AssetRow `authority`-style tag), (b) warn on unverified tokens whose
  ticker/name mimics a native asset ("ML"/"BTC") or a well-known token.
  Interim hardening shipped 2026-09-21: AssetRow's Token tag and TokenIcon's
  native branding key off the wallet-owned `type`/`native` flags, never off
  the issuer-chosen ticker — a token tickeried "ML" keeps its Token tag and
  can no longer borrow the official ML/BTC logos (TokenIcon `native` prop;
  SwapTokenLogo was already id-keyed).
- **`Account.test.js` unlock/save coverage** is partially restored (worker
  bridge + helpers covered via `runWorkerJob.test.js` /
  `AccountHelpers.test.js`); the 3 commented-out tests
  (creation/restoring, walletsToCreate default/custom) are slated for
  restoration in wave 2; full wasm-path coverage remains open.

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

1. **Real NFT data on the Dashboard NFTs tab** — DONE 2026-09-06: the tab
   renders `MintlayerContext.nftData` as a tile grid (shared `Nft`/`NftList`
   containers, also reachable via "See all" → `/wallet/Mintlayer/nft`).
   Images resolve through the explorer's first-party proxy
   (`/api/ipfs-media/{cid}` on explorer.mintlayer.org / lovelace.…) with the
   public-gateway race as fallback (`Mintlayer.resolveNftImage`, blob-cached);
   issuer https urls are still refused. Detail popup + NFT send wired through
   the pre-existing NftDetails/NftSend flow. Remaining (optional): collection
   grouping (needs `additional_metadata_uri` resolution), media previews
   beyond the proxy's 1 MB PNG/JPEG/WebP envelope.
2. **ML bech32 checksum validation** — DONE 2026-09-29:
   `bech32VerifyChecksum` (src/utils/Helpers/ML/bech32.js) verifies the
   BIP-350 bech32m checksum + HRP for every ML identifier type (addresses
   incl. multisig HRPs, pool, delegation, order ids); the charset regexes
   remain as fast pre-filters. Wired into all four `isMl*Valid` validators
   (AddressField + send/delegation/swap flows). Mintlayer uses bech32m —
   verified against real on-chain/SDK samples; BIP-173 rejects them all.
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
