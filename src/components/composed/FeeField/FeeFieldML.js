import React, {
  useContext,
} from 'react'

import { NetworkContext } from '@Contexts'
import { Input } from '@BasicComponents'
import { OptionButtons } from '@ComposedComponents'

import './FeeField.css'
import { ML as MLHelpers } from '@Helpers'

const FeeFieldML = ({
  value: parentValue,
  id,
}) => {
  const { feerate } = useContext(NetworkContext)
  const timeToFirstConfirmations = '~2 minutes'

  const options = [{ name: 'norm', value: feerate }]
  const radioButtonValue = 'norm'
  return (
    <div className="fee-field-wrapper">
      <div className="fee-field">
        <div className="fee-input-wrapper ml">
          <Input
            id={id}
            value={parentValue ? parentValue : MLHelpers.getAmountInCoins(Number(feerate / 1000))}
            disabled={true}
          />
          <small>ML</small>
        </div>
        <OptionButtons
          value={radioButtonValue}
          options={options}
        />
      </div>
      <p>Estimated time for 1st confirmation: {timeToFirstConfirmations}</p>
    </div>
  )
}

export default FeeFieldML
