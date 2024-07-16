import { useState } from 'react'

import { Button } from '@BasicComponents'
import { TextField } from '@ComposedComponents'

import { StringHelpers } from '@Helpers'

import './SettingsAPIItem.css'

const SettingsApiItem = ({
  inputValue,
  setInputValue,
  walletData,
  onSubmitClick,
  onResetClick,
}) => {
  const submitButtonExtraClasses = ['submit-api-button']
  const resetButtonExtraClasses = ['reset-api-button']
  const inputExtraclasses = ['api-input']

  const [fieldValidity, setFieldValidity] = useState(false)
  const [fieldPristinity, setFieldPristinity] = useState(true)

  const checkFieldValidity = (fieldValidity) => {
    const regex = /^https?:\/\/.{3,}\..+$/m
    setFieldValidity(regex.test(fieldValidity))
    return regex.test(fieldValidity)
  }

  const fieldChangeHandler = (value) => {
    checkFieldValidity(value)
    setInputValue(value)
  }

  const onSubmit = (data) => {
    setFieldPristinity(false)
    onSubmitClick(data)
  }

  const onReset = (data) => {
    setFieldPristinity(true)
    onResetClick(data)
  }

  const label = `${StringHelpers.capitalizeFirstLetter(walletData.wallet)} ${walletData.networkType} server`

  return (
    <div className="api-field-wrapper">
      <div className="api-input-wrapper">
        <TextField
          label={label}
          value={inputValue}
          onChangeHandle={fieldChangeHandler}
          validity={fieldValidity}
          placeHolder={walletData.cuurrentServer}
          extraStyleClasses={inputExtraclasses}
          pristinity={fieldPristinity}
          bigGap={false}
          focus={false}
        />
      </div>
      <div className="api-button-wrapper">
        <Button
          onClickHandle={() =>
            onSubmit({
              wallet: walletData.wallet,
              networkType: walletData.networkType,
              data: inputValue,
            })
          }
          extraStyleClasses={submitButtonExtraClasses}
          disabled={!fieldValidity}
        >
          Submit
        </Button>
        <Button
          onClickHandle={() =>
            onReset({
              wallet: walletData.wallet,
              networkType: walletData.networkType,
              data: inputValue,
            })
          }
          extraStyleClasses={resetButtonExtraClasses}
        >
          Reset
        </Button>
      </div>
    </div>
  )
}


export default SettingsApiItem
