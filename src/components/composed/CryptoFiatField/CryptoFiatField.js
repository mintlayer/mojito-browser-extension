import React, { useEffect, useState } from 'react'
import { InputBTC } from '@BasicComponents'
import { useParams } from 'react-router'

import './CryptoFiatField.css'
import { BTC, Format, NumbersHelper } from '@Helpers'
import { AppInfo } from '@Constants'

const CryptoFiatField = ({
  placeholder,
  transactionData,
  inputValue,
  validity: parentValidity,
  id,
  changeValueHandle,
  setErrorMessage,
  maxValueInToken,
  setAmountValidity,
  totalFeeInCrypto,
  transactionMode = AppInfo.ML_TRANSACTION_MODES.TRANSACTION,
  validate,
  extraStyleClasses = [],
}) => {
  const isDelegationWithdraw =
    transactionMode === AppInfo.ML_TRANSACTION_MODES.WITHDRAW
  const parsedValueInToken = NumbersHelper.floatStringToNumber(maxValueInToken)
  const finalMaxValue = isDelegationWithdraw
    ? parsedValueInToken
    : parsedValueInToken - totalFeeInCrypto
  const [maxCryptoValue, setMaxCryptoValue] = useState(finalMaxValue)
  const { coinType } = useParams()

  const [value, setValue] = useState(inputValue)
  const [validity, setValidity] = useState(parentValidity)
  const amountErrorMessage = isDelegationWithdraw
    ? 'Amount set is bigger than this delegation balance.'
    : 'Amount set is bigger than this wallet balance.'
  const amountFormatErrorMessage = 'Amount format is invalid. Use 0.00 instead.'
  const zeroErrorMessage = 'Amount must be greater than 0.'

  useEffect(() => {
    const maxValue = finalMaxValue < 0 ? parsedValueInToken : finalMaxValue
    setMaxCryptoValue(maxValue)
  }, [finalMaxValue, parsedValueInToken])

  if (!transactionData) return null

  const { tokenName } = transactionData
  const inputExtraClasses = ['crypto-fiat-input', ...extraStyleClasses]

  const changeHandler = ({ target: { value, parsedValue } }) => {
    changeValueHandle &&
      changeValueHandle({
        currency: tokenName,
        value,
      })

    if (
      transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION &&
      coinType === 'Mintlayer'
    ) {
      setAmountValidity(true)
      setValidity('valid')
    }
    setValue(value || '')

    const validity = AppInfo.amountRegex.test(value)

    if (parsedValue > 0 && !validity) {
      setValidity('invalid')
      setAmountValidity(false)
      setErrorMessage(amountFormatErrorMessage)
      return
    }

    if (parsedValue <= 0 || !parsedValue) {
      setValidity('invalid')
      setAmountValidity(false)
      setErrorMessage(zeroErrorMessage)
      return
    }

    let isValid = parsedValue < BTC.MAX_BTC
    setValidity(isValid ? 'valid' : 'invalid')
    setAmountValidity && setAmountValidity(isValid)
    setErrorMessage && setErrorMessage(isValid ? undefined : amountErrorMessage)
    if (!isValid) return

    if (validate) {
      const error = validate(parsedValue)
      if (error) {
        setValidity('invalid')
        setAmountValidity(false)
        setErrorMessage && setErrorMessage(error)
        return
      }
    } else {
      isValid = parsedValue <= maxCryptoValue
      setValidity(isValid ? 'valid' : 'invalid')
      setAmountValidity(isValid)
      setErrorMessage &&
        setErrorMessage(isValid ? undefined : amountErrorMessage)
      if (!isValid) return
    }
  }

  const safeSpend = (value) => {
    if (!value || value <= 0) return '0.00'
    if (isDelegationWithdraw) {
      return value
    }
    const result = value - totalFeeInCrypto - 0.5 // default fee in mainnet is 0.5 TODO: calculate fee
    if (result < 0) {
      return 0
    }
    return result.toFixed(5)
  }

  return (
    <div
      className={`crypto-fiat-field ${!maxValueInToken ? 'crypto-fiat-field-slim' : ''}`}
      data-testid="crypto-fiat-field"
    >
      <div className="fiat-field-input">
        <InputBTC
          id={id}
          extraStyleClasses={inputExtraClasses}
          placeholder={placeholder || Format.BTCValue(0)}
          value={value}
          onChangeHandle={changeHandler}
          validity={validity}
        />
      </div>
      {maxValueInToken && (
        <div
          className="bottom-note"
          data-testid="crypto-fiat-bottom-text"
        >
          Available to spend ≈ {safeSpend(maxValueInToken)} {tokenName}
        </div>
      )}
    </div>
  )
}

export default CryptoFiatField
