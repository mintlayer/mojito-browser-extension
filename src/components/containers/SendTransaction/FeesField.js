import { FeeField } from '@ComposedComponents'
import TransactionField from './TransactionField'

const FeesField = ({ feeChanged }) => {
  return (
    <TransactionField>
      <label htmlFor="fee">Fee:</label>
      <FeeField
        id="fee"
        changeValueHandle={feeChanged}/>
    </TransactionField>
  )
}

export default FeesField
