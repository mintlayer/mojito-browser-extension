import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import Header from '../../components/composed/Header/Header'
import Loading from '../../components/composed/Loading/Loading'
import CenteredLayout from '../../components/layouts/CenteredLayout/CenteredLayout'
import VerticalGroup from '../../components/layouts/VerticalGroup/VerticalGroup'
import CreateAccount from '../../components/containers/CreateAccount/CreateAccount'

import {
  saveAccount,
  unlockAccount,
} from '../../services/Entity/Account/Account'
import loadAccountSubRoutines from '../../services/Entity/Account/loadWorkers'

import { AccountContext } from '../../contexts/AccountProvider/AccountProvider'

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
    saveAccount(accountName, accountPassword, words.join(' '))
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
    />
  )
}
export default CreateAccountPage
