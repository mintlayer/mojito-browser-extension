import { Link } from 'react-router-dom'
import './setAccountName.css'

const SetAccountName = () => (
  <div data-testid="set-account-name">
    <h1 className="center-text">Set Account Name</h1>
    <Link to="/" className="back-button"> &lsaquo; </Link>
  </div>
)

export default SetAccountName
