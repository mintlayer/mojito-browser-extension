import { useState } from 'react'

import { TxRow, BeSheet, CopyButton } from '@ComposedComponents'
import { PageWrapper, Seg, ChainBadge, KV, Eyebrow } from '@BasicComponents'
import { useBtcWalletInfo, useMlWalletInfo } from '@Hooks'
import { Transactions } from '@Helpers'
const { adaptDesignTx } = Transactions

import styles from './ActivityPage.module.css'

/**
 * Activity screen from the design (doc/ be-settings.jsx ActivityScreenBE +
 * TxSheet). Real transactions; the design's confirmation counts and fiat-at-
 * tx-time are mocked/partial — see doc/server-requirements.md.
 */
const ActivityPage = () => {
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState(null)

  const btcInfo = useBtcWalletInfo()
  const mlInfo = useMlWalletInfo()

  const all = [
    ...(btcInfo.transactions || []).map((t) =>
      adaptDesignTx(t, 'BTC', 'Bitcoin'),
    ),
    ...(mlInfo.transactions || []).map((t) =>
      adaptDesignTx(t, 'ML', 'Mintlayer'),
    ),
  ]

  const list = all.filter(
    (t) =>
      filter === 'All' ||
      (filter === 'BTC' ? t.chain === 'Bitcoin' : t.chain === 'Mintlayer'),
  )
  const pending = list.filter((t) => t.status !== 'Confirmed')
  const history = list.filter((t) => t.status === 'Confirmed')

  return (
    <PageWrapper className={styles.pageWrapper}>
      <div className={styles.page}>
        <div className={styles.header}>
          <span className={styles.title}>Activity</span>
          <Seg
            value={filter}
            options={['All', 'BTC', 'ML']}
            onChange={setFilter}
          />
        </div>

        {pending.length > 0 && (
          <>
            <Eyebrow>Pending</Eyebrow>
            <div className={`${styles.card} ${styles.pendingCard}`}>
              {pending.map((t, i) => (
                <TxRow
                  key={i}
                  t={{ ...t, onClick: () => setSelected(t) }}
                />
              ))}
            </div>
          </>
        )}

        <Eyebrow>History</Eyebrow>
        <div className={styles.card}>
          {history.length ? (
            history.map((t, i) => (
              <TxRow
                key={i}
                t={{ ...t, onClick: () => setSelected(t) }}
              />
            ))
          ) : (
            <div className={styles.empty}>
              No transactions — activity on the selected network shows here.
            </div>
          )}
        </div>

        <BeSheet
          open={!!selected}
          onClose={() => setSelected(null)}
          title="Transaction detail"
        >
          {selected && (
            <>
              <div className={styles.sheetHeader}>
                <div className={styles.sheetAmount}>
                  {selected.type === 'receive' ? '+' : '−'}
                  {selected.amount} {selected.sym}
                </div>
                <ChainBadge chain={selected.chain} />
              </div>
              <KV
                rows={[
                  ['Date', selected.when],
                  ['Status', selected.status],
                  ...(selected.hash
                    ? [
                        [
                          'Hash',
                          <span
                            key="hash"
                            className={styles.hashLine}
                          >
                            {String(selected.hash).slice(0, 14)}…
                            <CopyButton content={selected.hash} />
                          </span>,
                        ],
                      ]
                    : []),
                ]}
              />
            </>
          )}
        </BeSheet>
      </div>
    </PageWrapper>
  )
}

export default ActivityPage
