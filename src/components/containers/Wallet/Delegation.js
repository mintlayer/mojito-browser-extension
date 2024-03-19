import { useState, useContext } from 'react'
// import { format } from 'date-fns'

import { ReactComponent as StakeIcon } from '@Assets/images/icon-stake.svg'
import { Format } from '@Helpers'
import { PopUp } from '@ComposedComponents'
import { ML } from '@Helpers'
import { AppInfo } from '@Constants'
import { Button } from '@BasicComponents'
import { LocalStorageService } from '@Storage'

import { TransactionContext, SettingsContext, AccountContext } from '@Contexts'

import DelegationDetails from './DelegationDetails'

import './Delegation.css'

const Delegation = ({ delegation }) => {
  const { setDelegationStep, setTransactionMode, setCurrentDelegationInfo } =
    useContext(TransactionContext)
  const { walletType } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const [detailPopupOpen, setDetailPopupOpen] = useState(false)
  // const date = delegation.date
  //   ? format(new Date(delegation.date * 1000), 'dd/MM/yyyy HH:mm')
  //   : 'not confirmed'

  const formatAddress = (address) => {
    if (!address) {
      return 'Wrong address'
    }
    const limitSize = 24
    const halfLimit = limitSize / 2
    const firstPart = address.slice(0, halfLimit)
    const lastPart = address.slice(address.length - halfLimit, address.length)
    return `${firstPart}...${lastPart}`
  }

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

  let delegationOject = delegation

  if (delegation.type === 'Unconfirmed') {
    delegationOject = {
      balance: delegation.value,
      pool_id: delegation.poolId,
      delegation_id: 'Not confirmed',
      spend_destination: 'Not confirmed',
    }
  }

  const value = delegationOject.balance
    ? ML.getAmountInCoins(delegation.balance, AppInfo.ML_ATOMS_PER_COIN)
    : 0

  const buttonExtraStyles = ['delegation-action-button']
  const account = LocalStorageService.getItem('unlockedAccount')
  const accountName = account.name
  const unconfirmedTransactionString = `${AppInfo.UNCONFIRMED_TRANSACTION_NAME}_${accountName}_${networkType}`
  const isUncofermedTransaction =
    LocalStorageService.getItem(unconfirmedTransactionString) &&
    walletType.name === 'Mintlayer'

  return (
    <li
      className="transaction"
      data-testid="delegation"
      onClick={() => setDetailPopupOpen(true)}
    >
      <div
        className={'transaction-logo-type transaction-logo-out'}
        data-testid="delegation-icon"
      >
        <StakeIcon className={'delegation-staking-icon'} />
      </div>
      <div className="transaction-detail">
        <div>
          <p
            className="transaction-id"
            data-testid="delegation-otherPart"
          >
            {delegation && formatAddress(delegationOject.pool_id)}
          </p>
          <div className="transaction-date-amount">
            {/* <p
            className="transaction-date"
            data-testid="delegation-date"
          > */}
            {/* TODO: update date when available from API */}
            {/* Date: <span>12.02.2024</span> */}
            {/* </p> */}
            <p
              className="transaction-amount"
              data-testid="delegation-amount"
            >
              Amount: <span>{delegation && Format.BTCValue(value)}</span>
            </p>
          </div>
          {delegation.type !== 'Unconfirmed' && (
            <div className="delegation-actions">
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
          {delegation.type === 'Unconfirmed' && (
            <>
              <p className="unconfirmed-delegation-message">
                The delegation hasn't been confirmed yet. Kindly wait for the
                transaction to finalize. The page will refresh every 30 seconds
                until confirmation.
              </p>
            </>
          )}
        </div>
      </div>
      {detailPopupOpen && (
        <PopUp setOpen={setDetailPopupOpen}>
          <DelegationDetails delegation={delegationOject} />
        </PopUp>
      )}
    </li>
  )
}

export default Delegation
