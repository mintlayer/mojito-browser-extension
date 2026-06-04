import { format } from 'date-fns'
import { ReactComponent as LockIcon } from '@Assets/images/icon-lock.svg'

import styles from './LockedBalanceListItem.module.css'

const LockedBalanceListItem = ({ utxo }) => {
  return (
    <li className={styles.card}>
      <div className={styles.cardTop}>
        <div className={styles.cardIcon}>
          <LockIcon />
        </div>
        <div className={styles.cardInfo}>
          <p className={styles.cardDate}>
            ~{' '}
            {format(
              new Date(utxo.computed.timestamp * 1000),
              'dd/MM/yyyy · HH:mm',
            )}
          </p>
          <div className={styles.cardMeta}>
            {utxo.computed.unlockHeight && (
              <span className={styles.blockBadge}>
                Block {utxo.computed.unlockHeight.toLocaleString()}
              </span>
            )}
            {utxo.computed.blocksToUnlock != null && (
              <span className={styles.blocksLeft}>
                unlocks in ~{utxo.computed.blocksToUnlock} blocks
              </span>
            )}
          </div>
        </div>
      </div>
      <p className={styles.cardAmount}>
        {utxo.utxo.value.amount.decimal}
        <span>ML</span>
      </p>
      <div className={styles.progressBar}>
        <div
          className={styles.progressFill}
          style={{ width: `${utxo.computed.progress * 100}%` }}
        />
      </div>
    </li>
  )
}

export default LockedBalanceListItem
