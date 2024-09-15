import React, { useState } from 'react'

import { Button, Textarea, Error } from '@BasicComponents'
import { VerticalGroup } from '@LayoutComponents'

import { ReactComponent as IconSuccess } from '@Assets/images/icon-checkmark.svg'
import { ReactComponent as IconFailed } from '@Assets/images/icon-cross.svg'

import { ML } from '@Cryptos'
import { AppInfo } from '@Constants'
import { ArrayHelper } from '@Helpers'

import './VerifyMessage.css'

const VerifyMessage = () => {
  const [step, setStep] = useState(1)
  const [originalMessageValue, setOriginalMessageValue] = useState('')
  const [originalMessageError, setOriginalMessageError] = useState('')
  const [signedMessageValue, setSignedMessageValue] = useState('')
  const [signedMessageError, setSignedMessageError] = useState('')
  const [isVerified, setIsVerified] = useState(false)

  const originalMessageFieldChangeHandler = ({ target }) => {
    setOriginalMessageValue(target.value)
  }
  const signedMessageFieldChangeHandler = ({ target }) => {
    setSignedMessageValue(target.value)
  }

  const verifyMessageHandler = (originalMessage, signedMessage) => {
    const separatedStrings = signedMessage.split(
      AppInfo.SIGNED_MESSAGE_STRING_SEPARATOR,
    )

    const signedMessageUint8Array = ArrayHelper.stringToUint8Array(
      separatedStrings[0],
    )
    const publickKeyUint8Array = ArrayHelper.stringToUint8Array(
      separatedStrings[1],
    )

    const verifyMessage = ML.verifySignatureForSpending(
      publickKeyUint8Array,
      signedMessageUint8Array,
      originalMessage,
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
      if (!signedMessageValue || !signedMessageValue.includes('.')) {
        setSignedMessageError('Please enter correct signed message.')
        return
      }
      setSignedMessageError('')
      const isVerified = verifyMessageHandler(
        originalMessageValue,
        signedMessageValue,
      )
      setIsVerified(isVerified)
      setStep(3)
    }
    if (step === 3) {
      setOriginalMessageValue('')
      setSignedMessageValue('')
      setIsVerified(false)
      setStep(1)
    }
  }

  const textariaSize = {
    cols: 74,
    rows: 7,
  }

  const submitButtonTitle =
    step === 1 ? 'Next' : step === 2 ? 'Verify' : 'Try Again'
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
        {step === 3 && (
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
