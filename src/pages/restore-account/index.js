import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../commons/components/advanced/header'
import Loading from '../../commons/components/advanced/loading'
import CenteredLayout from '../../commons/components/group/centeredLayout'
import VerticalGroup from '../../commons/components/group/verticalGroup'
import RestoreAccount from '../../commons/components/restore-account/restoreAccount'
import { saveAccount, unlockAccount } from '../../commons/entity/account'
import { Context } from '../../ContextProvider'

import './restoreAccount.css'

const RestoreAccountPage = () => {
  const [step, setStep] = useState(1)
  const navigate = useNavigate()
  const { setBtcAddress } = useContext(Context)
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
            Just a sec, we are retoring your account...{' '}
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
