import './transactionButton.css'
import Button from '../basic/button'
import { ReactComponent as ArrowIcon } from '../../assets/img/icon-arrow.svg'

const transactionButton = ({ title, up }) => {
  const buttonExtraClasses = ['button-transaction']
  const buttonUpExtraClasses = ['button-transaction', 'button-transaction-up']
  return (
    <div
      className="transaction-item"
      data-testid={'transaction-button-container'}
    >
      <Button
        extraStyleClasses={up ? buttonUpExtraClasses : buttonExtraClasses}
      >
        <ArrowIcon className="icon-arrow" />
      </Button>
      {title && <span data-testid={'transaction-button-title'}>{title}</span>}
    </div>
  )
}

export default transactionButton
