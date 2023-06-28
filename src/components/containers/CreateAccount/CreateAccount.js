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
  WalletList,
} from '@ComposedComponents'

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

  const [accountNameValue, setAccountNameValue] = useState('')
  const [accountPasswordValue, setAccountPasswordValue] = useState('')

  const [accountNameValid, setAccountNameValid] = useState(false)
  const [accountPasswordValid, setAccountPasswordValid] = useState(false)
  const [accountEntropyValid, setAccountEntropyValid] = useState(false)
  const [accountWalletValid, setAccountWalletValid] = useState(false)

  const [accountNameErrorMessage, setAccountNameErrorMessage] = useState(null)
  const [accountPasswordErrorMessage, setAccountPasswordErrorMessage] =
    useState(null)
  const [showEntropyError, setShowEntropyError] = useState(false)

  const [accountNamePristinity, setAccountNamePristinity] = useState(true)
  const [accountPasswordPristinity, setAccountPasswordPristinity] =
    useState(true)
  const [selectedWallet, setSelectedWallet] = useState([])

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

  const accountEntropyValidity = (lines) => {
    const points = lines.flatMap((line) => line.points)
    return points.length >= AppInfo.minEntropyLength
  }

  const walletValidity = (wallets) => {
    setAccountWalletValid(wallets.length)
  }

  const onSelectWallet = (wallets) => {
    setSelectedWallet(wallets)
    walletValidity(wallets)
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

  const goToNextStep = () =>
    step < 7
      ? setStep(step + 1)
      : onStepsFinished(accountNameValue, accountPasswordValue)
  const goToPrevStep = () => (step < 2 ? navigate(-1) : setStep(step - 1))

  const steps = [
    { name: 'Account Name', active: step === 1 },
    { name: 'Account Password', active: step === 2 },
    { name: 'Entropy Generation', active: step === 3 },
    {
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
    7: accountWalletValid,
  }

  const titles = {
    4: 'I understand',
    5: 'Backup done!',
    7: 'Create account',
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
    if (step === 7) {
      alert('You must select at least one wallet')
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
    if (step === 6) goToNextStep()
    if (step === 7) validForm = validForm && isMnemonicValid()

    validForm ? goToNextStep() : handleError(step)
  }

  return (
    <div data-testid="set-account">
      <Header customBackAction={goToPrevStep} />
      <ProgressTracker steps={steps} />
      <form
        className={`set-account-form ${step > 4 && 'set-account-form-words'}`}
        method="POST"
        data-testid="set-account-form"
        onSubmit={handleSubmit}
      >
        <VerticalGroup
          data-step={step}
          bigGap={step !== 6 && !showEntropyError}
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
          {step === 7 && (
            <WalletList
              selectedWallet={selectedWallet}
              setSelectedWallet={onSelectWallet}
              walletTypes={AppInfo.walletTypes}
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
