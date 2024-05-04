import { useEffect, useState, useContext } from 'react'
import { validate } from 'wallet-address-validator'

import { Input } from '@BasicComponents'
import TransactionField from './TransactionField'
import { AppInfo } from '@Constants'
import { ML } from '@Helpers'

import './errorMessages.css'

import { AccountContext, SettingsContext } from '@Contexts'

const AddressField = ({
  addressChanged,
  errorMessage,
  setAddressValidity,
  preEnterAddress,
  transactionMode,
  currentDelegationInfo = {},
  walletType,
}) => {
  const { addresses } = useContext(AccountContext)
  const inputValue =
    walletType.name === 'Mintlayer' &&
    transactionMode === AppInfo.ML_TRANSACTION_MODES.STAKING
      ? currentDelegationInfo.delegation_id
      : transactionMode === AppInfo.ML_TRANSACTION_MODES.WITHDRAW
      ? currentDelegationInfo.spend_destination
      : preEnterAddress
      ? preEnterAddress
      : ''
  const { networkType } = useContext(SettingsContext)
  const currentBtcAddress =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.btcMainnetAddress
      : addresses.btcTestnetAddress
  const currentMlAddress =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddress
      : addresses.mlTestnetAddress
  const [message, setMessage] = useState(errorMessage)
  const [isValid, setIsValid] = useState(true)
  const mintlayerAddressPlaceholder =
    networkType === AppInfo.NETWORK_TYPES.MAINNET ? 'mtc1...' : 'tmt1...'
  const bitcoinAddressPlaceholder =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? 'bc1... or 1... or 3...'
      : 'tb1... or 1... or 3...'
  const mintlayerPoolIdPlaceholder =
    networkType === AppInfo.NETWORK_TYPES.MAINNET ? 'mpool...' : 'tpool...'

  const mintlayerDelegIdPlaceholder =
    networkType === AppInfo.NETWORK_TYPES.MAINNET ? 'mdelg...' : 'tdelg...'

  const placeholder =
    walletType.name === 'Mintlayer' &&
    transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION
      ? mintlayerPoolIdPlaceholder
      : walletType.name === 'Mintlayer' &&
        transactionMode === AppInfo.ML_TRANSACTION_MODES.STAKING
      ? mintlayerDelegIdPlaceholder
      : walletType.name === 'Mintlayer'
      ? mintlayerAddressPlaceholder
      : bitcoinAddressPlaceholder

  const addressErrorMessage =
    walletType.name === 'Mintlayer' &&
    transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION
      ? 'This is not a valid ML pool id.'
      : walletType.name === 'Mintlayer' &&
        transactionMode === AppInfo.ML_TRANSACTION_MODES.STAKING
      ? 'This is not a valid ML delegation id.'
      : walletType.name === 'Mintlayer'
      ? 'This is not a valid ML address.'
      : 'This is not a valid BTC address.'

  const label =
    walletType.name === 'Mintlayer' &&
    transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION
      ? 'Pool id:'
      : walletType.name === 'Mintlayer' &&
        transactionMode === AppInfo.ML_TRANSACTION_MODES.STAKING
      ? 'Deleg id:'
      : 'Send to:'

  const changeHandle = (ev) => {
    const value = ev.target.value || inputValue
    const validity =
      walletType.name === 'Mintlayer' &&
      transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION
        ? ML.isMlPoolIdValid(value, networkType)
        : walletType.name === 'Mintlayer' &&
          transactionMode === AppInfo.ML_TRANSACTION_MODES.STAKING
        ? ML.isMlDelegationIdValid(value, networkType)
        : walletType.name === 'Mintlayer'
        ? ML.isMlAddressValid(value, networkType)
        : validate(value, 'btc', networkType) && value !== currentBtcAddress
    setIsValid(validity)
    setAddressValidity(validity)
    if (value === currentBtcAddress || value === currentMlAddress) {
      setMessage('Cannot send to yourself')
    } else if (!validity) {
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
