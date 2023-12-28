import { useEffect, useState, useContext } from 'react'
import { validate } from 'wallet-address-validator'

import { Input } from '@BasicComponents'
import TransactionField from './TransactionField'
import { AppInfo } from '@Constants'

import './errorMessages.css'

import { AccountContext, SettingsContext } from '@Contexts'

const AddressField = ({ addressChanged, errorMessage, setAddressValidity }) => {
  const { addresses, walletType } = useContext(AccountContext)
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
  const placeholder =
    walletType.name === 'Mintlayer'
      ? 'tmc... or tmt...'
      : 'bc1.... or 1... or 3...'

  const isMlAddressValid = (address, network) => {
    const mainnetRegex = /^tmc1[a-z0-9]{30,}$/
    const testnetRegex = /^tmt1[a-z0-9]{30,}$/
    return network === AppInfo.NETWORK_TYPES.MAINNET
      ? mainnetRegex.test(address)
      : testnetRegex.test(address)
  }

  const addressErrorMessage =
    walletType.name === 'Mintlayer'
      ? 'This is not a valid ML address.'
      : 'This is not a valid BTC address.'

  const changeHandle = (ev) => {
    const value = ev.target.value
    const validity =
      walletType.name === 'Mintlayer'
        ? isMlAddressValid(value, networkType)
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
    setMessage(errorMessage)
  }, [errorMessage, setMessage])

  return (
    <TransactionField>
      <label htmlFor="address">Send to:</label>
      <Input
        id="address"
        placeholder={placeholder}
        extraStyleClasses={['address-field']}
        onChangeHandle={changeHandle}
        setErrorMessage={setMessage}
        validity={isValid}
      />
      <p className="error-message">{message}</p>
    </TransactionField>
  )
}

export default AddressField
