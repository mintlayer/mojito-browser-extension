import React, { useState, useContext } from 'react'

import { Button, Textarea, Error } from '@BasicComponents'
import { VerticalGroup } from '@LayoutComponents'
import { SettingsContext } from '@Contexts'

import { ReactComponent as IconSuccess } from '@Assets/images/icon-checkmark.svg'
import { ReactComponent as IconFailed } from '@Assets/images/icon-cross.svg'

import { ML } from '@Cryptos'
import { ML as MlHelpers } from '@Helpers'
import { ArrayHelper } from '@Helpers'

import './VerifyMessage.css'

const VerifyMessage = () => {
  const { networkType } = useContext(SettingsContext)
  const [step, setStep] = useState(1)
  const [originalMessageValue, setOriginalMessageValue] = useState('')
  const [originalMessageError, setOriginalMessageError] = useState('')
  const [signedMessageValue, setSignedMessageValue] = useState('')
  const [signedMessageError, setSignedMessageError] = useState('')
  const [addressValue, setAddressValue] = useState('')
  const [addressError, setAddressError] = useState('')
  const [isVerified, setIsVerified] = useState(false)

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
    if (step === 1) {
      if (!originalMessageValue) {
        setOriginalMessageError('Please enter the original message.')
        return
      }
      setOriginalMessageError('')
      setStep(2)
    }
    if (step === 2) {
      if (!addressValue) {
        setAddressError('Please enter the address.')
        return
      }
      const isAddressValid = MlHelpers.isMlAddressValid(
        addressValue,
        networkType,
      )
      if (!isAddressValid) {
        setAddressError('Please enter correct address.')
        return
      }
      setAddressError('')
      setStep(3)
    }
    if (step === 3) {
      if (!signedMessageValue) {
        setSignedMessageError('Please enter correct signed message.')
        return
      }
      setSignedMessageError('')
      try {
        const isVerified = verifyMessageHandler(
          addressValue,
          signedMessageValue,
          originalMessageValue,
        )
        setIsVerified(isVerified)
        setStep(4)
      } catch (e) {
        console.error(e)
        setIsVerified(false)
        setStep(4)
        return
      }
    }
    if (step === 4) {
      setOriginalMessageValue('')
      setSignedMessageValue('')
      setAddressValue('')
      setIsVerified(false)
      setStep(1)
    }
  }

  const textariaSize = {
    cols: 74,
    rows: 7,
  }

  const submitButtonTitle =
    step === 1
      ? 'Next'
      : step === 2
        ? 'Next'
        : step === 3
          ? 'Verify'
          : 'Try Again'
  return (
    <form onSubmit={onSubmitClick}>
      <VerticalGroup bigGap={step === 3}>
        {step === 1 && (
          <VerticalGroup>
            <h2 className="message-title">Verify Message</h2>
            <p className="message-description">
              Please enter the original message you want to verify
            </p>
            <div>
              <Textarea
                value={originalMessageValue}
                onChange={originalMessageFieldChangeHandler}
                id="restore-seed-textarea"
                size={textariaSize}
              />
            </div>
            {originalMessageError && <Error error={originalMessageError} />}
          </VerticalGroup>
        )}
        {step === 2 && (
          <VerticalGroup>
            <h2 className="message-title">Verify Message</h2>
            <p className="message-description">
              Please enter address has used to sign the message
            </p>
            <div>
              <Textarea
                value={addressValue}
                onChange={addressFieldChangeHandler}
                id="restore-seed-textarea"
                size={textariaSize}
              />
            </div>
            {addressError && <Error error={addressError} />}
          </VerticalGroup>
        )}
        {step === 3 && (
          <VerticalGroup>
            <h2 className="message-title">Verify Message</h2>
            <p className="message-description">
              Please enter the signed message you want to verify
            </p>
            <div>
              <Textarea
                value={signedMessageValue}
                onChange={signedMessageFieldChangeHandler}
                id="restore-seed-textarea"
                size={textariaSize}
              />
            </div>
            {signedMessageError && <Error error={signedMessageError} />}
          </VerticalGroup>
        )}
        {step === 4 && (
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
        )}
        <div className="message-submit-button-wrapper">
          <Button
            onClickHandle={onSubmitClick}
            extraStyleClasses={['message-submit']}
            // disabled={loading}
          >
            {submitButtonTitle}
          </Button>
        </div>
      </VerticalGroup>
    </form>
  )
}

export default VerifyMessage
