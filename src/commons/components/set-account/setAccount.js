import React, { useState, useEffect } from 'react'
import Expressions from '../../utils/expressions'

import ProgressTracker from '../advanced/progressTracker'
import Header from '../advanced/header'
import Button from '../basic/button'
import CenteredLayout from '../group/centeredLayout'
import VerticalGroup from '../group/verticalGroup'
import InputsList from '../inputs-list/inputsList'
import TextField from '../basic/textField'
import WordsDescription from '../words-list-description/wordsListDescription'

import './setAccount.css'
import { useNavigate } from 'react-router-dom'

const SetAccount = ({ step, setStep, words = [] }) => {
  const inputExtraclasses = ['set-account-input']
  const passwordPattern = Expressions.PASSWORD
  const [wordsFields, setWordsFields] = useState([])
  const [accountNameValue, setAccountNameValue] = useState('')
  const [accountPasswordValue, setAccountPasswordValue] = useState('')
  const [accountNameValid, setAccountNameValid] = useState(false)
  const [accountPasswordValid, setAccountPasswordValid] = useState(false)
  const [accountWordsValid, setAccountWordsValid] = useState(false)
  const navigate = useNavigate()

  const goToNextStep = () => setStep(step + 1)
  const goToPrevStep = () => (step < 2 ? navigate(-1) : setStep(step - 1))

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
    3: 'I understand',
    4: 'Save',
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
    <div data-testid="set-account">
      <Header customBackAction={goToPrevStep} />
      <ProgressTracker steps={steps} />
      <form
        className={`set-account-form ${step === 4 && 'set-account-form-words'}`}
        method="POST"
        data-testid="set-account-form"
        onSubmit={handleSubmit}
      >
        <VerticalGroup
          data-step={step}
          bigGap
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
          {step === 3 && <WordsDescription />}
          {step === 4 && (
            <InputsList
              amount={12}
              wordsList={words}
              fields={wordsFields}
              setFields={setWordsFields}
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
export default SetAccount
