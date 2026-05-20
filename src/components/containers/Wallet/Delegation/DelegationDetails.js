import { useContext } from 'react'
import { Button } from '@BasicComponents'
import { CopyButton } from '@ComposedComponents'
import { SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { ML } from '@Helpers'
import { format } from 'date-fns'
import { ReactComponent as DelegationIcon } from '@Assets/images/icon-delegation.svg'
import { ReactComponent as IconArrowTopRight } from '@Assets/images/icon-arrow-right-top.svg'

import styles from './DelegationDetails.module.css'

const DelegationDetailsItem = ({ title, content }) => {
  return (
    <div
      className={styles.detailRow}
      data-testid="delegation-details-item"
    >
      <span
        className={styles.detailLabel}
        data-testid="delegation-details-item-title"
      >
        {title}
      </span>
      <div
        className={styles.detailValue}
        data-testid="delegation-details-item-content"
      >
        {content}
      </div>
    </div>
  )
}

const DelegationDetails = ({ delegation, onAddFunds, onWithdraw }) => {
  const { networkType } = useContext(SettingsContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET

  const date = delegation.creation_time
    ? format(new Date(delegation.creation_time * 1000), 'dd/MM/yyyy HH:mm')
    : 'not confirmed'
  const balance = delegation.balance.decimal
  const delegationAddress = delegation ? delegation.spend_destination : ''

  const explorerLink = `https://${
    isTestnet ? 'lovelace.' : ''
  }explorer.mintlayer.org/delegation/${delegation?.delegation_id}`

  return (
    <div
      className={styles.delegationDetails}
      data-testid="delegation-details"
    >
      <div className={styles.banner}>
        <div className={styles.bannerIcon}>
          <DelegationIcon />
        </div>
        <span className={styles.bannerLabel}>Delegation</span>
        <div className={styles.bannerAmount}>
          <span className={styles.bannerAmountValue}>{balance}</span>
          <span className={styles.bannerTicker}>ML</span>
        </div>
        <div
          className={`${styles.bannerStatus} ${delegation.decommissioned ? styles.bannerStatusDecommissioned : ''}`}
        >
          {delegation.decommissioned ? 'Inactive' : 'Active'}
        </div>
      </div>

      {delegation.decommissioned && (
        <div className={styles.warning}>
          This pool is decommissioned and will not receive rewards. Please
          withdraw your funds and delegate to an active pool.
        </div>
      )}

      <div className={styles.detailsCard}>
        <DelegationDetailsItem
          title="Date"
          content={date}
        />
        <DelegationDetailsItem
          title="Pool id"
          content={
            <>
              {ML.formatAddress(delegation.pool_id, 16)}
              <CopyButton content={delegation.pool_id} />
            </>
          }
        />
        <DelegationDetailsItem
          title="Amount"
          content={`${balance} ML`}
        />
        <DelegationDetailsItem
          title="Spend address"
          content={
            <>
              {ML.formatAddress(delegationAddress, 16)}
              <CopyButton content={delegationAddress} />
            </>
          }
        />
        <DelegationDetailsItem
          title="Delegation id"
          content={
            <>
              {ML.formatAddress(delegation.delegation_id, 16)}
              <CopyButton content={delegation.delegation_id} />
            </>
          }
        />
      </div>

      {delegation.type !== 'Unconfirmed' && (
        <div className={styles.actionRow}>
          <Button
            extraStyleClasses={[styles.actionButton]}
            onClickHandle={onAddFunds}
            disabled={delegation.decommissioned}
          >
            Add funds
          </Button>
          <Button
            extraStyleClasses={[styles.actionButton]}
            onClickHandle={onWithdraw}
          >
            Withdraw
          </Button>
        </div>
      )}

      <a
        href={explorerLink}
        target="_blank"
        rel="noreferrer"
      >
        <Button
          extraStyleClasses={[styles.explorerButton]}
          alternate
        >
          <IconArrowTopRight />
          Open in Block Explorer
        </Button>
      </a>
    </div>
  )
}

export { DelegationDetailsItem }

export default DelegationDetails
