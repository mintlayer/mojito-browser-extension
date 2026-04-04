import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router'

import { Loading } from '@ComposedComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { CreateAccount } from '@ContainerComponents'

import { Account, loadAccountSubRoutines } from '@Entities'
import { AccountContext } from '@Contexts'
import { BTC, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'

import './CreateAccount.css'

const CreateAccountPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [words, setWords] = useState([])
  const { setWalletInfo } = useContext(AccountContext)
  const [creatingWallet, setCreatingWallet] = useState(false)

  const generateMnemonic = async () => {
    const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
    const mnemonic = await generateNewAccountMnemonic()
    setWords(mnemonic.split(' '))
  }

  const createAccount = (accountName, accountPassword, selectedWallets) => {
    setCreatingWallet(true)
    let accountID = null
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
      .then((id) => {
        accountID = id
        return Account.unlockAccount(id, accountPassword)
      })
      .then(({ addresses, name }) => {
        setWalletInfo(addresses, accountID, name)
        navigate('/dashboard')
      })
  }

  const loadingExtraClasses = ['loading-big']

  return creatingWallet ? (
    <div className="creating-loading-warapper">
      <CenteredLayout>
        <VerticalGroup bigGap>
          <h1 className="loadingText">
            {' '}
            Just a sec, we are creating your wallet...{' '}
          </h1>
          <Loading extraStyleClasses={loadingExtraClasses} />
        </VerticalGroup>
      </CenteredLayout>
    </div>
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
  )
}
export default CreateAccountPage
