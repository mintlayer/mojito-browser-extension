import React, { useState } from 'react'
import SetAccount from '../../commons/components/set-account/setAccount'

import './setAccount.css'

const SetAccountPage = () => {
  const [step, setStep] = useState(1)
  const WORDS = ['car', 'house', 'cat']

  return (
    <SetAccount
      step={step}
      setStep={setStep}
      words={WORDS}
    />
  )
}
export default SetAccountPage
