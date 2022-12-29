import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Expressions } from '@Constants'
import { BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'

import { Button } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import {
  ProgressTracker,
  Header,
  TextField,
  InputList,
  RadioButtons,
} from '@ComposedComponents'

import './RestoreAccount.css'

const WalletTypeTitle = ({ top, bottom }) => {
  return (
    <div>
      <p className="walletTypeTopTitle">{top}</p>
      <p className="walletTypeBottomTitle">{bottom}</p>
    </div>
  )
}

const RestoreAccount = ({
  step,
  setStep,
  onStepsFinished,
  validateMnemonicFn,
  defaultBTCWordList,
}) => {
  const inputExtraclasses = ['account-input']
  const passwordPattern = Expressions.PASSWORD
  const radioButtonExtraClasses = ['address-type-button']
  const [wordsFields, setWordsFields] = useState([])
  const [accountWordsValid, setAccountWordsValid] = useState(false)

  const [accountNameValue, setAccountNameValue] = useState('')
  const [accountPasswordValue, setAccountPasswordValue] = useState('')

  const [accountNameValid, setAccountNameValid] = useState(false)
  const [accountPasswordValid, setAccountPasswordValid] = useState(false)

  const [accountNameErrorMessage, setAccountNameErrorMessage] = useState(null)
  const [accountPasswordErrorMessage, setAccountPasswordErrorMessage] =
    useState(null)

  const [accountNamePristinity, setAccountNamePristinity] = useState(true)
  const [accountPasswordPristinity, setAccountPasswordPristinity] =
    useState(true)

  const [radioButtonValue, setButtonValue] = useState(undefined)

  const addressType = radioButtonValue && radioButtonValue.value

  const walletTypes = [
    {
      name: (
        <WalletTypeTitle
          top={'Legacy'}
          bottom={'Your address starts with "1..."'}
        />
      ),
      value: BTC_ADDRESS_TYPE_ENUM.LEGACY,
    },
    {
      name: (
        <WalletTypeTitle
          top={'P2SH'}
          bottom={'Your address starts with "3..."'}
        />
      ),
      value: BTC_ADDRESS_TYPE_ENUM.P2SH,
    },
    {
      name: (
        <WalletTypeTitle
          top={'Segwit'}
          bottom={'Your address starts with "BC1..."'}
        />
      ),
      value: BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT,
    },
  ]

  const navigate = useNavigate()

  useEffect(() => {
    const message = !accountNameValid
      ? 'The account name should have at least 4 characteres.'
      : null

    setAccountNameErrorMessage(message)
  }, [accountNameValid])

  useEffect(() => {
    const message = !accountPasswordValid
      ? [
          'Your password should have at least 8 characteres.',
          'Also it should have a lowercase letter, an uppercase letter, a digit, and a special char like: /\\*()&^%$#@-_=+\'"?!:;<>~`',
        ]
      : null

    setAccountPasswordErrorMessage(message)
  }, [accountPasswordValid])

  const getMnemonics = () =>
    wordsFields.reduce((acc, word) => `${acc} ${word.value}`, '').trim()

  const goToNextStep = () =>
    step < 5
      ? setStep(step + 1)
      : onStepsFinished(
          accountNameValue,
          accountPasswordValue,
          getMnemonics(),
          addressType,
        )
  const goToPrevStep = () => (step < 2 ? navigate(-1) : setStep(step - 1))

  const steps = [
    { name: 'Account Name', active: step === 1 },
    { name: 'Account Password', active: step === 2 },
    {
      name: 'Seed Phrases',
      active: step > 3,
    },
  ]

  const stepsValidations = {
    1: accountNameValid,
    2: accountPasswordValid,
    3: radioButtonValue,
    4: true,
    5: accountWordsValid,
  }

  const titles = {
    2: 'Create',
    3: 'Next',
    4: 'Enter Seed Phrases',
    5: 'Confirm',
  }

  const nameFieldValidity = (value) => {
    setAccountNameValid(value.length > 3)
  }

  const passwordFieldValidity = (value) => {
    setAccountPasswordValid(!!value.match(passwordPattern))
  }

  const accountNameChangeHandler = (value) => {
    nameFieldValidity(value)
    setAccountNameValue(value)
  }

  const accountPasswordChangeHandler = (value) => {
    passwordFieldValidity(value)
    setAccountPasswordValue(value)
  }

  const genButtonTitle = (currentStep) => titles[currentStep] || 'Continue'

  useEffect(() => {
    const wordsValidity = wordsFields.every((word) => word.validity)
    setAccountWordsValid(wordsValidity)
  }, [wordsFields, step])

  const handleError = (step) => {
    if (step === 3) alert('Please select a wallet type')
    if (step < 5) return
    alert(
      'These words do not form a valid mnemonic. Check if you had any typos or if you inserted them in a different order',
    )
  }

  const isMnemonicValid = () => {
    const inputMnemonic = getMnemonics()
    return validateMnemonicFn(inputMnemonic)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    if (step === 1) setAccountNamePristinity(false)
    if (step === 2) setAccountPasswordPristinity(false)

    let validForm = stepsValidations[step]
    if (step === 5) validForm = validForm && isMnemonicValid()

    validForm ? goToNextStep() : handleError(step)
  }

  return (
    <div data-testid="restore-account">
      <Header customBackAction={goToPrevStep} />
      <ProgressTracker steps={steps} />
      <form
        className={`account-form ${step === 5 && 'account-form-words'} ${
          step === 4 && 'account-form-description'
        }`}
        method="POST"
        data-testid="restore-account-form"
        onSubmit={handleSubmit}
      >
        <VerticalGroup
          data-step={step}
          bigGap={step !== 5 && step !== 3}
        >
          {step === 1 && (
            <CenteredLayout>
              <TextField
                value={accountNameValue}
                onChangeHandle={accountNameChangeHandler}
                validity={accountNameValid}
                placeHolder={'Account Name'}
                label={'Create a name for your account'}
                extraStyleClasses={inputExtraclasses}
                errorMessages={accountNameErrorMessage}
                pristinity={accountNamePristinity}
                alternate
              />
            </CenteredLayout>
          )}
          {step === 2 && (
            <CenteredLayout>
              <TextField
                value={accountPasswordValue}
                onChangeHandle={accountPasswordChangeHandler}
                validity={accountPasswordValid}
                pattern={passwordPattern}
                password
                label={'Create a password for your account'}
                placeHolder={'Password'}
                extraStyleClasses={inputExtraclasses}
                errorMessages={accountPasswordErrorMessage}
                pristinity={accountPasswordPristinity}
                alternate
              />
            </CenteredLayout>
          )}
          {step === 3 && (
            <>
              <p
                className="words-description"
                data-testid="description-paragraph"
              >
                Choose your address type:
              </p>
              <CenteredLayout>
                <RadioButtons
                  value={radioButtonValue && radioButtonValue.value}
                  options={walletTypes}
                  onSelect={setButtonValue}
                  column
                  buttonExtraStyles={radioButtonExtraClasses}
                />
              </CenteredLayout>
            </>
          )}
          {step === 4 && (
            <CenteredLayout>
              <p
                className="words-description"
                data-testid="description-paragraph"
              >
                In order to restore the wallet, please enter your 12 Seed
                Phrase.
              </p>
            </CenteredLayout>
          )}
          {step === 5 && (
            <InputList
              fields={wordsFields}
              setFields={setWordsFields}
              restoreMode
              BIP39DefaultWordList={defaultBTCWordList}
            />
          )}
          <CenteredLayout>
            <Button onClickHandle={handleSubmit}>{genButtonTitle(step)}</Button>
          </CenteredLayout>
        </VerticalGroup>
      </form>
    </div>
  )
}
export default RestoreAccount
