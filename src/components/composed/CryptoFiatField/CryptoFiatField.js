import React, { useEffect, useState } from 'react'
import { Button, Input } from '@BasicComponents'
import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow.svg'

import './CryptoFiatField.css'

const CryptoFiatField = ({
  placeholder,
  buttonTitle,
  transactionData,
  inputValue,
  validity: parentValidity,
  id,
  changeValueHandle,
}) => {
  const formatCryptoValue = (value) =>
    value
      .toFixed(8)
      .replace(/\.0+$/, '')
      .replace(/(\.[1-9]+)(0+)$/, '$1')

  const formatFiatValue = (value) => value.toFixed(2)

  const [bottomValue, setBottomValue] = useState('')
  const [currentValueType, setCurrentValueType] = useState(
    transactionData ? transactionData.tokenName : 'Token',
  )
  const [value, setValue] = useState(inputValue)
  const [validity, setValidity] = useState(parentValidity)

  useEffect(() => {
    changeValueHandle &&
      changeValueHandle({
        currency: currentValueType,
        value,
      })
  }, [changeValueHandle, currentValueType, value])

  if (!transactionData) return null

  const { tokenName, fiatName, exchangeRate } = transactionData
  const maxCryptoValue = transactionData.maxValueInToken
  const maxFiatValue = maxCryptoValue * transactionData.exchangeRate
  const buttonExtraClasses = ['crypto-fiat-input-button']
  const inputExtraClasses = ['crypto-fiat-input']

  const isTypeFiat = () => currentValueType === fiatName

  const finaBottomValue = `≈ ${bottomValue ? bottomValue : 0} ${
    isTypeFiat() ? tokenName : fiatName
  }`

  const sendValueToParent = (value) => {
    if (!changeValueHandle) return

    const cryptoValue = isTypeFiat()
      ? setBottomValue(calculateCryptoValue(value))
      : value
    changeValueHandle(cryptoValue)
  }

  const calculateFiatValue = (value) => formatFiatValue(value * exchangeRate)

  const calculateCryptoValue = (value) =>
    formatCryptoValue(value / exchangeRate)

  const updateValue = (value) => {
    sendValueToParent(value)
    isTypeFiat()
      ? setBottomValue(calculateCryptoValue(value))
      : setBottomValue(calculateFiatValue(value))
  }

  const switchCurrency = (currencyName, recalculateFn) => {
    setCurrentValueType(currencyName)
    setBottomValue(value)
    setValue(recalculateFn(value))
  }

  const changeButtonClickHandler = () => {
    isTypeFiat()
      ? switchCurrency(tokenName, calculateCryptoValue)
      : switchCurrency(fiatName, calculateFiatValue)
  }

  const actionButtonClickHandler = () => {
    if (isTypeFiat()) {
      setValue(formatFiatValue(maxFiatValue))
      setBottomValue(formatCryptoValue(maxFiatValue / exchangeRate))
    } else {
      setValue(formatCryptoValue(maxCryptoValue))
      setBottomValue(formatFiatValue(maxCryptoValue * exchangeRate))
    }
  }

  const changeHandler = ({ target: { value } }) => {
    setValue(value)
    updateValue(value)

    const isValid = isTypeFiat()
      ? value <= maxFiatValue
      : value <= maxCryptoValue

    setValidity(isValid ? 'valid' : 'invalid')
  }

  return (
    <div
      className="crypto-fiat-field"
      data-testid="crypto-fiat-field"
    >
      <div className="fiat-field-input">
        <Input
          id={id}
          extraStyleClasses={inputExtraClasses}
          placeholder={placeholder}
          value={value}
          onChangeHandle={changeHandler}
          validity={validity}
        />

        <button
          className="crypto-fiat-switch-button"
          data-testid="crypto-fiat-switch-button"
          onClick={changeButtonClickHandler}
        >
          <ArrowIcon
            className="crypto-fiat-icon-reverse"
            data-testid="arrow-icon"
          />
          <ArrowIcon
            className="crypto-fiat-icon"
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
        className="crypto-fiat-bottom-text"
        data-testid="crypto-fiat-bottom-text"
      >
        {finaBottomValue}
      </p>
    </div>
  )
}

export default CryptoFiatField
