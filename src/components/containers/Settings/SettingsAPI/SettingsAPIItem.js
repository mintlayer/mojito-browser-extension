import { useState, useEffect } from 'react'

import { Button } from '@BasicComponents'
import { TextField } from '@ComposedComponents'
import { ReactComponent as SuccessImg } from '@Assets/images/icon-success.svg'
import { ReactComponent as UnsuccessImg } from '@Assets/images/icon-cross.svg'

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
  const [showSubmitSuccess, setShowSubmitSuccess] = useState(false)
  const [showSubmitUnsuccess, setShowSubmitUnsuccess] = useState(false)
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

  const onSubmit = async (data) => {
    if (inputValue.length <= 0) {
      return
    }
    setFieldPristinity(false)
    const responce = await onSubmitClick(data)
    if (responce) {
      setShowSubmitSuccess(true)
    } else {
      setShowSubmitUnsuccess(true)
      setFieldValidity(false)
      setInputValue('Something went wrong. Try again with a valid server')
    }
  }

  const onReset = (data) => {
    onResetClick(data)
    setFieldPristinity(true)
    setFieldValidity(false)
    setInputValue('')
    setShowSubmitSuccess(false)
    setShowSubmitUnsuccess(false)
    setShowResetFeedback(true)
  }

  useEffect(() => {
    if (showSubmitSuccess) {
      setTimeout(() => {
        setShowSubmitSuccess(false)
        setInputValue('')
      }, 2000)
    }
    if (showSubmitUnsuccess) {
      setTimeout(() => {
        setShowSubmitUnsuccess(false)
      }, 2000)
    }
    if (showResetFeedback) {
      setTimeout(() => {
        setShowResetFeedback(false)
      }, 2000)
    }

    setFieldPristinity(true)
    setFieldValidity(false)
  }, [showSubmitSuccess, showSubmitUnsuccess, showResetFeedback, setInputValue])

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
          {showSubmitSuccess ? (
            <SuccessImg
              className="success-api-icon"
              data-testid="success-api-feedback"
            />
          ) : showSubmitUnsuccess ? (
            <UnsuccessImg
              className="success-api-icon"
              data-testid="unsuccess-api-feedback"
            />
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
            <SuccessImg
              className="success-api-icon"
              data-testid="reset-api-feedback"
            />
          ) : (
            'Reset'
          )}
        </Button>
      </div>
    </div>
  )
}

export default SettingsApiItem
