import React, { useState, useContext } from 'react'
import { Input } from '@BasicComponents'
import { AccountContext, SettingsContext, TransactionContext } from '@Contexts'

import './CryptoField.css'
import { Format, NumbersHelper } from '@Helpers'
import { AppInfo } from '@Constants'

const CryptoField = ({
  placeholder,
  buttonTitle,
  transactionData,
  inputValue: value,
  validity,
  id,
  changeValueHandle,
  exchangeRate,
  maxValueInToken,
}) => {
  const { walletType } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const { transactionMode } = useContext(TransactionContext)
  const maxValue = NumbersHelper.floatStringToNumber(maxValueInToken)

  // eslint-disable-next-line no-unused-vars
  const [currentValueType, setCurrentValueType] = useState(
    transactionData ? transactionData.tokenName : 'Token',
  )
  const isDelegationMode =
    transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION &&
    walletType.name === 'Mintlayer'

  if (!transactionData) return null

  console.log('inputValue < maxValue', value, maxValue)
  console.log(value < maxValueInToken)

  const { tokenName, fiatName } = transactionData
  const inputExtraClasses = ['crypto-fiat-input']

  const isTypeFiat = () => currentValueType === fiatName


  const calculateFiatValue = (value) => {
    if (!value) {
      return Format.fiatValue(0)
    }
    const parsedValue = NumbersHelper.floatStringToNumber(value)
    return Format.fiatValue(parsedValue * exchangeRate)
  }

  const bottomValue = calculateFiatValue(value)

  const formattedBottomValue = `≈ ${
    bottomValue ? bottomValue : Format.fiatValue(0)
  } ${isTypeFiat() ? tokenName : fiatName}`

  // Consider the correct format for 0,00 that might also be 0.00
  const displayedBottomValue =
    networkType === AppInfo.NETWORK_TYPES.TESTNET
      ? ''
      : formattedBottomValue

  const maxButtonClickHandler = () => {
    console.log('maxValue', maxValue)
    changeValueHandle({
      currency: currentValueType,
      value: maxValue,
    })
  }

  const changeHandler = ({ target: { value } }) => {
    // remove non-numeric characters from the input without 3rd party libraries
    const numericValue = value.replace(/[^0-9.]/g, '')

    if (value !== numericValue) {
      return
    }

    changeValueHandle({
      currency: currentValueType,
      value: numericValue,
    })
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
          placeholder={placeholder || Format.BTCValue(0)}
          value={value}
          onChangeHandle={changeHandler}
          validity={validity}
          justNumbers={true}
        />

        <button
          className="crypto-fiat-switch-button"
          data-testid="crypto-fiat-switch-button"
          onClick={()=>{}}
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

      <button
        className={['btn', 'crypto-fiat-input-button', value < maxValueInToken ? 'outline' : ''].join(' ')}
        onClick={maxButtonClickHandler}
        disabled={isDelegationMode}
      >
        {buttonTitle}
      </button>

      {
        displayedBottomValue && (
          <p
            className="crypto-fiat-bottom-text"
            data-testid="crypto-fiat-bottom-text"
          >
            {displayedBottomValue}
          </p>
        )
      }
    </div>
  )
}

export default CryptoField
