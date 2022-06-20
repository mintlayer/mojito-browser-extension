import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Context } from './ContextProvider'

import './app.css'
import Logo from './commons/assets/img/logo96.png'
import CreateRestore from './pages/create-restore'
import { ListAccountsContainer } from './pages/list-accounts'

const App = ({ appHasAccounts }) => {
  const navigate = useNavigate()
  const { isAccountUnlocked } = useContext(Context)
  // eslint-disable-next-line no-constant-condition
  const Home = appHasAccounts ? ListAccountsContainer : CreateRestore

  isAccountUnlocked && navigate('/wallet')

  return (
    !isAccountUnlocked && (
      <>
        <div className="homeLogoContainer">
          <img
            src={Logo}
            alt="Mojito Logo"
            className="logo"
          />
          <h1 className="mojitoLettering">Mojito</h1>
        </div>
        <Home />
      </>
    )
  )
}

export default App
