import styles from './AssetRow.module.css'
import Tag from '../../basic/Tag/Tag'
import TokenIcon from '../../basic/TokenIcon/TokenIcon'
import Sparkline from '../../basic/Sparkline/Sparkline'
import LivePill from '../../basic/LivePill/LivePill'

export interface DesignAsset {
  id: string
  name: string
  symbol: string
  chain: string
  amount: number
  price?: number
  change24h?: number
  spark?: number[]
  mock?: boolean
  authority?: boolean
  iconUri?: string
  onClick?: () => void
  index?: number
}

// Design-system asset row (doc/ be-home.jsx token list row).
const AssetRow = ({ a }: { a: DesignAsset }) => {
  const fiat = a.price != null ? a.amount * a.price : undefined
  return (
    <div
      className={styles.row}
      onClick={a.onClick}
      data-testid="crypto-item"
    >
      <TokenIcon
        symbol={a.symbol}
        iconUri={a.iconUri}
      />
      <div className={styles.detail}>
        <div className={styles.titleLine}>
          <span className={styles.title}>
            {a.name} ({a.symbol})
          </span>
          {a.chain === 'Mintlayer' && a.id !== 'ml' && (
            <Tag c="teal">Token</Tag>
          )}
          {a.authority && <Tag c="violet">Issuer</Tag>}
          {a.mock && <Tag c="amber">Demo</Tag>}
        </div>
        <div className={styles.sub}>
          {a.amount.toLocaleString(undefined, {
            maximumFractionDigits: 6,
          })}{' '}
          {a.symbol}
        </div>
      </div>
      {a.spark && a.spark.length > 1 && (
        <Sparkline
          data={a.spark}
          color={(a.change24h ?? 0) >= 0 ? 'var(--be-green)' : 'var(--be-red)'}
          width={44}
          height={20}
        />
      )}
      <div className={styles.fiatSide}>
        <div className={styles.fiat}>
          {fiat != null
            ? fiat.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : '—'}{' '}
          $
        </div>
        {a.change24h != null && <LivePill value={a.change24h} />}
      </div>
    </div>
  )
}

export default AssetRow
