import { useContext, useState } from 'react'
import { useNavigate } from 'react-router'

import { LoadingScreen } from '@ComposedComponents'
import { CreateAccount } from '@ContainerComponents'

import { Account, loadAccountSubRoutines } from '@Entities'
import { AccountContext } from '@Contexts'
import { BTC, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'

import { PageWrapper } from '@BasicComponents'
import styles from './CreateAccount.module.css'

const CreateAccountPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [words, setWords] = useState<string[]>([])
  const { setWalletInfo } = useContext(AccountContext)
  const [creatingWallet, setCreatingWallet] = useState(false)

  const generateMnemonic = async () => {
    const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
    const mnemonic = await generateNewAccountMnemonic()
    setWords(mnemonic.split(' '))
  }

  const createAccount = (
    accountName: string,
    accountPassword: string,
    selectedWallets: string[],
  ) => {
    setCreatingWallet(true)
    let accountID: string | null = null
    const mnemonic = words.join(' ')
    const btcAddressType = BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT
    const data = {
      name: accountName,
      password: accountPassword,
      mnemonic,
      walletType: btcAddressType,
      walletsToCreate: selectedWallets,
    }
    Account.saveAccount(data)
      .then((id: string) => {
        accountID = id
        return Account.unlockAccount(id, accountPassword)
      })
      .then(({ addresses, name }) => {
        setWalletInfo(addresses, accountID, name)
        navigate('/dashboard')
      })
  }

  return (
    <PageWrapper className={styles.createAccountPage}>
      {creatingWallet ? (
        <LoadingScreen text="Just a sec, we are creating your wallet..." />
      ) : (
        <CreateAccount
          step={step}
          setStep={setStep}
          words={words}
          onStepsFinished={createAccount}
          onGenerateMnemonic={generateMnemonic}
          validateMnemonicFn={BTC.validateMnemonic}
          defaultBTCWordList={BTC.getWordList()}
        />
      )}
    </PageWrapper>
  )
}
export default CreateAccountPage
