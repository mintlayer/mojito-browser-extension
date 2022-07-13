import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow.svg'

import { Button } from '@BasicComponents'

import './TransactionButton.css'

const TransactionButton = ({ title, up, onClick }) => {
  const buttonExtraClasses = ['button-transaction']
  const buttonUpExtraClasses = ['button-transaction', 'button-transaction-up']
  return (
    <div
      className="transaction-item"
      data-testid={'transaction-button-container'}
    >
      <Button
        extraStyleClasses={up ? buttonUpExtraClasses : buttonExtraClasses}
        onClickHandle={onClick}
      >
        <ArrowIcon className="icon-arrow" />
      </Button>
      {title && <span data-testid={'transaction-button-title'}>{title}</span>}
    </div>
  )
}

export default TransactionButton
