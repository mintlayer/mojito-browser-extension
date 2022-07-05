import { useContext, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Context } from './ContextProvider'
import { appAccounts } from './commons/utils/appInfo'
import CreateRestore from './pages/create-restore'
import ListAccountsContainer from './pages/list-accounts'
import Logo from './commons/assets/img/logo96.png'

import './app.css'
import Loading from './commons/components/advanced/loading'

const App = () => {
  const effectCalled = useRef(false)
  const [accounts, setAccounts] = useState(null)

  const navigate = useNavigate()
  const { isAccountUnlocked } = useContext(Context)

  isAccountUnlocked && navigate('/wallet')

  useEffect(() => {
    if (effectCalled.current) return
    effectCalled.current = true

    const verifyAccountsExistence = async () => {
      const accountsPresent = await appAccounts()
      setAccounts(
        accountsPresent.map((item) => ({ name: item.name, id: item.id })),
      )
    }
    verifyAccountsExistence()
  }, [])

  const Home = () => {
    if (accounts === null) return <Loading />
    return accounts.length ? (
      <ListAccountsContainer accounts={accounts} />
    ) : (
      <CreateRestore />
    )
  }

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
