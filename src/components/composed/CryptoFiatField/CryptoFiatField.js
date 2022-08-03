import React, { useEffect, useState } from 'react'
import { Button, InputBTC, InputFloat } from '@BasicComponents'
import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow.svg'

import './CryptoFiatField.css'
import { BTC, Format, NumbersHelper } from '@Helpers'

const CryptoFiatField = ({
  placeholder,
  buttonTitle,
  transactionData,
  inputValue,
  validity: parentValidity,
  id,
  changeValueHandle,
  setErrorMessage
}) => {
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

  const formattedBottomValue = `≈ ${
    bottomValue ? bottomValue : Format.fiatValue(0)
  } ${isTypeFiat() ? tokenName : fiatName}`

  const calculateFiatValue = (value) => {
    const parsedValue = NumbersHelper.floatStringToNumber(value)
    return Format.fiatValue(parsedValue * exchangeRate)
  }

  const calculateCryptoValue = (value) => {
    const parsedValue = NumbersHelper.floatStringToNumber(value)
    return Format.BTCValue(parsedValue / exchangeRate)
  }

  const updateValue = (value) => {
    isTypeFiat()
      ? setBottomValue(calculateCryptoValue(value))
      : setBottomValue(calculateFiatValue(value))
  }

  const switchCurrency = (
    currencyName,
    recalculateValueFn,
    calculateBottomFn,
  ) => {
    setCurrentValueType(currencyName)
    setBottomValue(calculateBottomFn(value))
    setValue(recalculateValueFn(value))
  }

  const changeButtonClickHandler = () => {
    isTypeFiat()
      ? switchCurrency(tokenName, calculateCryptoValue, Format.fiatValue)
      : switchCurrency(fiatName, calculateFiatValue, Format.BTCValue)
  }

  const maxButtonClickHandler = () => {
    if (isTypeFiat()) {
      setValue(Format.fiatValue(maxFiatValue))
      setBottomValue(Format.BTCValue(maxFiatValue / exchangeRate))
    } else {
      setValue(Format.BTCValue(maxCryptoValue))
      setBottomValue(Format.fiatValue(maxCryptoValue * exchangeRate))
    }
  }

  const changeHandler = ({ target: { value, parsedValue } }) => {
    setValue(value)
    updateValue(parsedValue)

    let isValid = isTypeFiat()
      ? NumbersHelper.floatStringToNumber(calculateCryptoValue(parsedValue)) < BTC.MAX_BTC
      : parsedValue < BTC.MAX_BTC
    setValidity(isValid ? 'valid' : 'invalid')
    setErrorMessage(isValid ? undefined : 'Amount set is bigger than max available BTC on the blockchain.')
    if (!isValid) return


    isValid = isTypeFiat()
      ? parsedValue <= maxFiatValue
      : parsedValue <= maxCryptoValue

    setValidity(isValid ? 'valid' : 'invalid')
    setErrorMessage(isValid ? undefined : 'Amount set is bigger than this wallet balance.')
    if (!isValid) return
  }

  return (
    <div
      className="crypto-fiat-field"
      data-testid="crypto-fiat-field"
    >
      <div className="fiat-field-input">
        {isTypeFiat() ? (
          <InputFloat
            id={id}
            extraStyleClasses={inputExtraClasses}
            placeholder={placeholder || Format.fiatValue(0)}
            value={value}
            onChangeHandle={changeHandler}
            validity={validity}
          />
        ) : (
          <InputBTC
            id={id}
            extraStyleClasses={inputExtraClasses}
            placeholder={placeholder || Format.BTCValue(0)}
            value={value}
            onChangeHandle={changeHandler}
            validity={validity}
          />
        )}

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
        onClickHandle={maxButtonClickHandler}
      >
        {buttonTitle}
      </Button>

      <p
        className="crypto-fiat-bottom-text"
        data-testid="crypto-fiat-bottom-text"
      >
        {formattedBottomValue}
      </p>
    </div>
  )
}

export default CryptoFiatField
