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
import { ConnectionErrorPopup, Header } from '@ComposedComponents'

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
  ConnectionPage,
  CreateDelegationPage,
  DelegationStakePage,
  DelegationWithdrawPage,
} from '@Pages'

import {
  AccountContext,
  AccountProvider,
  SettingsProvider,
  TransactionProvider,
  NetworkProvider,
  ExchangeRatesProvider,
} from '@Contexts'
import { ML } from '@Cryptos'
import { LocalStorageService } from '@Storage'

import reportWebVitals from './utils/reportWebVitals'

import '@Assets/styles/constants.css'
import '@Assets/styles/index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

const App = () => {
  const [errorPopupOpen, setErrorPopupOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { logout, isAccountUnlocked, addresses, isExtended } =
    useContext(AccountContext)
  const [nextAfterUnlock, setNextAfterUnlock] = useState(null)

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
    try {
      const browser = require('webextension-polyfill')
      const accountUnlocked = isAccountUnlocked()
      const onMessageListener = (request, sender, sendResponse) => {
        if (request.action === 'connect') {
          if (!accountUnlocked) {
            setNextAfterUnlock({ route: '/connect' })
            return
          }
          sendResponse({ connected: true })
          // change route to staking page
          navigate('/connect')
        }

        if (request.action === 'createDelegate') {
          if (!accountUnlocked) {
            setNextAfterUnlock({
              route: '/wallet/Mintlayer/staking/create-delegation',
              state: {
                action: 'createDelegate',
                pool_id: request.data.pool_id,
              },
            })
            return
          }
          // change route to staking page
          navigate('/wallet/Mintlayer/staking/create-delegation', {
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
      browser.runtime.onMessage.addListener(onMessageListener)
      return () => {
        browser.runtime.onMessage.removeListener(onMessageListener)
      }
    } catch (e) {
      if (
        e.message ===
        'This script should only be loaded in a browser extension.'
      ) {
        // not extension env
        return
      }
      // other error throw further
      throw e
    }
  }, [addresses, isAccountUnlocked, navigate])

  useEffect(() => {
    const extendPath = LocalStorageService.getItem('extendPath')
    if (isExtended && extendPath) {
      navigate(extendPath)
      LocalStorageService.removeItem('extendPath')
    }
  }, [isExtended, navigate])

  const popupButtonClickHandler = () => {
    setErrorPopupOpen(false)
  }

  return (
    <main className="App">
      <Header />
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
          path="/set-account-password"
          element={<SetAccountPasswordPage nextAfterUnlock={nextAfterUnlock} />}
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
          path="/connect"
          element={<ConnectionPage />}
        />
        <Route
          path="/wallet/:coinType"
          element={<WalletPage />}
        />
        <Route
          path="/wallet/:coinType/send-transaction"
          element={<SendTransactionPage />}
        />
        <Route
          path="/wallet/:coinType/staking"
          element={<StakingPage />}
        />
        <Route
          path="/wallet/:coinType/staking/:delegationId/add-funds"
          element={<DelegationStakePage />}
        />
        <Route
          path="/wallet/:coinType/staking/:delegationId/withdraw"
          element={<DelegationWithdrawPage />}
        />
        <Route
          path="/wallet/:coinType/staking/create-delegation"
          element={<CreateDelegationPage />}
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
        <NetworkProvider>
          <ExchangeRatesProvider>
            <TransactionProvider>
              <MemoryRouter>
                <App />
              </MemoryRouter>
            </TransactionProvider>
          </ExchangeRatesProvider>
        </NetworkProvider>
      </SettingsProvider>
    </AccountProvider>
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
