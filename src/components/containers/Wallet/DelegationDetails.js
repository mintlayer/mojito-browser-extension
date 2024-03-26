import { useContext } from 'react'
// import { format } from 'date-fns'

import { Format } from '@Helpers'
import { Button } from '@BasicComponents'
import { SettingsContext, TransactionContext, AccountContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { ML } from '@Helpers'
import { LocalStorageService } from '@Storage'
import { format } from 'date-fns'

import './DelegationDetails.css'

const DelegationDetailsItem = ({ title, content }) => {
  return (
    <div
      className="delegation-details-item"
      data-testid="delegation-details-item"
    >
      <h2 data-testid="delegation-details-item-title">{title}</h2>
      <div
        className="delegation-details-content"
        data-testid="delegation-details-item-content"
      >
        {content}
      </div>
    </div>
  )
}

const DelegationDetails = ({ delegation }) => {
  const { setDelegationStep, setTransactionMode, setCurrentDelegationInfo } =
    useContext(TransactionContext)
  const { walletType } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET
  const account = LocalStorageService.getItem('unlockedAccount')
  const accountName = account.name
  const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${networkType}`
  const isUncofermedTransaction =
    LocalStorageService.getItem(unconfirmedTransactionString) &&
    walletType.name === 'Mintlayer'

  const date = delegation.creation_time
    ? format(new Date(delegation.creation_time * 1000), 'dd/MM/yyyy HH:mm')
    : 'not confirmed'
  const balance = Format.BTCValue(ML.getAmountInCoins(delegation.balance))
  const buttonExtraStyles = ['delegation-details-button']
  const addressTitle = 'Spend address:'
  const delegationAddress = delegation ? delegation.spend_destination : ''

  const explorerLink = `https://${
    isTestnet ? 'lovelace.' : ''
  }explorer.mintlayer.org/delegation/${delegation?.delegation_id}`

  const addFundsClickHandle = () => {
    if (isUncofermedTransaction) return
    setCurrentDelegationInfo(delegation)
    setTransactionMode(AppInfo.ML_TRANSACTION_MODES.STAKING)
    setDelegationStep(2)
  }

  const withdrawClickHandle = () => {
    if (isUncofermedTransaction) return
    setCurrentDelegationInfo(delegation)
    setTransactionMode(AppInfo.ML_TRANSACTION_MODES.WITHDRAW)
    setDelegationStep(2)
  }

  return (
    <div
      className="delegation-details"
      data-testid="delegation-details"
    >
      <div className="delegation-details-items-wrapper">
        <DelegationDetailsItem
          title={'Date:'}
          content={date}
        />
        <DelegationDetailsItem
          title={'Pool id:'}
          content={delegation.pool_id}
        />
        <DelegationDetailsItem
          title={'Amount:'}
          content={balance}
        />
        <DelegationDetailsItem
          title={addressTitle}
          content={delegationAddress}
          data-testid="delegation-address"
        />
        <DelegationDetailsItem
          title={'Id:'}
          content={delegation.delegation_id}
        />
      </div>
      <div>
        {delegation.type !== 'Unconfirmed' && (
          <div className="delegation-action-wrapper">
            <Button
              extraStyleClasses={buttonExtraStyles}
              onClickHandle={addFundsClickHandle}
              disabled={isUncofermedTransaction}
            >
              Add funds
            </Button>
            <Button
              extraStyleClasses={buttonExtraStyles}
              onClickHandle={withdrawClickHandle}
              disabled={isUncofermedTransaction}
            >
              Withdraw
            </Button>
          </div>
        )}
        <a
          href={explorerLink}
          target="_blank"
        >
          <Button extraStyleClasses={buttonExtraStyles}>
            Open In Block Explorer
          </Button>
        </a>
      </div>
    </div>
  )
}

export { DelegationDetailsItem }

export default DelegationDetails
