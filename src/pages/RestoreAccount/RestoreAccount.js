import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AccountContext } from '@Contexts'
import { Account } from '@Entities'
import { BTC } from '@Cryptos'

import { Header, Loading } from '@ComposedComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { RestoreAccount } from '@ContainerComponents'

import './RestoreAccount.css'

const RestoreAccountPage = () => {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const { setBtcAddress } = useContext(AccountContext)
  const [creatingWallet, setCreatingWallet] = useState(false)

  const createAccount = (accountName, accountPassword, mnemonic) => {
    setCreatingWallet(true)
    Account.saveAccount(accountName, accountPassword, mnemonic)
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
            Just a sec, we are restoring your account...{' '}
          </h1>
          <Loading />
        </VerticalGroup>
      </CenteredLayout>
    </>
  ) : (
    <RestoreAccount
      step={step}
      setStep={setStep}
      onStepsFinished={createAccount}
      validateMnemonicFn={BTC.validateMnemonic}
      defaultBTCWordList={BTC.getWordList()}
    />
  )
}
export default RestoreAccountPage
