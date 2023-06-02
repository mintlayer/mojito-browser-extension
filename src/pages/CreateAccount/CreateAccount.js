import React, { useContext, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Header, Loading } from '@ComposedComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { CreateAccount } from '@ContainerComponents'

import { Account, loadAccountSubRoutines } from '@Entities'
import { AccountContext } from '@Contexts'
import { BTC, BTC_ADDRESS_TYPE_ENUM } from '@Cryptos'
import { ArrayHelper } from '@Helpers'
import { EnvVars } from '@Constants'

import './CreateAccount.css'

import Plausible from 'plausible-tracker'

const { trackEvent } = Plausible({
  domain: EnvVars.PLAUSIBLE_DOMAIN,
  trackLocalhost: EnvVars.PLAUSIBLE_TRACK_LOCALHOST,
})

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

  const createAccount = (accountName, accountPassword) => {
    setCreatingWallet(true)
    let accountID = null
    Account.saveAccount(
      accountName,
      accountPassword,
      words.join(' '),
      BTC_ADDRESS_TYPE_ENUM.NATIVE_SEGWIT,
    )
      .then((id) => {
        accountID = id
        return Account.unlockAccount(id, accountPassword)
      })
      .then(({ address, name }) => {
        setWalletInfo(address, accountID, name)
        navigate('/dashboard')
      })
    trackEvent('account_create__finish')
    setLines([])
    setEntropy([])
  }

  return creatingWallet ? (
    <>
      <Header noBackButton={true} />
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
