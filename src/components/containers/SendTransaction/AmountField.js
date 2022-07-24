import { CryptoFiatField } from '@ComposedComponents'
import TransactionField from './TransactionField'

const AmountField = ({ amountChanged, transactionData, validity = undefined }) => {
  return (
    <TransactionField>
      <label htmlFor="amount">Amount:</label>
      <CryptoFiatField
        id="amount"
        buttonTitle="Max"
        placeholder="0"
        transactionData={transactionData}
        validity={validity}
        changeValueHandle={amountChanged}
        />
    </TransactionField>
  )
}

export default AmountField
