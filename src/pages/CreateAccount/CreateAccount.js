import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Header, Loading } from '@ComposedComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { CreateAccount } from '@ContainerComponents'

import { Account, loadAccountSubRoutines } from '@Entities'
import { AccountContext } from '@Contexts'
import { BTC, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'
import { ArrayHelper } from '@Helpers'

import './CreateAccount.css'

const CreateAccountPage = () => {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [words, setWords] = useState([])
  const { setWalletInfo, entropy, setLines, setEntropy } =
    useContext(AccountContext)
  const [creatingWallet, setCreatingWallet] = useState(false)

  const generateMnemonic = async (entropy) => {
    const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
    const mnemonic = await generateNewAccountMnemonic(entropy)
    setWords(mnemonic.split(' '))
  }

  useEffect(() => {
    if (!entropy.length) return
    if (step < 3) {
      setLines([])
      setEntropy([])
      setWords([])
    }
    if (step === 4) {
      const shuffledEntropy = ArrayHelper.getNRandomElementsFromArray(
        entropy,
        16,
      )
      generateMnemonic(shuffledEntropy)
    }
  }, [entropy, step, setLines, setEntropy])

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
    setLines([])
    setEntropy([])
  }

  return creatingWallet ? (
    <>
      <Header noBackButton />
      <CenteredLayout>
        <VerticalGroup bigGap>
          <h1 className="loadingText">
            {' '}
            Just a sec, we are creating your account...{' '}
          </h1>
          <Loading />
        </VerticalGroup>
      </CenteredLayout>
    </>
  ) : (
    <CreateAccount
      step={step}
      setStep={setStep}
      words={words}
      onStepsFinished={createAccount}
      validateMnemonicFn={BTC.validateMnemonic}
      defaultBTCWordList={BTC.getWordList()}
    />
  )
}
export default CreateAccountPage
