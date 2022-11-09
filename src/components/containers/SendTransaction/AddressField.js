import { useEffect, useState, useContext } from 'react'
import { validate } from 'wallet-address-validator'

import { Input } from '@BasicComponents'
import TransactionField from './TransactionField'

import './errorMessages.css'

import { EnvVars } from '@Constants'

import { AccountContext } from '@Contexts'

const AddressField = ({ addressChanged, errorMessage, setAddressValidity }) => {
  const { btcAddress } = useContext(AccountContext)
  const [message, setMessage] = useState(errorMessage)
  const [isValid, setIsValid] = useState(true)

  const changeHandle = (ev) => {
    const value = ev.target.value
    const validity =
      validate(value, 'btc', EnvVars.BTC_NETWORK) && value !== btcAddress
    setIsValid(validity)
    setAddressValidity(validity)
    if (value === btcAddress) {
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
        placeholder="bc1.... or 1... or 3..."
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
