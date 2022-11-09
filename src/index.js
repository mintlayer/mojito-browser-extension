import React, { useState, useEffect, useContext } from 'react'
import ReactDOM from 'react-dom/client'
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { Electrum } from '@APIs'
import { AccountContext } from '@Contexts'
import { ConnectionErrorPopup } from '@ComposedComponents'

import {
  HomePage,
  CreateAccountPage,
  RestoreAccountPage,
  WalletPage,
  SetAccountPasswordPage,
  CreateRestorePage,
  SendTransactionPage,
  DashboardPage,
} from '@Pages'

import { AccountProvider } from '@Contexts'

import reportWebVitals from './utils/reportWebVitals'

import '@Assets/styles/constants.css'
import '@Assets/styles/index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

const App = () => {
  const [errorPopupOpen, setErrorPopupOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, isAccountUnlocked } = useContext(AccountContext)

  const isElectrumConnected = async (accountUnlocked) => {
    try {
      const response = await Electrum.getLastBlockHash()
      return response
    } catch (error) {
      if (accountUnlocked) {
        console.log(error)
        setErrorPopupOpen(true)
        logout()
        navigate('/')
      }
    }
  }

  useEffect(() => {
    const accountUnlocked = isAccountUnlocked()
    accountUnlocked && isElectrumConnected(accountUnlocked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navigate])

  const popupButtonClickHandler = () => {
    setErrorPopupOpen(false)
  }

  return (
    <main className="App">
      {errorPopupOpen && (
        <ConnectionErrorPopup onClickHandle={popupButtonClickHandler} />
      )}
      <Routes>
        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />
        <Route
          path="/set-account"
          element={<CreateAccountPage />}
        />
        <Route
          path="/restore-account"
          element={<RestoreAccountPage />}
        />
        <Route
          path="/send-transaction"
          element={<SendTransactionPage />}
        />
        <Route
          path="/wallet"
          element={<WalletPage />}
        />
        <Route
          path="/set-account-password"
          element={<SetAccountPasswordPage />}
        />
        <Route
          path="/create-restore"
          element={<CreateRestorePage />}
        />
        <Route
          exact
          path="/"
          element={<HomePage />}
        />
      </Routes>
    </main>
  )
}

root.render(
  <React.StrictMode>
    <AccountProvider>
      <MemoryRouter>
        <App />
      </MemoryRouter>
    </AccountProvider>
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
