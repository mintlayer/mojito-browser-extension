import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow-down.svg'
import { ReactComponent as DelegationIcon } from '@Assets/images/icon-delegation.svg'

import { Button } from '@BasicComponents'

import './TransactionButton.css'

const TransactionButton = ({ title, mode, onClick, disabled }) => {
  const buttonExtraClasses = ['button-transaction']
  const buttonUpExtraClasses = ['button-transaction', 'button-transaction-up']
  const buttonStakingExtraClasses = [
    'button-transaction',
    'button-transaction-staking',
  ]
  return (
    <div
      className="transaction-item"
      data-testid={'transaction-button-container'}
    >
      <Button
        extraStyleClasses={
          mode === 'up'
            ? buttonUpExtraClasses
            : mode === 'staking'
              ? buttonStakingExtraClasses
              : buttonExtraClasses
        }
        onClickHandle={onClick}
        disabled={disabled}
      >
        {mode === 'staking' ? (
          <DelegationIcon className="staking-icon" />
        ) : (
          <ArrowIcon className="icon-arrow" />
        )}
      </Button>
      {title && <span data-testid={'transaction-button-title'}>{title}</span>}
    </div>
  )
}

export default TransactionButton
