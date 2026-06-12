import { useEffect, useState, useContext } from 'react'
import { validate } from 'wallet-address-validator'

import { Input } from '@BasicComponents'
import { AppInfo } from '@Constants'
import { ML } from '@Helpers'

import styles from './AddressField.module.css'

import { SettingsContext } from '@Contexts'

const AddressField = ({
  addressChanged,
  errorMessage,
  setAddressValidity,
  preEnterAddress,
  transactionMode,
  walletType,
}) => {
  const { networkType } = useContext(SettingsContext)
  const [value, setValue] = useState(preEnterAddress)

  let placeholder = ''
  let addressErrorMessage = ''
  let label = 'Recipient address'
  let networkLabel = ''
  let validity = true

  if (walletType.chain === 'bitcoin') {
    networkLabel = 'Bitcoin network'
    placeholder =
      networkType === AppInfo.NETWORK_TYPES.MAINNET
        ? 'bc1q...  or  tb1q...'
        : 'bc1q...  or  tb1q...'
    addressErrorMessage = 'This is not a valid BTC address.'
    validity = (val) => validate(val, 'btc', networkType)
  }

  if (walletType.chain === 'mintlayer') {
    networkLabel = 'Mintlayer network'
    placeholder =
      networkType === AppInfo.NETWORK_TYPES.MAINNET ? 'mtc1...' : 'tmt1...'
    addressErrorMessage = 'This is not a valid ML address.'
    validity = (val) => ML.isMlAddressValid(val, networkType)

    if (transactionMode === AppInfo.ML_TRANSACTION_MODES.DELEGATION) {
      placeholder =
        networkType === AppInfo.NETWORK_TYPES.MAINNET
          ? 'mpool1...'
          : 'tpool1...'
      addressErrorMessage = 'This is not a valid ML pool id.'
      label = 'Pool id'
      validity = (val) => ML.isMlPoolIdValid(val, networkType)
    }

    if (
      transactionMode === AppInfo.ML_TRANSACTION_MODES.STAKING ||
      transactionMode === AppInfo.ML_TRANSACTION_MODES.WITHDRAW
    ) {
      placeholder =
        networkType === AppInfo.NETWORK_TYPES.MAINNET
          ? 'mdelg1...'
          : 'tdelg1...'
      addressErrorMessage = 'This is not a valid ML delegation id.'
      label = 'Deleg id'
      validity = (val) => ML.isMlDelegationIdValid(val, networkType)
    }
  }

  const [message, setMessage] = useState(errorMessage)
  const [isValid, setIsValid] = useState(true)

  const changeHandle = (ev) => {
    setValue(ev.target.value)
    setIsValid(validity(ev.target.value))
    setAddressValidity(validity(ev.target.value))
    if (!validity(ev.target.value)) {
      setMessage(addressErrorMessage)
    } else {
      setMessage(undefined)
    }
    addressChanged && addressChanged(ev)
  }
  useEffect(() => {
    preEnterAddress && changeHandle({ target: { value: preEnterAddress } })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setMessage(errorMessage)
  }, [errorMessage, setMessage])

  return (
    <div className={styles.field}>
      <label
        className={styles.label}
        htmlFor="address"
      >
        {label}
        {networkLabel && (
          <>
            {' '}
            <span className={styles.separator}>&middot;</span>{' '}
            <span className={styles.networkLabel}>{networkLabel}</span>
          </>
        )}
      </label>
      <Input
        id="address"
        placeholder={placeholder}
        onChangeHandle={changeHandle}
        validity={isValid}
        value={value}
        disabled={
          walletType.name === 'Mintlayer' &&
          transactionMode === AppInfo.ML_TRANSACTION_MODES.WITHDRAW
        }
      />
      {message && <p className={styles.errorMessage}>{message}</p>}
    </div>
  )
}

export default AddressField
