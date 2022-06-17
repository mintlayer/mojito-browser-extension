import React, { useState, useEffect } from 'react'
import Expressions from '../../utils/expressions'

import ProgressTracker from '../advanced/progressTracker'
import Header from '../advanced/header'
import Button from '../basic/button'
import CenteredLayout from '../group/centeredLayout'
import VerticalGroup from '../group/verticalGroup'
import InputsList from '../inputs-list/inputsList'
import TextField from '../basic/textField'

import './restoreAccount.css'

const RestoreAccount = ({ step, setStep, words = [] }) => {
  const inputExtraclasses = ['account-input']
  const passwordPattern = Expressions.PASSWORD
  const [wordsFields, setWordsFields] = useState([])
  const [accountNameValue, setAccountNameValue] = useState('')
  const [accountPasswordValue, setAccountPasswordValue] = useState('')
  const [accountNameValid, setAccountNameValid] = useState(false)
  const [accountPasswordValid, setAccountPasswordValid] = useState(false)
  const [accountWordsValid, setAccountWordsValid] = useState(false)

  const goToNextStep = () => setStep(step + 1)

  const steps = [
    { name: 'Account Name', active: step === 1 },
    { name: 'Account Password', active: step === 2 },
    {
      name: 'Restoring Information',
      active: step === 3 || step === 4,
    },
  ]

  const stepsValidations = {
    1: accountNameValid,
    2: accountPasswordValid,
    3: true,
    4: accountWordsValid,
  }

  const titles = {
    2: 'Create',
    3: 'I have them',
    4: 'Confirm',
  }

  const nameFieldValidity = (value) => {
    setAccountNameValid(value.length > 3)
  }

  const passwordFieldValidity = (value) => {
    setAccountPasswordValid(value.match(passwordPattern))
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

  const handleSubmit = (e) => {
    e.preventDefault()
    stepsValidations[step]
      ? goToNextStep()
      : console.log('something went wrong')
  }

  return (
    <div data-testid="restore-account">
      <Header />
      <ProgressTracker steps={steps} />
      <form
        className={`account-form ${step === 4 && 'account-form-words'} ${
          step === 3 && 'account-form-description'
        }`}
        method="POST"
        data-testid="restore-account-form"
        onSubmit={handleSubmit}
      >
        <VerticalGroup
          data-step={step}
          bigGap={step !== 4}
        >
          {step === 1 && (
            <CenteredLayout>
              <TextField
                value={accountNameValue}
                onChangeHandle={accountNameChangeHandler}
                validity={accountNameValid}
                placeHolder={'Account Name'}
                label={'Create a name to your account'}
                extraStyleClasses={inputExtraclasses}
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
                label={'Create a password to your account'}
                placeHolder={'Password'}
                extraStyleClasses={inputExtraclasses}
                alternate
              />
            </CenteredLayout>
          )}
          {step === 3 && (
            <CenteredLayout>
              <p
                className="words-description"
                data-testid="description-paragraph"
              >
                In order to restore your wallet you need your 12 words backup.
              </p>
            </CenteredLayout>
          )}
          {step === 4 && (
            <InputsList
              amount={12}
              wordsList={words}
              fields={wordsFields}
              setFields={setWordsFields}
              restoreMode
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
