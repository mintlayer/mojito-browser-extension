import React, { useState, useContext } from 'react'

import { Button, Textarea, Error } from '@BasicComponents'
import { TextField } from '@ComposedComponents'
import { AccountContext, SettingsContext } from '@Contexts'
import { VerticalGroup } from '@LayoutComponents'
import { useNavigate } from 'react-router-dom'

import { ML } from '@Cryptos'
import { ML as MlHelpers } from '@Helpers'
import { Account } from '@Entities'
import { AppInfo } from '@Constants'
import { ArrayHelper } from '@Helpers'

import './SignMessage.css'

const SignMessage = () => {
  const [messageValue, setMessageValue] = useState('')
  const [addressValue, setAddressValue] = useState('')
  const [signedMessage, setSignedMessage] = useState('')
  const [step, setStep] = useState(1)
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [messageError, setMessageError] = useState('')
  const [addressError, setAddressError] = useState('')
  const [passValidity, setPassValidity] = useState(true)
  const [passPristinity, setPassPristinity] = useState(true)
  const [passErrorMessage, setPassErrorMessage] = useState('')
  const { accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const navigate = useNavigate()

  const findPrivateKeyByAddress = (data, address) => {
    const { mlReceivingPrivKeys, mlChangePrivKeys } = data

    if (mlReceivingPrivKeys[address]) {
      return mlReceivingPrivKeys[address]
    }

    if (mlChangePrivKeys[address]) {
      return mlChangePrivKeys[address]
    }

    return false
  }

  const changePassHandle = (value) => {
    setPass(value)
  }

  const onMessageTextfieldChangeHandler = ({ target }) => {
    setMessageValue(target.value)
  }

  const onAddressTextfieldChangeHandler = ({ target }) => {
    setAddressValue(target.value)
  }

  const isMessageValid = (message) => {
    return message.length > 0
  }

  const signMessageHandler = async (id, password) => {
    const unlockedAccount = await Account.unlockAccount(id, password)
    if (!pass || !unlockedAccount) {
      setPassPristinity(false)
      setPassValidity(false)
      setLoading(false)
      setPassErrorMessage('Password must be set.')
      return
    }

    const mlPrivKeys = unlockedAccount.mlPrivKeys
    const privKey =
      networkType === 'mainnet'
        ? mlPrivKeys.mlMainnetPrivateKey
        : mlPrivKeys.mlTestnetPrivateKey

    const walletPrivKeys = ML.getWalletPrivKeysList(
      privKey,
      networkType,
      AppInfo.DEFAULT_ML_WALLET_OFFSET,
    )

    const addressprivKey = findPrivateKeyByAddress(walletPrivKeys, addressValue)

    if (!addressprivKey) {
      setPassPristinity(false)
      setPassValidity(false)
      setLoading(false)
      setPassErrorMessage('Address not found in the wallet.')
      return
    }

    const messageBytes = ArrayHelper.stringToBytes(messageValue)
    const signedMessage = ML.signChallenge(addressprivKey, messageBytes)
    const signedMessageString = ArrayHelper.uint8ArrayToString(signedMessage)

    setSignedMessage(signedMessageString)

    return signedMessage
  }

  const onSubmitClick = async (event) => {
    event.preventDefault()
    if (step === 1) {
      const messageIsValid = isMessageValid(messageValue)
      messageIsValid ? setStep(2) : setMessageError('Message is required')
    }
    if (step === 2) {
      const isAddressValid = MlHelpers.isMlAddressValid(
        addressValue,
        networkType,
      )
      if (!addressValue) {
        setAddressError('Address is required')
        return
      }
      if (!isAddressValid) {
        setAddressError('Invalid address')
        return
      }
      setStep(3)
    }
    if (step === 3) {
      try {
        setPassValidity(true)
        setPassErrorMessage('')
        setLoading(true)
        const response = await signMessageHandler(accountID, pass)
        if (response) {
          setPassValidity(true)
          setPassErrorMessage('')
          setLoading(false)
          setStep(4)
        }
        return response
      } catch (e) {
        setLoading(false)
        console.error(e)
        setPassPristinity(false)
        setPassValidity(false)
        setPass('')
        setPassErrorMessage('Incorrect password.')
      }
    }

    if (step === 4) {
      navigate('/dashboard')
    }
  }

  const copyToClipboard = (mesasge) => {
    navigator.clipboard
      .writeText(mesasge)
      .then(() => {
        console.log('Message copied to clipboard')
      })
      .catch((err) => {
        console.error('Failed to copy message: ', err)
      })
  }

  const textariaSize = {
    cols: 74,
    rows: 7,
  }

  const submitButtonTitle =
    step === 3
      ? loading
        ? 'Signing...'
        : 'Sign Message'
      : step === 4
        ? 'Go to Dashboard'
        : 'Next'

  return (
    <form onSubmit={onSubmitClick}>
      <VerticalGroup>
        {step === 1 && (
          <VerticalGroup>
            <h2 className="message-title">Sign Message</h2>
            <p className="message-description">
              Enter the message you want to sign. Please save your message and
              signature for future reference. It is important to verify the
              signature.
            </p>
            <div>
              <Textarea
                value={messageValue}
                onChange={onMessageTextfieldChangeHandler}
                id="restore-seed-textarea"
                size={textariaSize}
              />
            </div>
            {messageError && <Error error={messageError} />}
          </VerticalGroup>
        )}
        {step === 2 && (
          <VerticalGroup>
            <h2 className="message-title">Enter Yout address</h2>
            <p className="message-description">
              Enter your address you want to sign the message with
            </p>
            <div>
              <Textarea
                value={addressValue}
                onChange={onAddressTextfieldChangeHandler}
                validity={!addressError}
                id="restore-seed-textarea"
                size={textariaSize}
              />
            </div>
            {addressError && <Error error={addressError} />}
          </VerticalGroup>
        )}
        {step === 3 && (
          <VerticalGroup bigGap>
            <h2 className="message-title">Enter your Password</h2>
            <p className="message-description">
              Please enter your password to sign the message
            </p>
            <div className="message-password">
              <TextField
                placeHolder="Password"
                password
                validity={passValidity}
                pristinity={passPristinity}
                errorMessages={passErrorMessage}
                onChangeHandle={changePassHandle}
                bigGap={false}
              />
            </div>
          </VerticalGroup>
        )}
        {step === 4 && (
          <VerticalGroup>
            <h2 className="message-title">Signed Message</h2>
            <p className="message-description">
              Your message has been signed successfully. Please save the signed
              message along with the original message for future reference.
            </p>
            <Textarea
              value={signedMessage}
              id="signed-message-textarea"
              size={textariaSize}
              disabled
            />
            <div className="message-button-final">
              <Button
                onClickHandle={() => copyToClipboard(signedMessage)}
                extraStyleClasses={['message-submit']}
                disabled={loading}
              >
                Copy to clipboard
              </Button>
              <Button
                onClickHandle={onSubmitClick}
                extraStyleClasses={['message-submit']}
                disabled={loading}
              >
                {submitButtonTitle}
              </Button>
            </div>
          </VerticalGroup>
        )}
        {step !== 4 && (
          <div className="message-submit-button-wrapper">
            <Button
              onClickHandle={onSubmitClick}
              extraStyleClasses={['message-submit']}
              disabled={loading}
            >
              {submitButtonTitle}
            </Button>
          </div>
        )}
      </VerticalGroup>
    </form>
  )
}

export default SignMessage
