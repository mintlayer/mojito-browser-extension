import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router'

import { AccountContext } from '@Contexts'
import { Account } from '@Entities'
import { BTC } from '@Cryptos'

import { Loading } from '@ComposedComponents'
import { Header } from '@ComposedComponents'
import { Button } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { RestoreAccount } from '@ContainerComponents'

import './RestoreAccount.css'

const RestoreAccountPage = () => {
  const [step, setStep] = useState(1)
  const [restoreMethod, setRestoreMethod] = useState('')
  const [creatingWallet, setCreatingWallet] = useState(false)
  const { setWalletInfo } = useContext(AccountContext)
  const restoreButtonExtraClasses = ['restore-button']

  const navigate = useNavigate()

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

  const goToPrevStep = () => {
    setRestoreMethod('')
    navigate('/')
  }

  const loadingExtraClasses = ['loading-big']

  return creatingWallet ? (
    <div className="creating-loading-warapper">
      <CenteredLayout>
        <VerticalGroup bigGap>
          <h1 className="loadingText">
            {' '}
            Just a sec, we are restoring your wallet...{' '}
          </h1>
          <Loading extraStyleClasses={loadingExtraClasses} />
        </VerticalGroup>
      </CenteredLayout>
    </div>
  ) : (
    <>
      {!restoreMethod && (
        <VerticalGroup bigGap>
          <Header customBackAction={goToPrevStep} />
          <h2 className="center-text title-restore">
            Please select the method to restore your wallet
          </h2>
          <div className="restore-button-wrapper">
            <Button
              onClickHandle={() => setRestoreMethod('mnemonic')}
              extraStyleClasses={restoreButtonExtraClasses}
            >
              Seed Phrase
            </Button>
            <Button
              onClickHandle={() => setRestoreMethod('json')}
              extraStyleClasses={restoreButtonExtraClasses}
            >
              Restore from file
            </Button>
          </div>
        </VerticalGroup>
      )}
      {restoreMethod === 'mnemonic' && (
        <RestoreAccount.RestoreAccountMnemonic
          step={step}
          setStep={setStep}
          onStepsFinished={createAccount}
          validateMnemonicFn={BTC.validateMnemonic}
          defaultBTCWordList={BTC.getWordList()}
        />
      )}
      {restoreMethod === 'json' && (
        <RestoreAccount.RestoreAccountJson
          step={step}
          setStep={setStep}
          onStepsFinished={createAccount}
          validateMnemonicFn={BTC.validateMnemonic}
          defaultBTCWordList={BTC.getWordList()}
        />
      )}
    </>
  )
}
export default RestoreAccountPage
