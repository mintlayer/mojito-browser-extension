import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow-down.svg'
import { ReactComponent as DelegationIcon } from '@Assets/images/icon-delegation.svg'
import { ReactComponent as SignIcon } from '@Assets/images/icon-sign.svg'
import { ReactComponent as NftIcon } from '@Assets/images/icon-nft.svg'
import { ReactComponent as SwapIcon } from '@Assets/images/icon-arrow-swap.svg'
import { ReactComponent as AddressesIcon } from '@Assets/images/icon-inbox.svg'

import { Button } from '@BasicComponents'

import './TransactionButton.css'

const TransactionButton = ({ title, mode, onClick, disabled }) => {
  const buttonExtraClasses = ['button-transaction']
  const buttonUpExtraClasses = ['button-transaction', 'button-transaction-up']
  const buttonStakingExtraClasses = [
    'button-transaction',
    'button-transaction-staking',
  ]
  const buttonSwapExtraClasses = [
    'button-transaction',
    'button-transaction-swap',
  ]

  const getButtonStyles = () => {
    switch (mode) {
      case 'up':
        return buttonUpExtraClasses
      case 'staking':
        return buttonStakingExtraClasses
      case 'swap':
        return buttonSwapExtraClasses
      default:
        return buttonExtraClasses
    }
  }

  return (
    <div
      className="transaction-item"
      data-testid={'transaction-button-container'}
    >
      <Button
        extraStyleClasses={getButtonStyles()}
        onClickHandle={onClick}
        disabled={disabled}
      >
        {mode === 'staking' ? (
          <DelegationIcon className="staking-icon" />
        ) : mode === 'sign' ? (
          <SignIcon className="sign-icon" />
        ) : mode === 'nft' ? (
          <NftIcon />
        ) : mode === 'swap' ? (
          <SwapIcon className="swap-icon" />
        ) : mode === 'addresses' ? (
          <AddressesIcon className="swap-icon" />
        ) : (
          <ArrowIcon className="icon-arrow" />
        )}
      </Button>
      {title && <span data-testid={'transaction-button-title'}>{title}</span>}
    </div>
  )
}

export default TransactionButton
