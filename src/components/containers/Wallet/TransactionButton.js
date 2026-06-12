import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow-down.svg'
import { ReactComponent as DelegationIcon } from '@Assets/images/icon-delegation.svg'
import { ReactComponent as SignIcon } from '@Assets/images/icon-sign.svg'
import { ReactComponent as NftIcon } from '@Assets/images/icon-nft.svg'
import { ReactComponent as SwapIcon } from '@Assets/images/icon-arrow-swap.svg'
import { ReactComponent as AddressesIcon } from '@Assets/images/icon-inbox.svg'

import { Button } from '@BasicComponents'

import './TransactionButton.css'

const TransactionButton = ({ title, mode, onClick, disabled }) => {
  const isWide = mode === 'up' || !mode

  const getButtonStyles = () => {
    if (mode === 'up')
      return [
        'button-transaction',
        'button-transaction-wide',
        'button-transaction-up',
      ]
    if (!mode)
      return [
        'button-transaction',
        'button-transaction-wide',
        'button-transaction-receive',
      ]
    if (mode === 'staking')
      return [
        'button-transaction',
        'button-transaction-small',
        'button-transaction-staking',
      ]
    if (mode === 'swap')
      return [
        'button-transaction',
        'button-transaction-small',
        'button-transaction-swap',
      ]
    return ['button-transaction', 'button-transaction-small']
  }

  const getIcon = () => {
    switch (mode) {
      case 'staking':
        return <DelegationIcon className="staking-icon" />
      case 'sign':
        return <SignIcon className="sign-icon" />
      case 'nft':
        return <NftIcon className="nft-icon" />
      case 'swap':
        return <SwapIcon className="swap-icon" />
      case 'addresses':
        return <AddressesIcon className="swap-icon" />
      case 'up':
        return <ArrowIcon className="icon-arrow" />
      default:
        return <ArrowIcon className="icon-arrow" />
    }
  }

  return (
    <div
      className={`transaction-item ${isWide ? 'transaction-item-wide' : ''}`}
      data-testid={'transaction-button-container'}
    >
      <Button
        extraStyleClasses={getButtonStyles()}
        onClickHandle={onClick}
        disabled={disabled}
      >
        {getIcon()}
        {title && (
          <span
            className="button-transaction-label"
            data-testid={'transaction-button-title'}
          >
            {title}
          </span>
        )}
      </Button>
    </div>
  )
}

export default TransactionButton
