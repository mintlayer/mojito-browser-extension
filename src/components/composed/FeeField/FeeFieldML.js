import React, { useContext } from 'react'

import { MintlayerContext } from '@Contexts'
import { Input } from '@BasicComponents'

import './FeeField.css'
import { ML as MLHelpers } from '@Helpers'

const FeeFieldML = ({ value: parentValue, id }) => {
  const { feerate } = useContext(MintlayerContext)
  const timeToFirstConfirmations = '~2 minutes'
  return (
    <div className="fee-field-wrapper">
      <div className="fee-field">
        <div className="fee-input-wrapper ml">
          <Input
            id={id}
            value={
              parentValue
                ? parentValue
                : MLHelpers.getAmountInCoins(Number(feerate / 1000))
            }
            disabled={true}
          />
          <small>ML</small>
        </div>
      </div>
      <p>Estimated time for 1st confirmation: {timeToFirstConfirmations}</p>
    </div>
  )
}

export default FeeFieldML
