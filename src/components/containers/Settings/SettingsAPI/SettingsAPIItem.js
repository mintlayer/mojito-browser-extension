import { useState, useEffect } from 'react'

import { Button } from '@BasicComponents'
import { TextField } from '@ComposedComponents'
import { ReactComponent as SuccessImg } from '@Assets/images/icon-success.svg'

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
  const [showSubmitFeedback, setShowSubmitFeedback] = useState(false)
  const [showResetFeedback, setShowResetFeedback] = useState(false)

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
    setShowSubmitFeedback(true)
  }

  const onReset = (data) => {
    setFieldPristinity(true)
    onResetClick(data)
    setShowResetFeedback(true)
  }

  useEffect(() => {
    if (showSubmitFeedback) {
      setTimeout(() => {
        setShowSubmitFeedback(false)
      }, 2000)
    }
    if (showResetFeedback) {
      setTimeout(() => {
        setShowResetFeedback(false)
      }, 2000)
    }
  }
  , [showSubmitFeedback, showResetFeedback])

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
          {showSubmitFeedback ? (
            <SuccessImg className="success-api-icon" />
          ) : (
            'Submit'
          )}
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
          {showResetFeedback ? (
            <SuccessImg className="success-api-icon" />
          ) : (
            'Reset'
          )}
        </Button>
      </div>
    </div>
  )
}


export default SettingsApiItem
