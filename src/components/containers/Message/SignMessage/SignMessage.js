import React, { useState, useContext } from 'react'

import { Button, Textarea, Error } from '@BasicComponents'
import { TextField } from '@ComposedComponents'
import { AccountContext, SettingsContext } from '@Contexts'
import { VerticalGroup } from '@LayoutComponents'
import { useNavigate } from 'react-router-dom'

import { ML } from '@Cryptos'
import { Account } from '@Entities'
import { AppInfo } from '@Constants'
import { ArrayHelper } from '@Helpers'

import './SignMessage.css'

const SignMessage = () => {
  const [messageValue, setMessageValue] = useState('')
  const [signedMessage, setSignedMessage] = useState('')
  const [step, setStep] = useState(1)
  const [pass, setPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [messageError, setMessageError] = useState('')
  const [passValidity, setPassValidity] = useState(true)
  const [passPristinity, setPassPristinity] = useState(true)
  const [passErrorMessage, setPassErrorMessage] = useState('')
  const { accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)
  const navigate = useNavigate()

  const changePassHandle = (value) => {
    setPass(value)
  }

  const onTextfieldChangeHandler = ({ target }) => {
    setMessageValue(target.value)
  }

  const isMessageValid = (message) => {
    return message.length > 0
  }

  const signMessageHandler = async (id, password) => {
    const unlockedAccount = await Account.unlockAccount(id, password)
    if (!pass || !unlockedAccount) {
      setPassPristinity(false)
      setPassValidity(false)
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

    // TODO: for the first implementation we will use only the first key, it may be changed in the future

    //FIRST receiving address priv key
    const firstReceivingPrivKey = Object.values(
      walletPrivKeys.mlReceivingPrivKeys,
    )[0]

    // const publickKey = ML.getPublicKeyFromPrivate(firstReceivingPrivKey)

    const signedMessage = ML.signMessageForSpending(
      firstReceivingPrivKey,
      messageValue,
    )
    const signedMessageString = ArrayHelper.uint8ArrayToString(signedMessage)

    setSignedMessage(signedMessageString)

    // const VerifyMessage = ML.verifySignatureForSpending(
    //   publickKey,
    //   signedMessage,
    //   messageValue,
    // )

    // console.log('VerifyMessage, ', VerifyMessage)

    return signedMessage
  }

  const onSubmitClick = async (event) => {
    event.preventDefault()
    if (step === 1) {
      const messageIsValid = isMessageValid(messageValue)
      messageIsValid ? setStep(2) : setMessageError('Message is required')
      return
    }
    if (step === 2) {
      try {
        setPassValidity(true)
        setPassErrorMessage('')
        setLoading(true)
        const response = await signMessageHandler(accountID, pass)
        if (response) {
          setPassValidity(true)
          setPassErrorMessage('')
          setLoading(false)
          setStep(3)
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

    if (step === 3) {
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
    step === 2
      ? loading
        ? 'Signing...'
        : 'Sign Message'
      : step === 3
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
                onChange={onTextfieldChangeHandler}
                id="restore-seed-textarea"
                size={textariaSize}
              />
            </div>
            {messageError && <Error error={messageError} />}
          </VerticalGroup>
        )}
        {step === 2 && (
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
        {step === 3 && (
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
        {step !== 3 && (
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
