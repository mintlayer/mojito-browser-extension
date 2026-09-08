import { useContext } from 'react'
import { useNavigate, useParams } from 'react-router'

import { TxRow } from '@ComposedComponents'
import { AccountContext, BitcoinContext, MintlayerContext } from '@Contexts'
import {
  PageWrapper,
  TokenIcon,
  LivePill,
  ChainBadge,
  KV,
  Eyebrow,
  Sparkline,
  Button,
} from '@BasicComponents'
import {
  useExchangeRates,
  useOneDayAgoHist,
  useBtcWalletInfo,
  useMlWalletInfo,
} from '@Hooks'
import { Transactions, BTC } from '@Helpers'
const { adaptDesignTx } = Transactions

import styles from './AssetPage.module.css'

/**
 * Asset detail screen from the design (doc/ be-home.jsx AssetScreenBE).
 * Real data for BTC, ML and Mintlayer tokens (via MintlayerContext
 * `tokenBalances`, enriched from GET /token/:tokenId).
 */
const AssetPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { addresses } = useContext(AccountContext)
  const { unusedAddresses: btcUnused } = useContext(BitcoinContext)
  const { tokenBalances } = useContext(MintlayerContext)

  const isBtc = id === 'Bitcoin'
  const isMl = id === 'Mintlayer'
  const isReal = isBtc || isMl

  const btcInfo = useBtcWalletInfo()
  // Token mode for Mintlayer token ids (token-scoped balance + txs),
  // full ML wallet info for coins.
  const mlInfo = useMlWalletInfo(undefined, id)
  const { exchangeRate: btcRate } = useExchangeRates('btc', 'usd')
  const { exchangeRate: mlRate } = useExchangeRates('ml', 'usd')
  const { historyRates: btcHist } = useOneDayAgoHist('btc', 'usd')
  const { historyRates: mlHist } = useOneDayAgoHist('ml', 'usd')

  const tokenData = isReal ? null : (tokenBalances?.[id] ?? null)

  const ticker = isBtc
    ? 'BTC'
    : isMl
      ? 'ML'
      : tokenData?.token_info?.token_ticker?.string || 'TKN'
  const name = isBtc ? 'Bitcoin' : isMl ? 'Mintlayer' : ticker
  const chain = isBtc ? 'Bitcoin' : 'Mintlayer'

  // Coin balances come formatted as strings; token balances are numbers.
  const amount = isBtc
    ? Number(btcInfo.balance?.replace?.(/,/g, '') || 0)
    : Number(mlInfo.balance ?? 0)
  const price = isBtc ? btcRate : isMl ? mlRate : undefined
  const fiat = price != null ? amount * price : undefined
  const spark = isBtc
    ? Object.values(btcHist || {})
    : isMl
      ? Object.values(mlHist || {})
      : []
  const change24h =
    spark.length > 1 && spark[0]
      ? ((spark[spark.length - 1] - spark[0]) / spark[0]) * 100
      : null

  const realTxs = (isBtc ? btcInfo.transactions : mlInfo.transactions) || []
  const txRows = realTxs
    .slice(0, 12)
    .map((tx) => adaptDesignTx(tx, ticker, chain))

  const sendTarget = isBtc
    ? '/wallet/Bitcoin/send-btc-transaction'
    : '/wallet/Mintlayer/send-ml-transaction'
  const receiveAddress = isBtc
    ? BTC.getBtcAddressString(
        addresses?.btcAddresses?.btcReceivingAddresses?.[0],
      ) || btcUnused?.receivingAddress
    : addresses?.mlAddresses?.mlReceivingAddresses?.[0] ||
      mlInfo.unusedAddresses?.receive

  return (
    <PageWrapper className={styles.pageWrapper}>
      <div className={styles.page}>
        <div className={styles.header}>
          <TokenIcon
            symbol={ticker}
            size={48}
            iconUri={tokenData?.token_info?.icon_uri?.string}
          />
          <div className={styles.assetName}>{name}</div>
          <div className={styles.amount}>
            {amount.toLocaleString(undefined, { maximumFractionDigits: 8 })}
          </div>
          <div className={styles.ticker}>{ticker}</div>
          <div className={styles.fiatLine}>
            {fiat != null && (
              <span className={styles.fiat}>
                {fiat.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}{' '}
                $
              </span>
            )}
            {change24h != null && <LivePill value={change24h} />}
          </div>
          <div className={styles.badges}>
            <ChainBadge chain={chain} />
          </div>
        </div>

        {spark.length > 1 && (
          <div className={styles.chartCard}>
            <Sparkline
              data={spark}
              width={320}
              height={70}
              color="var(--be-amber)"
              responsive
            />
          </div>
        )}

        <div className={styles.actions}>
          {isReal && (
            <Button
              extraStyleClasses={[styles.actionButton]}
              onClickHandle={() => navigate(sendTarget)}
            >
              Send
            </Button>
          )}
          <Button
            extraStyleClasses={[styles.actionSecondary]}
            onClickHandle={() =>
              navigate('/receive', {
                state: { chain: isBtc ? 'Bitcoin' : 'Mintlayer' },
              })
            }
          >
            Receive
          </Button>
        </div>

        {receiveAddress && (
          <KV
            rows={[
              [
                isBtc ? 'BTC address' : 'ML address',
                `${receiveAddress.slice(0, 10)}…${receiveAddress.slice(-8)}`,
              ],
            ]}
          />
        )}

        {tokenData && (
          <div className={styles.section}>
            <Eyebrow>Token info</Eyebrow>
            <div className={styles.kvGap} />
            <KV
              rows={[
                ['Ticker', ticker],
                ['Token ID', id],
                ['Decimals', tokenData.token_info?.number_of_decimals ?? '—'],
                [
                  'Balance',
                  amount.toLocaleString(undefined, {
                    maximumFractionDigits: 8,
                  }),
                ],
              ]}
            />
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.sectionTitle}>Activity</div>
          <div className={styles.card}>
            {txRows.length ? (
              txRows.map((t, i) => (
                <TxRow
                  key={i}
                  t={t}
                />
              ))
            ) : (
              <div className={styles.empty}>No {ticker} transactions</div>
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  )
}

export default AssetPage
