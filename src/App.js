import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { Context } from './ContextProvider'
import CreateRestore from './pages/create-restore'
import ListAccountsContainer from './pages/list-accounts'
import Logo from './commons/assets/img/logo96.png'

import './app.css'

const App = ({ appHasAccounts }) => {
  const navigate = useNavigate()
  const { isAccountUnlocked } = useContext(Context)
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
