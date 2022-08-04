import { useEffect, useState } from 'react'
import { validate } from 'wallet-address-validator'

import { Input } from '@BasicComponents'
import TransactionField from './TransactionField'

import './errorMessages.css'

import { EnvVars } from '@Constants'

const AddressField = ({ addressChanged, errorMessage, setAddressValidity }) => {
  const [message, setMessage] = useState(errorMessage)
  const [isValid, setIsValid] = useState(true)

  const changeHandle = (ev) => {
    const validity = validate(ev.target.value, 'btc', EnvVars.BTC_NETWORK)
    setIsValid(validity)
    setAddressValidity(validity)
    setMessage(validity ? undefined : 'This is not a valid BTC address.')
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
