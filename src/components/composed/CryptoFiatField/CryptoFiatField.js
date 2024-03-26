import React, { useEffect, useState, useContext } from 'react'
import { Button, InputBTC, InputFloat } from '@BasicComponents'
// import { ReactComponent as ArrowIcon } from '@Assets/images/icon-arrow.svg'
import { AccountContext, SettingsContext, TransactionContext } from '@Contexts'

import './CryptoFiatField.css'
import { BTC, Format, NumbersHelper } from '@Helpers'
import { AppInfo } from '@Constants'

const CryptoFiatField = ({
  placeholder,
  buttonTitle,
  transactionData,
  inputValue,
  validity: parentValidity,
  id,
  changeValueHandle,
  setErrorMessage,
  exchangeRate,
  maxValueInToken,
  setAmountValidity,
  totalFeeInCrypto,
}) => {
  const { walletType } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const { transactionMode } = useContext(TransactionContext)
  const parsedValueInToken = NumbersHelper.floatStringToNumber(maxValueInToken)
  const finalMaxValue = parsedValueInToken - totalFeeInCrypto
  const [maxCryptoValue, setMaxCryptoValue] = useState(finalMaxValue)
  const [maxFiatValue, setMaxFiatValue] = useState(
    maxCryptoValue * exchangeRate,
  )

  const [bottomValue, setBottomValue] = useState('')
  // eslint-disable-next-line no-unused-vars
  const [currentValueType, setCurrentValueType] = useState(
    transactionData ? transactionData.tokenName : 'Token',
  )
  const [value, setValue] = useState(inputValue)
  const [validity, setValidity] = useState(parentValidity)
  const amountErrorMessage = 'Amount set is bigger than this wallet balance.'
  const amountFormatErrorMessage = 'Amount format is invalid. Use 0,00 instead.'
  const zeroErrorMessage = 'Amount must be greater than 0.'
  const isDelegationMode =
    transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION &&
    walletType.name === 'Mintlayer'

  useEffect(() => {
    changeValueHandle &&
      changeValueHandle({
        currency: currentValueType,
        value,
      })
  }, [changeValueHandle, currentValueType, value])

  useEffect(() => {
    setMaxFiatValue(maxCryptoValue * exchangeRate)
  }, [exchangeRate, setMaxFiatValue, maxCryptoValue])

  useEffect(() => {
    const maxValue = finalMaxValue < 0 ? parsedValueInToken : finalMaxValue
    setMaxCryptoValue(maxValue)
  }, [finalMaxValue, parsedValueInToken])

  if (!transactionData) return null

  const { tokenName, fiatName } = transactionData
  const buttonExtraClasses = ['crypto-fiat-input-button']
  const inputExtraClasses = ['crypto-fiat-input']

  const isTypeFiat = () => currentValueType === fiatName

  const formattedBottomValue = `≈ ${
    bottomValue ? bottomValue : Format.fiatValue(0)
  } ${isTypeFiat() ? tokenName : fiatName}`

  // Consider the correct format for 0,00 that might also be 0.00
  const displayedBottomValue =
    networkType === AppInfo.NETWORK_TYPES.TESTNET
      ? `≈ 0,00 ${fiatName}`
      : formattedBottomValue

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

  // TODO: Discuss the feasibility of this feature after release
  // const switchCurrency = (
  //   currencyName,
  //   recalculateValueFn,
  //   calculateBottomFn,
  // ) => {
  //   setCurrentValueType(currencyName)
  //   setBottomValue(calculateBottomFn(value || 0))
  //   setValue(recalculateValueFn(value || 0))
  // }

  const changeButtonClickHandler = () => {
    return
    // if (networkType === AppInfo.NETWORK_TYPES.TESTNET) return
    // isTypeFiat()
    //   ? switchCurrency(tokenName, calculateCryptoValue, Format.fiatValue)
    //   : switchCurrency(fiatName, calculateFiatValue, Format.BTCValue)
  }

  const maxButtonClickHandler = () => {
    if (
      transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION &&
      walletType.name === 'Mintlayer'
    ) {
      return
    }
    if (isTypeFiat()) {
      setValue(Format.fiatValue(maxFiatValue))
      setBottomValue(Format.BTCValue(maxFiatValue / exchangeRate))
      finalMaxValue > 0 && setAmountValidity(true)
    } else {
      setValue(Format.BTCValue(maxCryptoValue))
      setBottomValue(Format.fiatValue(maxCryptoValue * exchangeRate))
      finalMaxValue > 0 && setAmountValidity(true)
    }
  }

  const changeHandler = ({ target: { value, parsedValue } }) => {
    if (
      transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION &&
      walletType.name === 'Mintlayer'
    ) {
      setAmountValidity(true)
      setValidity('valid')
    }
    setValue(value || 0)
    updateValue(value || 0)

    const validity = AppInfo.amountRegex.test(value)

    if (!validity) {
      setValidity('invalid')
      setAmountValidity(false)
      setErrorMessage(amountFormatErrorMessage)
      return
    }

    if (parsedValue <= 0) {
      setValidity('invalid')
      setAmountValidity(false)
      setErrorMessage(zeroErrorMessage)
      return
    }

    let isValid = isTypeFiat()
      ? NumbersHelper.floatStringToNumber(calculateCryptoValue(parsedValue)) <
        BTC.MAX_BTC
      : parsedValue < BTC.MAX_BTC
    setValidity(isValid ? 'valid' : 'invalid')
    setAmountValidity && setAmountValidity(isValid)
    setErrorMessage && setErrorMessage(isValid ? undefined : amountErrorMessage)
    if (!isValid) return

    isValid = isTypeFiat()
      ? parsedValue <= maxFiatValue
      : parsedValue <= maxCryptoValue

    setValidity(isValid ? 'valid' : 'invalid')
    setAmountValidity(isValid)
    setErrorMessage && setErrorMessage(isValid ? undefined : amountErrorMessage)
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
          {/* {networkType !== AppInfo.NETWORK_TYPES.TESTNET && (
            <>
              <ArrowIcon
                className="crypto-fiat-icon-reverse"
                data-testid="arrow-icon"
              />
              <ArrowIcon
                className="crypto-fiat-icon"
                data-testid="arrow-icon"
              />
            </>
          )} */}

          <span className="current-value-type">{currentValueType}</span>
        </button>
      </div>

      <Button
        extraStyleClasses={buttonExtraClasses}
        onClickHandle={maxButtonClickHandler}
        disabled={isDelegationMode}
      >
        {buttonTitle}
      </Button>

      <p
        className="crypto-fiat-bottom-text"
        data-testid="crypto-fiat-bottom-text"
      >
        {displayedBottomValue}
      </p>
    </div>
  )
}

export default CryptoFiatField
