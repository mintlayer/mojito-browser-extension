import { useState, useContext } from 'react'
import { Button, Error } from '@BasicComponents'
import { TextField, InputList } from '@ComposedComponents'
import { VerticalGroup, CenteredLayout } from '@LayoutComponents'
import { BTC, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'
import { AccountContext } from '@Contexts'
import { Account, AccountHelpers } from '@Entities'
import { useNavigate } from 'react-router'
import { wordlists } from 'bip39'

const AddWallet = ({
  account,
  walletType,
  setAllowClosing,
  setOpenConnectConfirmation,
}) => {
  const navigate = useNavigate()
  const [pass, setPass] = useState(null)
  const { accountID, setWalletInfo } = useContext(AccountContext)
  const [wordsFields, setWordsFields] = useState([])
  const [passValidity, setPassValidity] = useState(false)
  const [passPristinity, setPassPristinity] = useState(true)
  const [passErrorMessage, setPassErrorMessage] = useState('')
  const [mnemonicErrorMessage, setMnemonicErrorMessage] = useState('')
  const firstStep = account.seed.encryptedMlTestnetPrivateKey ? 3 : 1
  const [step, setStep] = useState(firstStep)

  const getMnemonics = () =>
    wordsFields.reduce((acc, word) => `${acc} ${word.value}`, '').trim()

  const submitButtonTitle = step === 3 ? 'Add Wallet' : 'Next'

  const changePassHandle = (value) => {
    setPass(value)
  }

  const connectWalletHandle = async (id, walletType, mnemonic) => {
    //TODO: refactor this
    const unlockedAccount = await Account.unlockAccount(id, pass)
    if (!pass || !unlockedAccount) {
      setPassPristinity(false)
      setPassValidity(false)
      setPassErrorMessage('Password must be set.')
      return
    }
    const currentAccount = await Account.getAccount(id)
    const btcWalletType =
      currentAccount.walletType || BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT
    const currentWallets = currentAccount.walletsToCreate
    const walletToAdd = walletType.value

    if (currentWallets.includes(walletToAdd)) {
      console.error('Wallet already added')
      setPassErrorMessage('Wallet already added')
      return
    }

    if (!account.seed.encryptedMlTestnetPrivateKey) {
      const {
        encryptedMlTestnetPrivateKey,
        encryptedMlMainnetPrivateKey,
        mlTestnetPrivKeyIv,
        mlMainnetPrivKeyIv,
        mlTestnetPrivKeyTag,
        mlMainnetPrivKeyTag,
      } = await AccountHelpers.getEncryptedPrivateKeys(
        pass,
        account.salt,
        mnemonic,
      )
      return await Account.updateAccount(id, {
        iv: {
          ...account.iv,
          mlTestnetPrivKeyIv,
          mlMainnetPrivKeyIv,
        },
        seed: {
          ...account.seed,
          encryptedMlTestnetPrivateKey,
          encryptedMlMainnetPrivateKey,
        },
        tag: {
          ...account.tag,
          mlTestnetPrivKeyTag,
          mlMainnetPrivKeyTag,
        },
        walletsToCreate: [...currentWallets, walletToAdd],
      })
    }

    return await Account.updateAccount(id, {
      walletType: btcWalletType,
      walletsToCreate: [...currentWallets, walletToAdd],
    })
  }

  const onConnectSubmit = async (e) => {
    e.preventDefault()
    if (step === 1) {
      setStep(2)
      return
    }
    if (step === 2) {
      const words = wordsFields.map((field) => field.value)
      const mnemonic = words.join(' ')
      const isValid = BTC.validateMnemonic(mnemonic)
      if (!isValid) {
        console.error('Invalid mnemonic')
        setMnemonicErrorMessage('Invalid Seed Pharse, please try again')
        return
      }
      setMnemonicErrorMessage('')
      setStep(3)
      return
    }
    try {
      setAllowClosing(false)
      const mnemonic = getMnemonics(wordlists)
      const response = await connectWalletHandle(
        accountID,
        walletType,
        mnemonic,
      )
      if (response) {
        const { addresses, name } = await Account.unlockAccount(accountID, pass)
        setWalletInfo(addresses, accountID, name)
        setOpenConnectConfirmation(false)
        setPassValidity(true)
        setPassErrorMessage('')
        navigate('/')
      }
      return response
    } catch (e) {
      console.error(e)
      setPassPristinity(false)
      setPassValidity(false)
      setPass('')
      setPassErrorMessage('Incorrect password. Account could not be added.')
      setAllowClosing(true)
    } finally {
      setAllowClosing(true)
    }
  }
  return (
    <form>
      <VerticalGroup bigGap>
        {step === 1 && (
          <CenteredLayout>
            <VerticalGroup>
              <p
                className="words-description"
                data-testid="description-paragraph"
              >
                In order to add the wallet, we will ask you to enter your Seed
                Phrase and password again.
              </p>
              <p
                className="words-description"
                data-testid="description-paragraph"
              >
                We strongly recomend you to write down the same words you used
                to create the account.
              </p>
            </VerticalGroup>
          </CenteredLayout>
        )}
        {step === 2 && (
          <VerticalGroup bigGap>
            <p
              className="words-description"
              data-testid="description-paragraph"
            >
              Please enter your 12 Seed Phrase
            </p>
            <InputList
              fields={wordsFields}
              setFields={setWordsFields}
              restoreMode
              BIP39DefaultWordList={BTC.getWordList()}
            />
          </VerticalGroup>
        )}
        {step === 3 && (
          <TextField
            label="Enter your password"
            placeHolder="Password"
            password
            validity={passValidity}
            pristinity={passPristinity}
            errorMessages={passErrorMessage}
            onChangeHandle={changePassHandle}
          />
        )}
        {mnemonicErrorMessage && <Error error={mnemonicErrorMessage} />}
        <CenteredLayout>
          <Button onClickHandle={onConnectSubmit}>{submitButtonTitle}</Button>
        </CenteredLayout>
      </VerticalGroup>
    </form>
  )
}

export default AddWallet
