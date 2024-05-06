import { useEffect, useState, useContext } from 'react'
import { validate } from 'wallet-address-validator'

import { Input } from '@BasicComponents'
import TransactionField from './TransactionField'
import { AppInfo } from '@Constants'
import { ML } from '@Helpers'

import './errorMessages.css'

import { SettingsContext } from '@Contexts'

const AddressField = ({
  addressChanged,
  errorMessage,
  setAddressValidity,
  preEnterAddress,
  transactionMode,
  currentDelegationInfo = {},
  walletType,
}) => {
  const { networkType } = useContext(SettingsContext)

  console.log('walletType', walletType)

  let inputValue = ''
  let placeholder = ''
  let addressErrorMessage = ''
  let label = 'Send to:'
  let validity = true

  if (walletType.chain === 'bitcoin') {
    placeholder =
      networkType === AppInfo.NETWORK_TYPES.MAINNET
        ? 'bc1... or 1... or 3...'
        : 'tb1... or 1... or 3...'
    addressErrorMessage = 'This is not a valid BTC address.'
    validity = validate(inputValue, 'btc', networkType)
  }

  if (walletType.chain === 'mintlayer') {
    placeholder =
      networkType === AppInfo.NETWORK_TYPES.MAINNET ? 'mtc1...' : 'tmt1...'
    addressErrorMessage = 'This is not a valid ML address.'
    validity = ML.isMlAddressValid(inputValue, networkType)

    if (transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION) {
      placeholder =
        networkType === AppInfo.NETWORK_TYPES.MAINNET
          ? 'mpool1...'
          : 'tpool1...'
      inputValue = currentDelegationInfo.pool_id
      addressErrorMessage = 'This is not a valid ML pool id.'
      label = 'Pool id:'
      validity = ML.isMlPoolIdValid(inputValue, networkType)
    }

    if (transactionMode === AppInfo.ML_TRANSACTION_MODES.STAKING) {
      placeholder =
        networkType === AppInfo.NETWORK_TYPES.MAINNET
          ? 'mdelg1...'
          : 'tdelg1...'
      inputValue = currentDelegationInfo.delegation_id
      addressErrorMessage = 'This is not a valid ML delegation id.'
      label = 'Deleg id:'
      validity = ML.isMlDelegationIdValid(inputValue, networkType)
    }

    if (transactionMode === AppInfo.ML_TRANSACTION_MODES.WITHDRAW) {
      inputValue = currentDelegationInfo.spend_destination
    }
  }

  if (preEnterAddress) {
    inputValue = preEnterAddress
  }

  const [message, setMessage] = useState(errorMessage)
  const [isValid, setIsValid] = useState(true)

  const changeHandle = (ev) => {
    setIsValid(validity)
    setAddressValidity(validity)
    if (!validity) {
      setMessage(addressErrorMessage)
    } else {
      setMessage(undefined)
    }
    addressChanged && addressChanged(ev)
  }
  useEffect(() => {
    inputValue && changeHandle({ target: { value: inputValue } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputValue])

  useEffect(() => {
    setMessage(errorMessage)
  }, [errorMessage, setMessage])

  return (
    <TransactionField>
      <label htmlFor="address">{label}</label>
      <Input
        id="address"
        placeholder={placeholder}
        extraStyleClasses={['address-field']}
        onChangeHandle={changeHandle}
        setErrorMessage={setMessage}
        validity={isValid}
        value={inputValue}
        disabled={
          walletType.name === 'Mintlayer' &&
          transactionMode === AppInfo.ML_TRANSACTION_MODES.WITHDRAW
        }
      />
      <p className="error-message">{message}</p>
    </TransactionField>
  )
}

export default AddressField
