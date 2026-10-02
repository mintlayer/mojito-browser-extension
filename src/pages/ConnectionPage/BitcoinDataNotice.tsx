import { Toggle } from '@BasicComponents'

import styles from './BitcoinDataNotice.module.css'

interface BitcoinDataNoticeProps {
  provideBitcoinData: boolean
  onToggle: (value: boolean) => void
}

const BitcoinDataNotice = ({
  provideBitcoinData,
  onToggle,
}: BitcoinDataNoticeProps) => {
  return (
    <div className={styles.section}>
      <div className={styles.toggleRow}>
        <div className={styles.toggleText}>
          <span className={styles.toggleTitle}>Provide Bitcoin data</span>
          <span className={styles.toggleDescription}>
            Addresses and public keys
          </span>
        </div>
        <Toggle
          label=""
          name="provideBitcoinData"
          toggled={provideBitcoinData}
          onClick={onToggle}
        />
      </div>

      <div className={styles.infoBlock}>
        <span className={styles.infoIcon}>i</span>
        <p className={styles.infoText}>
          <strong>Note:</strong> This option is mandatory when connecting to
          HTLC Atomic Swaps dApps. It provides both Bitcoin addresses and public
          keys required for cross-chain transactions.
        </p>
      </div>
    </div>
  )
}

export default BitcoinDataNotice
