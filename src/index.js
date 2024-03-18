import React, { useState, useEffect, useContext } from 'react'
import ReactDOM from 'react-dom/client'
import {
  MemoryRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from 'react-router-dom'
import { Electrum, ExchangeRates } from '@APIs'
import { ConnectionErrorPopup } from '@ComposedComponents'

/* global chrome */

import {
  HomePage,
  CreateAccountPage,
  RestoreAccountPage,
  WalletPage,
  SetAccountPasswordPage,
  CreateRestorePage,
  SendTransactionPage,
  DashboardPage,
  SettingsPage,
  StakingPage,
} from '@Pages'

import {
  AccountContext,
  AccountProvider,
  SettingsProvider,
  TransactionProvider,
} from '@Contexts'
import { ML } from '@Cryptos'

import reportWebVitals from './utils/reportWebVitals'

import '@Assets/styles/constants.css'
import '@Assets/styles/index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

const App = () => {
  const [errorPopupOpen, setErrorPopupOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, isAccountUnlocked, addresses } = useContext(AccountContext)

  const isConnectionAvailable = async (accountUnlocked) => {
    try {
      const electrumResponse = await Electrum.getLastBlockHash()
      const exchangeResponse = await ExchangeRates.getRate('btc', 'usd')
      return !!electrumResponse && !!exchangeResponse
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
    const asyncInit = async () => {
      await ML.initWasm()
    }
    asyncInit()
  }, [])

  useEffect(() => {
    const accountUnlocked = isAccountUnlocked()
    accountUnlocked && isConnectionAvailable(accountUnlocked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navigate])

  // subscribe to chrome runtime messages
  useEffect(() => {
    const accountUnlocked = isAccountUnlocked()
    const onMessageListener = (request, sender, sendResponse) => {
      if (request.action === 'createDelegate') {
        if (!accountUnlocked) {
          return
        }
        // change route to staking page
        navigate('/staking', {
          state: { action: 'createDelegate', pool_id: request.data.pool_id },
        })
      }

      if (request.action === 'createDelegate') {
        if (!accountUnlocked) {
          return
        }
        // change route to staking page
        navigate('/staking', {
          state: { action: 'createDelegate', pool_id: request.data.pool_id },
        })
      }

      if (request.action === 'getAddresses') {
        // respond with addresses
        sendResponse({
          addresses: {
            mainnet: addresses.mlMainnetAddress,
            testnet: addresses.mlTestnetAddress,
          },
        })
      }
    }
    chrome.runtime.onMessage.addListener(onMessageListener)
    return () => {
      chrome.runtime.onMessage.removeListener(onMessageListener)
    }
  }, [addresses, isAccountUnlocked])

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
          path="/staking"
          element={<StakingPage />}
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
          path="/settings"
          element={<SettingsPage />}
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
      <SettingsProvider>
        <TransactionProvider>
          <MemoryRouter>
            <App />
          </MemoryRouter>
        </TransactionProvider>
      </SettingsProvider>
    </AccountProvider>
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
