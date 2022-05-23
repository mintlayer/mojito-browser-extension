import { Link } from 'react-router-dom'
import Button from '../../commons/components/basic/button'
import TextField from '../../commons/components/form/textField'
import CenteredLayout from '../../commons/components/group/centeredLayout'
import VerticalGroup from '../../commons/components/group/verticalGroup'

import './setAccountPassword.css'

const SetAccountPassword = () => {

  const Label = () => (
    <>Create a password to your <strong>Account</strong></>
  )

  return (
    <div data-testid="set-account-password">
      <h1 className="center-text">Set Account Password</h1>
      <CenteredLayout>
        <VerticalGroup>
          <TextField
            alternate
            password
            placeHolder="Password"
            label={<Label/>}/>

          <Button>
            Continue
          </Button>
        </VerticalGroup>
      </CenteredLayout>
      <Link to="/set-account-name" className="back-button"> &lsaquo; </Link>
    </div>
  )
}
export default SetAccountPassword
