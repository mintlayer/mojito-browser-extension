import styles from './TxRow.module.css'
import IconTile from '../../basic/IconTile/IconTile'

export interface DesignTx {
  id?: string | number
  type: 'receive' | 'send' | 'mint' | 'nft' | 'dapp' | 'burn' | 'swap'
  sym: string
  chain?: string
  amount?: number
  usd?: number
  when?: string
  status?: string
  conf?: string
  hash?: string
  to?: string
  from?: string
  name?: string
  mock?: boolean
  onClick?: () => void
}

const TYPE_META: Record<
  string,
  { icon: string; color: string; label: string }
> = {
  receive: { icon: 'arrow_dn', color: 'var(--be-green)', label: 'Received' },
  send: { icon: 'arrow_up', color: 'var(--be-amber)', label: 'Sent' },
  mint: { icon: 'plus', color: 'var(--be-teal)', label: 'Minted' },
  nft: { icon: 'card', color: 'var(--be-violet)', label: 'NFT received' },
  dapp: { icon: 'flash', color: 'var(--be-violet)', label: 'dApp payment' },
  burn: { icon: 'flash', color: 'var(--be-red)', label: 'Burned' },
  swap: { icon: 'swap', color: 'var(--be-teal)', label: 'Swap' },
}

// Design-system transaction row (doc/ be-home.jsx TxRow).
const TxRow = ({ t }: { t: DesignTx }) => {
  const meta = TYPE_META[t.type] || TYPE_META.send
  const statusColor =
    t.status === 'Confirmed'
      ? 'var(--be-text-2)'
      : t.status === 'Failed'
        ? 'var(--be-red)'
        : 'var(--be-amber)'
  const incoming = t.type === 'receive' || t.type === 'mint'
  return (
    <div
      className={styles.row}
      onClick={t.onClick}
      data-testid="design-tx-row"
    >
      <IconTile
        icon={meta.icon}
        color={meta.color}
      />
      <div className={styles.detail}>
        <div className={styles.label}>
          {meta.label}
          {t.type === 'dapp' && <span className={styles.dim}> · {t.to}</span>}
        </div>
        <div className={styles.sub}>
          {t.when}
          {t.conf ? ` · ${t.conf} conf` : ''}
        </div>
      </div>
      <div className={styles.right}>
        <div className={`${styles.amount} ${incoming ? styles.in : ''}`}>
          {t.type === 'nft'
            ? t.name
            : t.amount != null
              ? `${incoming ? '+' : '−'}${t.amount} ${t.sym}`
              : '—'}
        </div>
        {t.status && (
          <div
            className={styles.status}
            style={{ color: statusColor }}
          >
            {t.status}
          </div>
        )}
      </div>
    </div>
  )
}

export default TxRow
