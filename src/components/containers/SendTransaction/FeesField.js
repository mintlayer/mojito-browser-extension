import { FeeField } from '@ComposedComponents'
import TransactionField from './TransactionField'

const FeesField = ({ feeChanged, value }) => {
  return (
    <TransactionField>
      <label htmlFor="fee">Fee:</label>
      <FeeField
        id="fee"
        changeValueHandle={feeChanged}
        value={value}
      />
    </TransactionField>
  )
}

export default FeesField
