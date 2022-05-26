import { Link } from 'react-router-dom'
import Input from '../../commons/components/basic/input'

import './setAccountName.css'

const SetAccountName = () => (
  <div data-testid="set-account-name">
    <h1 className="center-text">Create a name to your account</h1>
    <Input />
    <Link to="/" className="back-button"> &lsaquo; </Link>
  </div>
)

export default SetAccountName
