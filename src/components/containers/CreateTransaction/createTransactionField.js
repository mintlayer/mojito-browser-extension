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
  validity,
}) => {
  const [bottomValue, setBottomValue] = useState('')
  const [currentValueType, setCurrentValueType] = useState(
    transactionData ? transactionData.tokenName : 'Token',
  )
  const [value, setValue] = useState(inputValue)

  if (!transactionData) return null

  const { tokenName, fiatName, exchangeRate } = transactionData
  const maxCryptoValue = transactionData.maxValueInToken
  const maxFiatValue = maxCryptoValue * transactionData.exchangeRate
  const buttonExtraClasses = ['create-trasaction-button']
  const inputExtraClasses = ['create-trasaction-input']

  const isTypeFiat = () => currentValueType === fiatName

  const finaBottomValue = `≈ ${bottomValue ? bottomValue : 0} ${
    isTypeFiat() ? tokenName : fiatName
  }`

  const calculateFiatValue = (value) => value * exchangeRate

  const calculateCryptoValue = (value) => value / exchangeRate

  const updateValue = (value) => {
    isTypeFiat()
      ? setBottomValue(calculateCryptoValue(value))
      : setBottomValue(calculateFiatValue(value))
  }

  const switchCurrency = (currencyName, recalculateFn) => {
    setCurrentValueType(currencyName)
    setBottomValue(value)
    setValue(value > 0 ? recalculateFn(value) : '0')
  }

  const changeButtonClickHandler = () => {
    isTypeFiat()
      ? switchCurrency(tokenName, calculateCryptoValue)
      : switchCurrency(fiatName, calculateFiatValue)
  }

  const actionButtonClickHandler = () => {
    if (isTypeFiat()) {
      setValue(maxFiatValue)
      setBottomValue(maxFiatValue / exchangeRate)
    } else {
      setValue(maxCryptoValue)
      setBottomValue(maxCryptoValue * exchangeRate)
    }
  }

  const changeHandler = (e) => {
    setValue(e.target.value)
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
          value={value}
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
