import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { Expressions } from '@Constants'

import { Button } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import {
  Header,
  InputList,
  ProgressTracker,
  TextField,
} from '@ComposedComponents'

import WordsDescription from './WordsListDescription'

import './CreateAccount.css'

const CreateAccount = ({
  step,
  setStep,
  words = [],
  onStepsFinished,
  validateMnemonicFn,
  defaultBTCWordList,
}) => {
  const inputExtraclasses = ['set-account-input']
  const passwordPattern = Expressions.PASSWORD
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

  const goToNextStep = () =>
    step < 5
      ? setStep(step + 1)
      : onStepsFinished(accountNameValue, accountPasswordValue)
  const goToPrevStep = () => (step < 2 ? navigate(-1) : setStep(step - 1))

  const steps = [
    { name: 'Account Name', active: step === 1 },
    { name: 'Account Password', active: step === 2 },
    {
      name: 'Seed Phrases',
      active: step > 2,
    },
  ]

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
    5: 'Create account',
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
    if (step < 5) return
    alert(
      'These words do not match the previously generated mnemonic. Check if you had any typos or if you inserted them in a different order',
    )
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
      <ProgressTracker steps={steps} />
      <form
        className={`set-account-form ${step > 3 && 'set-account-form-words'}`}
        method="POST"
        data-testid="set-account-form"
        onSubmit={handleSubmit}
      >
        <VerticalGroup
          data-step={step}
          bigGap={step < 5}
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
            <Button onClickHandle={handleSubmit}>{genButtonTitle(step)}</Button>
          </CenteredLayout>
        </VerticalGroup>
      </form>
    </div>
  )
}
export default CreateAccount
