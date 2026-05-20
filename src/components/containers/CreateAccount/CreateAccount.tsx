import { useState, useMemo, useEffect, useContext, FormEvent } from 'react'
import { useNavigate } from 'react-router'

import { AppInfo, Expressions } from '@Constants'
import { AccountContext } from '@Contexts'

import { Button } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { InputList, ProgressTracker, TextField } from '@ComposedComponents'
import type { InputField } from '../../composed/InputList/InputsList'

import { ReactComponent as IconArrowRight } from '@Assets/images/icon-arrow-right.svg'

import WordsDescription from './WordsListDescription'

import styles from './CreateAccount.module.css'

interface CreateAccountProps {
  step: number
  setStep: (step: number) => void
  words?: string[]
  onStepsFinished?: (name: string, password: string, wallets: string[]) => void
  onGenerateMnemonic?: () => void
  validateMnemonicFn?: (mnemonic: string) => boolean
  defaultBTCWordList?: string[]
}

const Title = ({ title }: { title: string }) => (
  <h1 className={styles.title}>{title}</h1>
)

const CreateAccount = ({
  step,
  setStep,
  words = [],
  onStepsFinished,
  onGenerateMnemonic,
  validateMnemonicFn,
  defaultBTCWordList,
}: CreateAccountProps) => {
  const inputExtraclasses = [styles.setAccountInput]
  const passwordPattern = Expressions.PASSWORD
  const [wordsFields, setWordsFields] = useState<InputField[]>([])
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
  const { setCustomBackAction } = useContext(AccountContext)

  const goToNextStep = () => {
    setDirection('forward')
    if (step === 2 && onGenerateMnemonic) onGenerateMnemonic()
    return step < 5
      ? setStep(step + 1)
      : onStepsFinished &&
          onStepsFinished(
            accountNameValue,
            accountPasswordValue,
            selectedWallets,
          )
  }

  const goToPrevStep = () => {
    setDirection('backward')
    return step < 2 ? navigate(-1) : setStep(step - 1)
  }

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    setCustomBackAction(() => goToPrevStep)
    return () => setCustomBackAction(null)
  }, [step])
  /* eslint-enable react-hooks/exhaustive-deps */

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

  const stepsValidations: Record<number, boolean> = {
    1: accountNameValid,
    2: accountPasswordValid,
    3: true,
    4: true,
    5: accountWordsValid,
  }

  const titles: Record<number, string> = {
    3: 'I understand',
    4: 'Backup done!',
    5: 'Create Wallet',
  }

  const nameFieldValidity = (value: string) => {
    setAccountNameValid(value.length > 3)
  }

  const passwordFieldValidity = (value: string) => {
    setAccountPasswordValid(!!value.match(passwordPattern))
  }

  const accountNameChangeHandler = (value: string) => {
    nameFieldValidity(value)
    setAccountNameValue(value)
  }

  const accountPasswordChangeHandler = (value: string) => {
    passwordFieldValidity(value)
    setAccountPasswordValue(value)
  }

  const genButtonTitle = (currentStep: number) =>
    titles[currentStep] || 'Continue'

  const handleError = (step: number) => {
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
    return validateMnemonicFn && validateMnemonicFn(inputMnemonic)
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (step === 1) setAccountNamePristinity(false)
    if (step === 2) setAccountPasswordPristinity(false)

    let validForm = stepsValidations[step]
    if (step === 5) validForm = validForm && !!isMnemonicValid()

    validForm ? goToNextStep() : handleError(step)
  }

  const formClasses = [styles.setAccountForm]
  if (step > 3) formClasses.push(styles.setAccountFormWords)

  return (
    <div
      data-testid="set-account"
      className={styles.setAccountContainer}
    >
      <ProgressTracker
        steps={steps}
        direction={direction}
      />
      <form
        className={formClasses.join(' ')}
        method="POST"
        data-testid="set-account-form"
        onSubmit={handleSubmit}
      >
        <VerticalGroup
          data-step={step}
          bigGap={step !== 5}
          center
        >
          {step === 1 && (
            <div className={styles.itemWrapper}>
              <TextField
                value={accountNameValue}
                onChangeHandle={accountNameChangeHandler}
                validity={accountNameValid}
                placeHolder={'Wallet Name'}
                label={<Title title="Create a name for your wallet" />}
                extraStyleClasses={inputExtraclasses}
                errorMessages={accountNameErrorMessage}
                pristinity={accountNamePristinity}
                alternate
              />
            </div>
          )}
          {step === 2 && (
            <div className={styles.itemWrapper}>
              <TextField
                value={accountPasswordValue}
                onChangeHandle={accountPasswordChangeHandler}
                validity={accountPasswordValid}
                password
                label={<Title title="Create a password for your wallet" />}
                placeHolder={'Password'}
                extraStyleClasses={inputExtraclasses}
                errorMessages={accountPasswordErrorMessage}
                pristinity={accountPasswordPristinity}
                alternate
              />
            </div>
          )}
          {step === 3 && (
            <div className={styles.itemWrapper}>
              <WordsDescription />
            </div>
          )}

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
              extraStyleClasses={[styles.createSubmitButton]}
            >
              {genButtonTitle(step)}{' '}
              <IconArrowRight className={styles.createSubmitIcon} />
            </Button>
          </CenteredLayout>
        </VerticalGroup>
      </form>
    </div>
  )
}
export default CreateAccount
