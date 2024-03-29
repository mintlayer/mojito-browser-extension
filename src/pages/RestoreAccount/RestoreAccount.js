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
  const { setWalletInfo } = useContext(AccountContext)
  const [creatingWallet, setCreatingWallet] = useState(false)

  const createAccount = (
    accountName,
    accountPassword,
    mnemonic,
    btcAddressType,
    selectedWallets,
    // eslint-disable-next-line max-params
  ) => {
    setCreatingWallet(true)
    let accountID = null
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
      .then(({ addresses }) => {
        setWalletInfo(addresses, accountID, accountName)
        navigate('/dashboard')
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
