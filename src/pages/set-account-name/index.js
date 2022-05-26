import { Link } from 'react-router-dom'
import ProgressTracker from '../../commons/components/advanced/progressTracker'
import Input from '../../commons/components/basic/input'

import './setAccountName.css'

const SetAccountName = () => {
  const steps = [
    { name: 'Account Name' },
    { name: 'Setting Password', active: true  },
    { name: 'Restoring Information' },
  ]

  return (
    <div data-testid="set-account-name">
      <h1 className="center-text">Set Account Name</h1>
      <ProgressTracker steps={steps}/>
      <Input />
      <Link to="/" className="back-button"> &lsaquo; </Link>
    </div>
  )
}

export default SetAccountName
