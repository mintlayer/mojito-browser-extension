import { Link } from 'react-router-dom'

const CreateRestore = () => (
  <div data-testid="create-restore">
    <h1>Create or Restore Account</h1>
    <Link to="/set-account-name">Create an account</Link>
  </div>
)

export default CreateRestore
