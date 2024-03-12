import { useContext } from 'react'
// import { format } from 'date-fns'

import { Format } from '@Helpers'
import { Button } from '@BasicComponents'
import { SettingsContext, TransactionContext } from '@Contexts'
import { AppInfo } from '@Constants'
import { ML } from '@Helpers'

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
  const { networkType } = useContext(SettingsContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET

  // const date = delegation.date
  //   ? format(new Date(delegation.date * 1000), 'dd/MM/yyyy HH:mm')
  //   : 'not confirmed'
  // TODO: replace with actual date
  const date = '12.02.2024'
  const balance = Format.BTCValue(ML.getAmountInCoins(delegation.balance))
  const buttonExtraStyles = ['delegation-details-button']
  const addressTitle = 'Spend address:'
  const delegationAddress = delegation ? delegation.spend_destination : ''

  const explorerLink = `https://${
    isTestnet ? 'lovelace.' : ''
  }explorer.mintlayer.org/delegation/${delegation?.delegation_id}`

  const addFundsClickHandle = () => {
    setCurrentDelegationInfo(delegation)
    setTransactionMode(AppInfo.ML_TRANSACTION_MODES.STAKING)
    setDelegationStep(2)
  }

  const withdrawClickHandle = () => {
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
        <div className="delegation-action-wrapper">
          <Button
            extraStyleClasses={buttonExtraStyles}
            onClickHandle={addFundsClickHandle}
          >
            Add funds
          </Button>
          <Button
            extraStyleClasses={buttonExtraStyles}
            onClickHandle={withdrawClickHandle}
          >
            Withdraw
          </Button>
        </div>
        <a
          href={explorerLink}
          target="_blank"
        >
          <Button extraStyleClasses={buttonExtraStyles}>
            Open In Blockchain
          </Button>
        </a>
      </div>
    </div>
  )
}

export { DelegationDetailsItem }

export default DelegationDetails
