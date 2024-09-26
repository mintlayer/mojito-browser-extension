import React, { useState, useContext } from 'react'

import { Button, Textarea, Error } from '@BasicComponents'
import { VerticalGroup } from '@LayoutComponents'
import { SettingsContext } from '@Contexts'

import { ML } from '@Cryptos'
import { ML as MlHelpers } from '@Helpers'
import { ArrayHelper } from '@Helpers'

import './VerifyMessage.css'

const VerifyMessage = () => {
  const { networkType } = useContext(SettingsContext)
  const [errorMessage, setErrorMessage] = useState('')
  const [originalMessageValue, setOriginalMessageValue] = useState('')
  const [signedMessageValue, setSignedMessageValue] = useState('')
  const [addressValue, setAddressValue] = useState('')
  const [isVerified, setIsVerified] = useState(undefined)

  const originalMessageFieldChangeHandler = ({ target }) => {
    setOriginalMessageValue(target.value)
  }
  const signedMessageFieldChangeHandler = ({ target }) => {
    setSignedMessageValue(target.value)
  }

  const addressFieldChangeHandler = ({ target }) => {
    setAddressValue(target.value)
  }

  const verifyMessageHandler = (address, signedMessage, originalMessage) => {
    const signedMessageUint8Array =
      ArrayHelper.stringToUint8Array(signedMessage)
    const messageBytes = ArrayHelper.stringToBytes(originalMessage)

    const verifyMessage = ML.verifyChallenge(
      address,
      networkType,
      signedMessageUint8Array,
      messageBytes,
    )

    return verifyMessage
  }

  const onSubmitClick = (e) => {
    e.preventDefault()
    if (isVerified !== undefined) {
      setIsVerified(undefined)
      setErrorMessage('')
      setOriginalMessageValue('')
      setAddressValue('')
      setSignedMessageValue('')
      return
    }
    setErrorMessage('')
    const isAddressValid = MlHelpers.isMlAddressValid(addressValue, networkType)

    if (!originalMessageValue) {
      setErrorMessage('Please enter the original message.')
      return
    }

    if (!addressValue) {
      setErrorMessage('Please enter the address.')
      return
    }

    if (!isAddressValid) {
      setErrorMessage('Please enter correct address.')
      return
    }

    if (!signedMessageValue) {
      setErrorMessage('Please enter correct signed message.')
      return
    }

    try {
      const isVerified = verifyMessageHandler(
        addressValue,
        signedMessageValue,
        originalMessageValue,
      )
      setIsVerified(isVerified)
    } catch (e) {
      console.error(e)
      setIsVerified(false)
      return
    }
  }

  const textariaSize = {
    cols: 74,
    rows: 2,
  }

  const textariaAddressSize = {
    cols: 74,
    rows: 1,
  }

  const submitButtonTitle = isVerified !== undefined ? 'Try Again' : 'Verify'
  return (
    <form onSubmit={onSubmitClick}>
      <VerticalGroup>
        <VerticalGroup>
          <h2 className="message-title">Verify Message</h2>
          <p className="message-description">
            Enter the original message you want to verify
          </p>
          <div>
            <Textarea
              value={originalMessageValue}
              onChange={originalMessageFieldChangeHandler}
              id="restore-seed-textarea"
              size={textariaSize}
            />
          </div>
        </VerticalGroup>

        <VerticalGroup>
          <p className="message-description">
            Enter address has used to sign the message
          </p>
          <div>
            <Textarea
              value={addressValue}
              onChange={addressFieldChangeHandler}
              id="restore-seed-textarea"
              size={textariaAddressSize}
            />
          </div>
        </VerticalGroup>

        <VerticalGroup>
          <p className="message-description">
            Enter the signed message you want to verify
          </p>
          <div>
            <Textarea
              value={signedMessageValue}
              onChange={signedMessageFieldChangeHandler}
              id="restore-seed-textarea"
              size={textariaSize}
            />
          </div>
        </VerticalGroup>

        {/* {step === 2 && (
          <VerticalGroup>
            {isVerified && (
              <div className="verify-result">
                <IconSuccess className="icon-verify-success" />
                <p className="message-description">
                  The message has been verified successfully.
                </p>
              </div>
            )}
            {!isVerified && (
              <div className="verify-result">
                <IconFailed className="icon-verify-failed" />
                <p className="message-description">
                  The message has not been verified.
                </p>
              </div>
            )}
          </VerticalGroup>
        )} */}
        {isVerified !== undefined && isVerified && (
          <p className="message-success">
            The message has been verified successfully.
          </p>
        )}

        {isVerified !== undefined && !isVerified && (
          <p className="message-failed">The message verification failed.</p>
        )}

        {errorMessage && <Error error={errorMessage} />}
        <div className="message-submit-button-wrapper">
          <Button
            onClickHandle={onSubmitClick}
            extraStyleClasses={['message-submit']}
          >
            {submitButtonTitle}
          </Button>
        </div>
      </VerticalGroup>
    </form>
  )
}

export default VerifyMessage
