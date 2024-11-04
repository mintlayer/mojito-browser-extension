import React, { useState, useContext, useRef, useEffect } from 'react'

import { Button, Textarea, Error } from '@BasicComponents'
import { TextField, PopUp, Loading } from '@ComposedComponents'
import { AccountContext, SettingsContext } from '@Contexts'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'

import { ML } from '@Cryptos'
import { ML as MlHelpers } from '@Helpers'
import { Account } from '@Entities'
import { AppInfo } from '@Constants'
import { ArrayHelper } from '@Helpers'

import './SignMessage.css'

const SignMessage = () => {
  const submitButtonRef = useRef(null)
  const [messageValue, setMessageValue] = useState('')
  const [addressValue, setAddressValue] = useState('')
  const [signedMessage, setSignedMessage] = useState('')
  const [openConfirmation, setOpenConfiramtion] = useState(false)
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [messageValidity, setMessageValidity] = useState(true)
  const [addressValidity, setAddressValidity] = useState(true)
  const [passValidity, setPassValidity] = useState(true)
  const [passPristinity, setPassPristinity] = useState(true)
  const [passErrorMessage, setPassErrorMessage] = useState('')
  const { accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const loadingExtraClasses = ['loading-big']

  useEffect(() => {
    if (submitButtonRef.current) {
      submitButtonRef.current.scrollIntoView({ behavior: 'smooth' })
      submitButtonRef.current.focus()
    }
  }, [signedMessage])

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

  const onConfirmationOpen = () => {
    if (signedMessage) {
      setSignedMessage('')
      setMessageValue('')
      setAddressValue('')
      return
    }
    setErrorMessage('')
    const messageIsValid = isMessageValid(messageValue)
    const isAddressValid = MlHelpers.isMlAddressValid(addressValue, networkType)

    if (!messageIsValid) {
      setMessageValidity(false)
      setErrorMessage('Message is required')
      return
    }

    if (!addressValue) {
      setAddressValidity(false)
      setErrorMessage('Address is required')
      return
    }

    if (!isAddressValid) {
      setAddressValidity(false)
      setErrorMessage('Invalid address')
      return
    }
    setOpenConfiramtion(true)
  }

  const onSubmitClick = async (event) => {
    event.preventDefault()
    try {
      setPassValidity(true)
      setPassErrorMessage('')
      setLoading(true)
      const response = await signMessageHandler(accountID, pass)
      if (response) {
        setPassValidity(true)
        setPassErrorMessage('')
        setLoading(false)
        setOpenConfiramtion(false)
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

  const messageTextariaSize = {
    cols: 74,
    rows: 2,
  }

  const addressTextariaSize = {
    cols: 74,
    rows: 1,
  }

  const signedTextariaSize = {
    cols: 74,
    rows: 3,
  }

  const submitButtonTitle = signedMessage ? 'Sign again' : 'Sign Message'

  return (
    <form onSubmit={onSubmitClick}>
      <VerticalGroup>
        <VerticalGroup>
          <h2 className="message-title">Sign Message</h2>
          <p className="message-description">
            Enter the message you want to sign.
          </p>
          <div>
            <Textarea
              value={messageValue}
              onChange={onMessageTextfieldChangeHandler}
              validity={messageValidity}
              id="restore-seed-textarea"
              size={messageTextariaSize}
            />
          </div>
        </VerticalGroup>

        <VerticalGroup>
          <p className="message-description">
            Enter your address you want to sign the message with
          </p>
          <div>
            <Textarea
              value={addressValue}
              onChange={onAddressTextfieldChangeHandler}
              validity={addressValidity}
              id="restore-seed-textarea"
              size={addressTextariaSize}
            />
          </div>
        </VerticalGroup>

        {signedMessage && (
          <VerticalGroup>
            <h2 className="message-title">Signed Message</h2>
            <p className="message-description">
              Your message has been signed successfully. Please save the signed
              message along with the original message and address for future
              reference.
            </p>
            <Textarea
              value={signedMessage}
              id="signed-message-textarea"
              size={signedTextariaSize}
              disabled
            />
          </VerticalGroup>
        )}

        {errorMessage && <Error error={errorMessage} />}
        <div
          className="message-submit-button-wrapper"
          ref={submitButtonRef}
        >
          <Button
            onClickHandle={onConfirmationOpen}
            extraStyleClasses={['message-submit']}
            disabled={openConfirmation}
          >
            {submitButtonTitle}
          </Button>
        </div>
      </VerticalGroup>

      {openConfirmation && (
        <PopUp
          setOpen={setOpenConfiramtion}
          allowClosing={!loading}
        >
          {loading ? (
            <VerticalGroup bigGap>
              <h1 className="loadingText">
                {' '}
                Just a sec, we are validating your password...{' '}
              </h1>
              <Loading extraStyleClasses={loadingExtraClasses} />
            </VerticalGroup>
          ) : (
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
              <CenteredLayout>
                <Button
                  onClickHandle={onSubmitClick}
                  extraStyleClasses={['message-submit']}
                >
                  {submitButtonTitle}
                </Button>
              </CenteredLayout>
            </VerticalGroup>
          )}
        </PopUp>
      )}
    </form>
  )
}

export default SignMessage
