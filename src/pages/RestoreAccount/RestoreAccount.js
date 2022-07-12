import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { AccountContext } from '../../contexts/AccountProvider/AccountProvider'

import {
  saveAccount,
  unlockAccount,
} from '../../services/Entity/Account/Account'

import Header from '../../components/composed/Header/Header'
import Loading from '../../components/composed/Loading/Loading'
import CenteredLayout from '../../components/layouts/CenteredLayout/CenteredLayout'
import VerticalGroup from '../../components/layouts/VerticalGroup/VerticalGroup'
import RestoreAccount from '../../components/containers/RestoreAccount/RestoreAccount'

import './RestoreAccount.css'

const RestoreAccountPage = () => {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const { setBtcAddress } = useContext(AccountContext)
  const [creatingWallet, setCreatingWallet] = useState(false)

  const createAccount = (accountName, accountPassword, mnemonic) => {
    setCreatingWallet(true)
    saveAccount(accountName, accountPassword, mnemonic)
      .then((id) => unlockAccount(id, accountPassword))
      .then((address) => {
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
    />
  )
}
export default RestoreAccountPage