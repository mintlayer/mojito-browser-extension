# Server-side requirements for the design-demo UI

This lists every piece of data the new UI (doc/ Mojito BE design) displays that
is **not yet available** from existing services, and what the client currently
does about it. All mocks live in `src/mocks/designData.js` — replacing a mock
with a real service should only require touching that module (or the page that
imports it).

Legend: 🟡 mocked today · ✅ already real

## 1. Assets / tokens

| Data                                                            | Status                                         | Current source                                                    | Server requirement                                                                                                                                                                           |
| --------------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BTC / ML balances                                               | ✅                                             | `useBtcWalletInfo` / `useMlWalletInfo` (Electrum + Mintlayer API) | —                                                                                                                                                                                            |
| BTC / ML fiat price + 24h change                                | ✅                                             | `useExchangeRates`, `useOneDayAgoExchangeRates` (rates API)       | —                                                                                                                                                                                            |
| Price history (sparkline / chart)                               | ✅ (1 day, coins)                              | `useOneDayAgoHist`                                                | Extend rates API with configurable ranges (1H/1D/1W/1M/1Y)                                                                                                                                   |
| 🟡 Mintlayer token list (USDT, CBEAT, SKY…)                     | 🟡 `MOCK_TOKENS`                               | mock                                                              | Token metadata registry: ticker, name, decimals, total supply, issuer address, token id → resolvable from Mintlayer node token metadata; needs an indexer for "tokens owned by this account" |
| 🟡 Token balances per account                                   | 🟡 `MOCK_TOKENS[*].amount`                     | mock                                                              | Account-token balance index (or extend MintlayerProvider `tokenBalances` to aggregate all held token ids incl. amounts)                                                                      |
| 🟡 Token fiat prices + 24h change + history                     | 🟡 `MOCK_PRICES`, `MOCK_TOKENS[*].price/spark` | mock                                                              | Rates service covering Mintlayer tokens (aggregator or DEX spot price), per ticker                                                                                                           |
| 🟡 Token issuer/authority info (mint/burn/lock/freeze controls) | 🟡 `MOCK_TOKENS[*].authority`                  | mock (buttons are display-only)                                   | Node tx builders for token authority operations + fee quoting (design shows "fee 100 ML")                                                                                                    |

## 2. NFTs

| Data                        | Status               | Current source                  | Server requirement                                                                                   |
| --------------------------- | -------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------- |
| 🟡 NFT gallery (owned NFTs) | 🟡 `MOCK_NFTS`       | mock                            | NFT index: tokens of NFT standard owned by account; metadata: name, collection, creator, description |
| 🟡 NFT media                | 🟡 placeholder tiles | mock                            | IPFS/media gateway URLs resolved from token metadata (`media` URI)                                   |
| NFT transfer                | —                    | existing `NftSendPage` (legacy) | — (already wired on-chain)                                                                           |

## 3. Activity / transaction history

| Data                                             | Status                              | Current source                         | Server requirement                                               |
| ------------------------------------------------ | ----------------------------------- | -------------------------------------- | ---------------------------------------------------------------- |
| BTC / ML transaction list                        | ✅                                  | `useBtcWalletInfo` / `useMlWalletInfo` | —                                                                |
| 🟡 Unified cross-chain activity feed             | 🟡 merged client-side               | client merges BTC + ML lists           | Optional: single history endpoint with chain filter + pagination |
| 🟡 Confirmation counts                           | ✅/partial                          | `BTC.getConfirmationsAmount`           | ML: expose block height diff per tx (partially available)        |
| 🟡 Fiat value at tx time                         | 🟡 mock for demo rows               | mock                                   | Historical rates endpoint: `rate(ticker, usd, timestamp)`        |
| 🟡 Tx counterparty labels (dApp names, ENS-like) | 🟡 mock (`to: 'app.mintlayer.dex'`) | mock                                   | Optional naming/label service                                    |

## 4. Receive

| Data                            | Status                        | Current source                   | Server requirement                                           |
| ------------------------------- | ----------------------------- | -------------------------------- | ------------------------------------------------------------ |
| Receiving addresses BTC/ML      | ✅                            | `AccountContext.addresses`       | —                                                            |
| QR code                         | 🟡 placeholder tile           | `QrPlaceholder`                  | None client-optional: render QR locally (add a small QR lib) |
| Fresh address per payment (BTC) | ✅ (exists: unused addresses) | `BitcoinContext.unusedAddresses` | —                                                            |

## 5. dApp connections (design: connect / sign / tx request windows)

| Data                    | Status          | Current source                                                                          | Server requirement                                                    |
| ----------------------- | --------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| 🟡 Connected sites list | 🟡 `MOCK_SITES` | mock                                                                                    | None required initially — persist in extension storage; sync optional |
| Approve flows           | ✅/partial      | `ConnectionPage`, `Sign*Transaction`, `SignChallenge` pages (legacy UI, to be restyled) | —                                                                     |

## 6. Staking / delegation (design "Delegate ML")

| Data                    | Status | Current source                                  | Server requirement |
| ----------------------- | ------ | ----------------------------------------------- | ------------------ |
| Delegation list / stake | ✅     | `MintlayerContext.mlDelegationList` (legacy UI) | Restyle only       |

## Priority order to replace mocks

1. Token balances + metadata index (unblocks Assets list & Manage tokens)
2. Token fiat prices/history (unblocks real token rows)
3. NFT index + media gateway (unblocks NFT tab)
4. Historical rates for "fiat at tx time" (unblocks Activity detail)
5. Token authority operation endpoints (unblocks issuer controls)
