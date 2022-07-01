import React, { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Header from '../../commons/components/advanced/header'
import Loading from '../../commons/components/advanced/loading'
import CenteredLayout from '../../commons/components/group/centeredLayout'
import VerticalGroup from '../../commons/components/group/verticalGroup'
import SetAccount from '../../commons/components/set-account/setAccount'
import { saveAccount, unlockAccount } from '../../commons/entity/account'
import loadAccountSubRoutines from '../../commons/entity/loadWorkers'
import { Context } from '../../ContextProvider'

import './setAccount.css'

const SetAccountPage = () => {
  const effectCalled = useRef(false)
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [words, setWords] = useState([])
  const { setBtcAddress } = useContext(Context)
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
    <SetAccount
      step={step}
      setStep={setStep}
      words={words}
      onStepsFinished={createAccount}
    />
  )
}
export default SetAccountPage
