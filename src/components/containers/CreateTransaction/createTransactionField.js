import React, { useState } from 'react'
import { Button, Input } from '@BasicComponents'
import './createTransactionField.css'
import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow.svg'

const CreateTransactionField = ({
  label,
  placeholder,
  buttonTitle,
  transactionData,
  inputValue,
  setInputValue,
  validity,
}) => {
  const [bottomValue, setBottomValue] = useState('')
  const [currentValueType, setCurrentValueType] = useState(
    transactionData ? transactionData.tokenName : 'Token',
  )

  if (!transactionData) {
    return null
  }

  const { tokenName, fiatName, exchangeRate } = transactionData
  const maxCryptoValue = transactionData.maxValueInToken
  const maxFiatValue = maxCryptoValue * transactionData.exchangeRate
  const buttonExtraClasses = ['create-trasaction-button']
  const inputExtraClasses = ['create-trasaction-input']
  /* istanbul ignore next */
  const finaBottomValue = `≈ ${bottomValue ? bottomValue : 0} ${
    currentValueType === fiatName ? tokenName : fiatName
  }`
  /* istanbul ignore next */
  const calculateFiatValue = (value) => {
    return value * exchangeRate
  }

  /* istanbul ignore next */
  const calculateCryptoValue = (value) => {
    return value / exchangeRate
  }

  /* istanbul ignore next */
  const updateValue = (value) => {
    currentValueType === fiatName
      ? setBottomValue(calculateCryptoValue(value))
      : setBottomValue(calculateFiatValue(value))
  }

  /* istanbul ignore next */
  const switchToFiat = (value) => {
    setCurrentValueType(fiatName)
    setBottomValue(value)
    setInputValue(value > 0 ? calculateFiatValue(value) : '')
  }

  /* istanbul ignore next */
  const switchToCrypto = (value) => {
    setCurrentValueType(tokenName)
    setBottomValue(value)
    setInputValue(value > 0 ? calculateCryptoValue(value) : '')
  }

  /* istanbul ignore next */
  const changeButtonClickHandler = () => {
    currentValueType === fiatName
      ? switchToCrypto(inputValue)
      : switchToFiat(inputValue)
  }

  /* istanbul ignore next */
  const actionButtonClickHandler = () => {
    if (currentValueType === fiatName) {
      setInputValue(maxFiatValue)
      setBottomValue(maxFiatValue / exchangeRate)
    } else {
      setInputValue(maxCryptoValue)
      setBottomValue(maxCryptoValue * exchangeRate)
    }
  }

  /* istanbul ignore next */
  const changeHandler = (e) => {
    setInputValue(e.target.value)
    updateValue(e.target.value)
  }

  return (
    <div
      className="create-tr-field"
      data-testid="create-transaction-field"
    >
      <label
        className="create-tr-filed-label"
        htmlFor="transactionInput"
        data-testid="create-transaction-label"
      >
        {label}
      </label>
      <div className="create-input-wrapper">
        <Input
          id="transactionInput"
          extraStyleClasses={inputExtraClasses}
          placeholder={placeholder}
          value={inputValue}
          onChangeHandle={changeHandler}
          validity={validity}
        />

        <button
          className="create-tr-switch-button"
          data-testid="create-tr-switch-button"
          onClick={changeButtonClickHandler}
        >
          <ArrowIcon
            className="create-tr-icon-arrow-reverse"
            data-testid="arrow-icon"
          />
          <ArrowIcon
            className="create-tr-icon-arrow"
            data-testid="arrow-icon"
          />
          <span className="current-value-type">{currentValueType}</span>
        </button>
      </div>

      <Button
        extraStyleClasses={buttonExtraClasses}
        onClickHandle={actionButtonClickHandler}
      >
        {buttonTitle}
      </Button>

      <p
        className="create-tr-note"
        data-testid="create-tr-bottom-note"
      >
        {finaBottomValue}
      </p>
    </div>
  )
}

export default CreateTransactionField
