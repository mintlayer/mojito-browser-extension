import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router'

import { AppInfo, Expressions } from '@Constants'

import { Button } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import {
  Header,
  InputList,
  ProgressTracker,
  TextField,
} from '@ComposedComponents'

import { ReactComponent as IconArrowRight } from '@Assets/images/icon-arrow-right.svg'

import WordsDescription from './WordsListDescription'

import './CreateAccount.css'

const CreateAccount = ({
  step,
  setStep,
  words = [],
  onStepsFinished,
  onGenerateMnemonic,
  validateMnemonicFn,
  defaultBTCWordList,
}) => {
  const inputExtraclasses = ['set-account-input']
  const passwordPattern = Expressions.PASSWORD
  const [wordsFields, setWordsFields] = useState([])
  const [direction, setDirection] = useState('forward')

  const [accountNameValue, setAccountNameValue] = useState('')
  const [accountPasswordValue, setAccountPasswordValue] = useState('')

  const [accountNameValid, setAccountNameValid] = useState(false)
  const [accountPasswordValid, setAccountPasswordValid] = useState(false)

  const accountNameErrorMessage = !accountNameValid
    ? AppInfo.WALLET_NAME_ERROR
    : null
  const accountPasswordErrorMessage = !accountPasswordValid
    ? AppInfo.WALLET_PASSWORD_ERROR
    : null

  const [accountNamePristinity, setAccountNamePristinity] = useState(true)
  const [accountPasswordPristinity, setAccountPasswordPristinity] =
    useState(true)
  const selectedWallets = ['btc', 'ml']

  const navigate = useNavigate()

  const goToNextStep = () => {
    setDirection('forward')
    if (step === 2) onGenerateMnemonic()
    return step < 5
      ? setStep(step + 1)
      : onStepsFinished(accountNameValue, accountPasswordValue, selectedWallets)
  }

  const goToPrevStep = () => {
    setDirection('backward')
    return step < 2 ? navigate(-1) : setStep(step - 1)
  }

  const steps = [
    { value: 1, name: 'Wallet Name', active: step === 1 },
    { value: 2, name: 'Wallet Password', active: step === 2 },
    {
      value: 3,
      name: 'Seed Phrases',
      active: step > 2,
    },
  ]

  const accountWordsValid = useMemo(
    () => wordsFields.every((word) => word.validity),
    [wordsFields],
  )

  const stepsValidations = {
    1: accountNameValid,
    2: accountPasswordValid,
    3: true,
    4: true,
    5: accountWordsValid,
  }

  const titles = {
    3: 'I understand',
    4: 'Backup done!',
    5: 'Create Wallet',
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

  const handleError = (step) => {
    if (step < 5) return
    if (step === 5) {
      alert(
        'These words do not match the previously generated mnemonic. Check if you had any typos or if you inserted them in a different order',
      )
    }
  }

  const isMnemonicValid = () => {
    const inputMnemonic = wordsFields
      .reduce((acc, word) => `${acc} ${word.value}`, '')
      .trim()
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
    <div data-testid="set-account">
      <Header customBackAction={goToPrevStep} />
      <ProgressTracker
        steps={steps}
        direction={direction}
      />
      <form
        className={`set-account-form ${step > 3 && 'set-account-form-words'}`}
        method="POST"
        data-testid="set-account-form"
        onSubmit={handleSubmit}
      >
        <VerticalGroup
          data-step={step}
          bigGap={step !== 5}
          fullWidth
        >
          {step === 1 && (
            <TextField
              value={accountNameValue}
              onChangeHandle={accountNameChangeHandler}
              validity={accountNameValid}
              placeHolder={'Wallet Name'}
              label={'Create a name for your wallet'}
              extraStyleClasses={inputExtraclasses}
              errorMessages={accountNameErrorMessage}
              pristinity={accountNamePristinity}
              alternate
            />
          )}
          {step === 2 && (
            <TextField
              value={accountPasswordValue}
              onChangeHandle={accountPasswordChangeHandler}
              validity={accountPasswordValid}
              password
              label={'Create a password for your wallet'}
              placeHolder={'Password'}
              extraStyleClasses={inputExtraclasses}
              errorMessages={accountPasswordErrorMessage}
              pristinity={accountPasswordPristinity}
              alternate
            />
          )}
          {step === 3 && <WordsDescription />}
          {step === 4 && (
            <InputList
              wordsList={words}
              fields={wordsFields}
              setFields={setWordsFields}
              restoreMode={false}
              BIP39DefaultWordList={defaultBTCWordList}
            />
          )}
          {step === 5 && (
            <InputList
              wordsList={words}
              fields={wordsFields}
              setFields={setWordsFields}
              restoreMode={true}
              BIP39DefaultWordList={defaultBTCWordList}
            />
          )}
          <CenteredLayout>
            <Button
              key={step}
              buttonType="submit"
              autoFocus
              extraStyleClasses={['create-submit-button']}
            >
              {genButtonTitle(step)}{' '}
              <IconArrowRight className="create-submit-icon" />
            </Button>
          </CenteredLayout>
        </VerticalGroup>
      </form>
    </div>
  )
}
export default CreateAccount
