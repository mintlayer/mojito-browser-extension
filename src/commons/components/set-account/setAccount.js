import React, { useState, useEffect } from 'react'

import ProgressTracker from '../advanced/progressTracker'
import Header from '../advanced/header'
import Button from '../basic/button'
import CenteredLayout from '../group/centeredLayout'
import VerticalGroup from '../group/verticalGroup'
import InputsList from '../inputs-list/inputsList'
import SetAccountField from '../set-account-field/seAccountField'
import WordsDescription from '../words-list-description/wordsListDescription'

import './setAccount.css'

const SetAccount = ({ step, setStep, words = [] }) => {
  const passwordPattern =
    /^(?=.*?[A-Z])*(?=(.*[a-z]){1,})*(?=(.*[\d]){1,})(?=(.*[\W]){1,})(?!.*\s).{8,}$/
  const [wordsFields, setWordsFields] = useState([])
  const [accountNameValue, setAccountNameValue] = useState('')
  const [accountPasswordValue, setAccountPasswordValue] = useState('')
  const [accountNameValid, setAccountNameValid] = useState(false)
  const [accountPasswordValid, setAccountPasswordValid] = useState(false)
  const [accountWordsValid, setAccountAccountWordsValid] = useState(false)

  const steps = [
    { name: 'Account Name', active: step === 1 ? true : false },
    { name: 'Account Password', active: step === 2 ? true : false },
    {
      name: 'Restoring Information',
      active: step === 3 || step === 4 ? true : false,
    },
  ]

  const nameFieldValidity = (value) => {
    if (value.length > 3) {
      setAccountNameValid(true)
    } else {
      setAccountNameValid(false)
    }
  }

  const passwordFieldValidity = (value) => {
    if (value.length > 8 && value.match(passwordPattern)) {
      setAccountPasswordValid(true)
    } else {
      setAccountPasswordValid(false)
    }
  }

  const accountNameChangeHandler = (value) => {
    nameFieldValidity(value)
    setAccountNameValue(value)
  }

  const accountPasswordChangeHandler = (value) => {
    passwordFieldValidity(value)
    setAccountPasswordValue(value)
  }

  const getButtonTitle = (currentStep) => {
    if (currentStep === 3) {
      return 'I understand'
    } else if (currentStep === 4) {
      return 'Save'
    } else {
      return 'Continue'
    }
  }

  useEffect(() => {
    const wordsValidity = wordsFields.every((word) => word.validity)
    if (wordsValidity) {
      setAccountAccountWordsValid(true)
    } else {
      setAccountAccountWordsValid(false)
    }
  }, [wordsFields, step])

  const handleSubmit = (e) => {
    if (step === 1 && accountNameValid) {
      e.preventDefault()
      setStep(2)
    } else if (step === 2 && accountPasswordValid) {
      e.preventDefault()
      setStep(3)
    } else if (step === 3) {
      e.preventDefault()
      setStep(4)
    } else if (step === 4 && accountWordsValid) {
      e.preventDefault()
      console.log(accountNameValue)
    } else {
      e.preventDefault()
      console.log('something went wrong') // todo: add error component
    }
  }

  return (
    <div data-testid="set-account">
      <Header />
      <ProgressTracker steps={steps} />
      <form
        method="POST"
        data-testid="set-account-form"
        onSubmit={handleSubmit}
      >
        <VerticalGroup data-step={step}>
          {step === 1 && (
            <SetAccountField
              value={accountNameValue}
              onChangeHandle={accountNameChangeHandler}
              validity={accountNameValid}
              placeHolder={'Account Name'}
              title={'Create a name to your account'}
            />
          )}
          {step === 2 && (
            <SetAccountField
              value={accountPasswordValue}
              onChangeHandle={accountPasswordChangeHandler}
              validity={accountPasswordValid}
              pattern={passwordPattern}
              password
              title={'Create a password to your account'}
              placeHolder={'Password'}
            />
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
            <Button onClickHandle={handleSubmit}>{getButtonTitle(step)}</Button>
          </CenteredLayout>
        </VerticalGroup>
      </form>
    </div>
  )
}
export default SetAccount
