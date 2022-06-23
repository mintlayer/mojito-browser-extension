import React, { useEffect, useRef, useState } from 'react'
import SetAccount from '../../commons/components/set-account/setAccount'
import loadAccountSubRoutines from '../../commons/entity/loadWorkers'

import './setAccount.css'

const SetAccountPage = () => {
  const effectCalled = useRef(false)
  const [step, setStep] = useState(1)
  const [words, setWords] = useState([])

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

  return (
    <SetAccount
      step={step}
      setStep={setStep}
      words={words}
    />
  )
}
export default SetAccountPage
