import React, { useState } from 'react'
import RestoreAccount from '../../commons/components/restore-account/restoreAccount'

import './restoreAccount.css'

const RestoreAccountPage = () => {
  const [step, setStep] = useState(1)
  const WORDS = ['car', 'house', 'cat']

  return (
    <RestoreAccount
      step={step}
      setStep={setStep}
      words={WORDS}
    />
  )
}
export default RestoreAccountPage
