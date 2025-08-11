import React, { useState, useEffect, useCallback, useContext } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppInfo, Expressions } from '@Constants'

import { Button } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import {
  Header,
  InputList,
  ProgressTracker,
  TextField,
  Entropy,
} from '@ComposedComponents'

import { ReactComponent as IconArrowRight } from '@Assets/images/icon-arrow-right.svg'

import WordsDescription from './WordsListDescription'

import './CreateAccount.css'
import { AccountContext } from '@Contexts'
import { generateEntropy, normalize } from '@mintlayer/entropy-generator'

const CreateAccount = ({
  step,
  setStep,
  words = [],
  onStepsFinished,
  validateMnemonicFn,
  defaultBTCWordList,
}) => {
  const { setEntropy, lines } = useContext(AccountContext)
  const inputExtraclasses = ['set-account-input']
  const passwordPattern = Expressions.PASSWORD
  const [wordsFields, setWordsFields] = useState([])
  const [accountWordsValid, setAccountWordsValid] = useState(false)
  const [direction, setDirection] = useState('forward')

  const [accountNameValue, setAccountNameValue] = useState('')
  const [accountPasswordValue, setAccountPasswordValue] = useState('')

  const [accountNameValid, setAccountNameValid] = useState(false)
  const [accountPasswordValid, setAccountPasswordValid] = useState(false)
  const [accountEntropyValid, setAccountEntropyValid] = useState(false)

  const [accountNameErrorMessage, setAccountNameErrorMessage] = useState(null)
  const [accountPasswordErrorMessage, setAccountPasswordErrorMessage] =
    useState(null)
  const [showEntropyError, setShowEntropyError] = useState(false)

  const [accountNamePristinity, setAccountNamePristinity] = useState(true)
  const [accountPasswordPristinity, setAccountPasswordPristinity] =
    useState(true)
  const selectedWallets = ['btc', 'ml']

  const navigate = useNavigate()

  const calculateEntropy = useCallback(
    (size) => {
      const points = lines.flatMap((line) => line.points)
      const normalizedPoints = normalize(
        points.map((point) => Math.round(point)),
      )
      return size
        ? generateEntropy(normalizedPoints, size)
        : generateEntropy(normalizedPoints)
    },
    [lines],
  )

  useEffect(() => {
    const message = !accountNameValid
      ? 'The wallet name should have at least 4 characteres.'
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

  const accountEntropyValidity = (lines) => {
    const points = lines.flatMap((line) => line.points)
    return points.length >= AppInfo.minEntropyLength
  }

  useEffect(() => {
    if (!lines) return
    const isEntropyValid = accountEntropyValidity(lines)
    setAccountEntropyValid(isEntropyValid)
    if (step < 3 || isEntropyValid) {
      setShowEntropyError(false)
    }
  }, [lines, step, accountEntropyValid])

  const thirdStepSubmitHandler = () => {
    if (!accountEntropyValid) {
      setShowEntropyError(true)
    }
    setEntropy(calculateEntropy())
  }

  const goToNextStep = () => {
    setDirection('forward')
    return step < 6
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
    { value: 3, name: 'Entropy Generation', active: step === 3 },
    {
      value: 4,
      name: 'Seed Phrases',
      active: step > 3,
    },
  ]

  const stepsValidations = {
    1: accountNameValid,
    2: accountPasswordValid,
    3: accountEntropyValid,
    4: true,
    5: true,
    6: accountWordsValid,
  }

  const titles = {
    4: 'I understand',
    5: 'Backup done!',
    6: 'Create Wallet',
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
    if (step < 6) return
    if (step === 6) {
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
    if (step === 3) thirdStepSubmitHandler()

    let validForm = stepsValidations[step]
    if (step === 6) validForm = validForm && isMnemonicValid()

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
        className={`set-account-form ${step > 4 && 'set-account-form-words'}`}
        method="POST"
        data-testid="set-account-form"
        onSubmit={handleSubmit}
      >
        <VerticalGroup
          data-step={step}
          bigGap={step !== 6 && step !== 7 && !showEntropyError}
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
              pattern={passwordPattern}
              password
              label={'Create a password for your wallet'}
              placeHolder={'Password'}
              extraStyleClasses={inputExtraclasses}
              errorMessages={accountPasswordErrorMessage}
              pristinity={accountPasswordPristinity}
              alternate
            />
          )}
          {step === 3 && <Entropy isError={showEntropyError} />}
          {step === 4 && <WordsDescription />}
          {step === 5 && (
            <InputList
              wordsList={words}
              fields={wordsFields}
              setFields={setWordsFields}
              restoreMode={false}
              BIP39DefaultWordList={defaultBTCWordList}
            />
          )}
          {step === 6 && (
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
              onClickHandle={handleSubmit}
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
