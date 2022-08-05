import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { Header, Loading } from '@ComposedComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { CreateAccount } from '@ContainerComponents'

import { Account, loadAccountSubRoutines } from '@Entities'
import { AccountContext } from '@Contexts'
import { BTC } from '@Cryptos'

import './CreateAccount.css'

const CreateAccountPage = () => {
  const effectCalled = useRef(false)
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [words, setWords] = useState([])
  const { setBtcAddress } = useContext(AccountContext)
  const [creatingWallet, setCreatingWallet] = useState(false)

  useEffect(() => {
    if (effectCalled.current) return
    effectCalled.current = true
    const generateMnemonic = async () => {
      const { generateNewAccountMnemonic } = await loadAccountSubRoutines()
      const mnemonic = await generateNewAccountMnemonic()
      setWords(mnemonic.split(' '))
    }

    generateMnemonic()
  }, [])

  const createAccount = (accountName, accountPassword) => {
    setCreatingWallet(true)
    Account.saveAccount(accountName, accountPassword, words.join(' '))
      .then((id) => Account.unlockAccount(id, accountPassword))
      .then(([address]) => {
        setBtcAddress(address)
        navigate('/wallet')
      })
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
