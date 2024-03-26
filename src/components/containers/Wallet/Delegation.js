import React, { useState, useContext } from 'react'
// import { format } from 'date-fns'

import { ReactComponent as StakeIcon } from '@Assets/images/icon-stake.svg'
import { Format } from '@Helpers'
import { Loading, PopUp } from '@ComposedComponents'
import { ML } from '@Helpers'
import { AppInfo } from '@Constants'
import { Button } from '@BasicComponents'
import { LocalStorageService } from '@Storage'

import { TransactionContext, SettingsContext, AccountContext } from '@Contexts'

import DelegationDetails from './DelegationDetails'

import './Delegation.css'
import { format } from 'date-fns'

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

  const date = delegationOject.creation_time
    ? format(new Date(delegationOject.creation_time * 1000), 'dd/MM/yyyy HH:mm')
    : 'not confirmed'

  return (
    <li
      className="transaction"
      data-testid="delegation"
      onClick={() => setDetailPopupOpen(true)}
    >
      {delegation.type === 'Unconfirmed' && delegation.mode === 'delegation' && (
        <>
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              height: '3px',
              width: '40px',
              backgroundColor: 'rgb(17, 150, 127)',
              animation: 'grow 60s cubic-bezier(0.4, 0, 1, 1) forwards',
            }}
          ></div>
          <div
            style={{
              position: 'absolute',
              top: '50%',
              marginTop: '-38px',
              marginLeft: '-2px',
              transform: 'scale(1.2)',
            }}
          >
            <Loading />
          </div>
        </>
      )}
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
            {delegation && delegationOject.pool_id
              ? formatAddress(delegationOject.pool_id)
              : ''}
          </p>
          <div className="transaction-date-amount">
            {delegationOject.creation_time && (
              <p
                className="transaction-date"
                data-testid="delegation-date"
              >
                Date: <span>{date}</span>
              </p>
            )}

            {delegation.type === 'Unconfirmed' &&
              delegation.mode === 'delegation' && (
                <p
                  className="transaction-date"
                  data-testid="delegation-date"
                >
                  Preparing delegation for staking
                </p>
              )}

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
          {delegation.type === 'Unconfirmed' &&
            delegation.mode === 'delegation' && (
              <div className="delegation-actions">
                <Button
                  extraStyleClasses={buttonExtraStyles}
                  disabled={true}
                >
                  Add funds
                </Button>
                <Button
                  extraStyleClasses={buttonExtraStyles}
                  disabled={true}
                >
                  Withdraw
                </Button>
              </div>
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
