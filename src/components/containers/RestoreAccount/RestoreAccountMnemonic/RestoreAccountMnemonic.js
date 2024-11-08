import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { AppInfo, Expressions } from '@Constants'
import { BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'

import { Button } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import {
  ProgressTracker,
  Header,
  TextField,
  RestoreSeedField,
  OptionButtons,
  WalletList,
} from '@ComposedComponents'

import { ReactComponent as IconArrowRight } from '@Assets/images/icon-arrow-right.svg'

import './RestoreAccountMnemonic.css'

const WalletTypeTitle = ({ top, bottom }) => {
  return (
    <div>
      <p className="walletTypeTopTitle">{top}</p>
      <p className="walletTypeBottomTitle">{bottom}</p>
    </div>
  )
}

const bitcoinWalletTypes = [
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

const RestoreAccountMnemonic = ({
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
  const [accountWalletValid, setAccountWalletValid] = useState(false)

  const [accountNameErrorMessage, setAccountNameErrorMessage] = useState(null)
  const [accountPasswordErrorMessage, setAccountPasswordErrorMessage] =
    useState(null)

  const [accountNamePristinity, setAccountNamePristinity] = useState(true)
  const [accountPasswordPristinity, setAccountPasswordPristinity] =
    useState(true)

  const [btcAddressTypeValue, setBtcAddressTypeValue] = useState(undefined)
  const [selectedWallets, setSelectedWallets] = useState([])

  const btcAddressType = btcAddressTypeValue
    ? btcAddressTypeValue.value
    : BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT

  const navigate = useNavigate()

  const isSeedValid = (words, DefaultWordList = []) => {
    if (words.length !== 12 && words.length !== 24) {
      return false
    }
    return words?.length > 0
      ? words.every((word) => DefaultWordList.includes(word))
      : false
  }

  useEffect(() => {
    const isValid = isSeedValid(wordsFields, defaultBTCWordList)
    setAccountWordsValid(isValid)
  }, [wordsFields, defaultBTCWordList])

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

  const getMnemonics = () => wordsFields.join(' ').trim()

  const goToNextStep = () => {
    const mnemonics = getMnemonics()
    const isBtcSelected = selectedWallets.includes('btc')
    const isLastStep = step >= 6

    if (step === 5 && !isBtcSelected) {
      onStepsFinished(
        accountNameValue,
        accountPasswordValue,
        mnemonics,
        btcAddressType,
        selectedWallets,
      )
    } else if (!isLastStep) {
      setStep(step + 1)
    } else {
      onStepsFinished(
        accountNameValue,
        accountPasswordValue,
        mnemonics,
        btcAddressType,
        selectedWallets,
      )
    }
  }
  const goToPrevStep = () => (step < 2 ? navigate(-1) : setStep(step - 1))

  const steps = [
    { name: 'Wallet Name', active: step === 1 },
    { name: 'Wallet Password', active: step === 2 },
    {
      name: 'Seed Phrases',
      active: step === 3 || step === 4,
    },
    {
      name: 'Wallet Types',
      active: step > 4,
    },
  ]

  const stepsValidations = {
    1: accountNameValid,
    2: accountPasswordValid,
    3: true,
    4: accountWordsValid,
    5: accountWalletValid,
    6: btcAddressTypeValue,
  }

  const titles = {
    2: 'Create',
    3: 'Enter Seed Phrases',
    4: 'Continue',
    5: 'Confirm',
    6: 'Confirm',
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

  const walletValidity = (wallets) => {
    setAccountWalletValid(wallets.length)
  }

  const onSelectWallet = (wallets) => {
    setSelectedWallets(wallets)
    walletValidity(wallets)
  }

  const genButtonTitle = (currentStep) => titles[currentStep] || 'Continue'

  const handleError = (step) => {
    if (step === 6) alert('Please select a wallet type')
    if (step === 4)
      alert(
        'These words do not form a valid mnemonic. Check if you had any typos or if you inserted them in a different order',
      )
    if (step === 5) alert('You must select at least one wallet')
    if (step < 5) return
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
    if (step === 4) validForm = validForm && isMnemonicValid()

    validForm ? goToNextStep() : handleError(step)
  }

  return (
    <div data-testid="restore-account">
      <Header customBackAction={goToPrevStep} />
      <ProgressTracker steps={steps} />
      <form
        className={`account-form ${
          (step === 4 || step === 5) && 'account-form-words'
        } ${step === 3 && 'account-form-description'} ${step === 6 && 'account-form-address-type'}`}
        method="POST"
        data-testid="restore-account-form"
        onSubmit={handleSubmit}
      >
        <VerticalGroup
          data-step={step}
          bigGap={step !== 4 && step !== 5 && step !== 6}
          fullWidth={true}
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
          {step === 3 && (
            <CenteredLayout>
              <p
                className="words-description"
                data-testid="description-paragraph"
              >
                In order to restore the wallet, please enter your 12 or 24 Seed
                Phrase.
              </p>
            </CenteredLayout>
          )}
          {step === 4 && (
            <RestoreSeedField
              setFields={setWordsFields}
              BIP39DefaultWordList={defaultBTCWordList}
              accountWordsValid={accountWordsValid}
              setAccountWordsValid={setAccountWordsValid}
            />
          )}
          {step === 5 && (
            <WalletList
              selectedWallets={selectedWallets}
              setSelectedWallets={onSelectWallet}
              walletTypes={AppInfo.walletTypes}
            />
          )}
          {step === 6 && (
            <>
              <p
                className="words-description"
                data-testid="description-paragraph"
              >
                Choose your BTC address type:
              </p>
              <CenteredLayout>
                <OptionButtons
                  value={btcAddressTypeValue && btcAddressTypeValue.value}
                  options={bitcoinWalletTypes}
                  onSelect={setBtcAddressTypeValue}
                  column
                  buttonExtraStyles={radioButtonExtraClasses}
                />
              </CenteredLayout>
            </>
          )}
          <CenteredLayout>
            <Button
              onClickHandle={handleSubmit}
              extraStyleClasses={['restore-mnemonic-submit-button']}
            >
              {genButtonTitle(step)}{' '}
              <IconArrowRight className="restore-submit-icon" />
            </Button>
          </CenteredLayout>
        </VerticalGroup>
      </form>
    </div>
  )
}
export default RestoreAccountMnemonic
