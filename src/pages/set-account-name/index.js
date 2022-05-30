import React from 'react'
import { useNavigate } from 'react-router-dom'

import ProgressTracker from '../../commons/components/advanced/progressTracker'
import Header from '../../commons/components/advanced/header'
import Button from '../../commons/components/basic/button'
import TextField from '../../commons/components/basic/textField'
import CenteredLayout from '../../commons/components/group/centeredLayout'
import VerticalGroup from '../../commons/components/group/verticalGroup'

import './setAccountName.css'

const steps = [
  { name: 'Account Name', active: true },
  { name: 'Setting Password' },
  { name: 'Restoring Information' },
]

const SetAccountName = () => {
  const navigate = useNavigate()

  const goToSetAccountPasswordPage = () => navigate('/set-account-password')

  return (
    <div data-testid="set-account-name">
      <Header />
      <h1 className="center-text">Set Account Name</h1>
      <ProgressTracker steps={steps} />
      <CenteredLayout>
        <VerticalGroup>
          <TextField
            alternate
            placeHolder="Account Name"
            label="Create a name to your account"
          />

          <Button onClickHandle={goToSetAccountPasswordPage}>Continue</Button>
        </VerticalGroup>
      </CenteredLayout>
    </div>
  )
}

export default SetAccountName
