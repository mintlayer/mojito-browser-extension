import { Input } from '@BasicComponents'
import TransactionField from './TransactionField'

const AddressField = ({ addressChanged }) => {
  return (
    <TransactionField>
      <label htmlFor="address">Send to:</label>
      <Input
        id="address"
        placeholder="bc1.... or 1... or 3..."
        extraStyleClasses={['address-field']}
        onChangeHandle={addressChanged}
        />
    </TransactionField>
  )
}

export default AddressField
