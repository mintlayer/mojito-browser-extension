import { useEffect, useState, useContext } from 'react'
import { validate } from 'wallet-address-validator'

import { Input } from '@BasicComponents'
import TransactionField from './TransactionField'

import './errorMessages.css'

import { EnvVars } from '@Constants'

import { AccountContext } from '@Contexts'

const AddressField = ({ addressChanged, errorMessage, setAddressValidity }) => {
  const { btcAddress, mlAddress, walletType } = useContext(AccountContext)
  const [message, setMessage] = useState(errorMessage)
  const [isValid, setIsValid] = useState(true)
  // TODO add placeholder for ML address
  const placeholder =
    walletType.name === 'Mintlayer'
      ? 'Placeholder for ML'
      : 'bc1.... or 1... or 3...'

  const changeHandle = (ev) => {
    const value = ev.target.value
    // TODO: add validation for ML address
    const validity =
      validate(value, 'btc', EnvVars.BTC_NETWORK) && value !== btcAddress
    setIsValid(validity)
    setAddressValidity(validity)
    if (value === btcAddress || value === mlAddress) {
      setMessage('Cannot send to yourself')
    } else if (!validity) {
      setMessage('This is not a valid BTC address.')
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
