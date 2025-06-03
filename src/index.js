/* eslint-disable no-undef */
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
import { ConnectionErrorPopup, Header, PopUp } from '@ComposedComponents'
import { DeleteAccount } from '@ContainerComponents'

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
  LockedBalancePage,
  MessagePage,
  NftPage,
  NftSendPage,
  SignTransactionPage,
} from '@Pages'

import {
  AccountContext,
  AccountProvider,
  SettingsProvider,
  TransactionProvider,
  MintlayerProvider,
  BitcoinProvider,
  ExchangeRatesProvider,
  MintlayerContext,
} from '@Contexts'
import { ML } from '@Cryptos'
import { LocalStorageService } from '@Storage'

import reportWebVitals from './utils/reportWebVitals'

import '@Assets/styles/constants.css'
import '@Assets/styles/index.css'
import { SignChallengePage } from './pages/SignChallenge/SignChallenge'

const root = ReactDOM.createRoot(document.getElementById('root'))

const storage =
  typeof browser !== 'undefined' && browser.storage
    ? browser.storage
    : typeof chrome !== 'undefined' && chrome.storage
      ? chrome.storage
      : null

const runtime =
  typeof browser !== 'undefined' && browser.runtime
    ? browser.runtime
    : typeof chrome !== 'undefined' && chrome.runtime
      ? chrome.runtime
      : null

const App = () => {
  const [errorPopupOpen, setErrorPopupOpen] = useState(false)
  const [unlocked, setUnlocked] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const {
    logout,
    isAccountUnlocked,
    addresses,
    isExtended,
    removeAccountPopupOpen,
    setRemoveAccountPopupOpen,
  } = useContext(AccountContext)
  const { setAllDataFetching } = useContext(MintlayerContext)
  const [nextAfterUnlock, setNextAfterUnlock] = useState(null)
  const [request, setRequest] = useState(null)

  const isConnectionAvailable = async (accountUnlocked) => {
    try {
      const electrumResponse = await Electrum.getLastBlockHash()
      const exchangeResponse = await ExchangeRates.getRate('btc', 'usd')
      return !!electrumResponse && !!exchangeResponse
    } catch (error) {
      if (accountUnlocked) {
        console.log(error)
        setErrorPopupOpen(true)
        setAllDataFetching(false)
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
    setUnlocked(accountUnlocked)
    accountUnlocked && isConnectionAvailable(accountUnlocked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, navigate])

  useEffect(() => {
    if (storage) {
      // Load pending request from storage
      storage.local.get(['pendingRequest'], (data) => {
        if (runtime.lastError) {
          console.error('[Mojito Popup] Storage error:', runtime.lastError)
          return
        }
        const pendingRequest = data.pendingRequest
        if (pendingRequest) {
          setRequest(pendingRequest)
          handlePendingRequest(pendingRequest)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses, isAccountUnlocked, navigate])

  const handlePendingRequest = (pendingRequest) => {
    const { action, origin, requestId } = pendingRequest

    if (action === 'connect') {
      if (!unlocked) {
        setNextAfterUnlock({
          route: '/connect',
          state: { action: 'connect', origin, requestId, request },
        })
        return
      }

      navigate('/connect', {
        state: { action: 'connect', origin, requestId, request },
      })
    }

    if (action === 'signTransaction') {
      if (!unlocked) {
        setNextAfterUnlock({
          route: '/wallet/Mintlayer/sign-transaction',
          state: { action: 'signTransaction', request },
        })
        return
      }
      navigate('/wallet/Mintlayer/sign-transaction', {
        state: { action: 'signTransaction', request },
      })
    }

    if (action === 'signChallenge') {
      if (!unlocked) {
        setNextAfterUnlock({
          route: '/wallet/Mintlayer/sign-challenge',
          state: { action: 'signChallenge', request },
        })
        return
      }
      navigate('/wallet/Mintlayer/sign-challenge', {
        state: { action: 'signChallenge', request },
      })
    }

    if (action === 'createDelegate') {
      if (!unlocked) {
        setNextAfterUnlock({
          route: '/wallet/Mintlayer/staking/create-delegation',
          state: {
            action: 'createDelegate',
            pool_id: request.data.pool_id,
            referral_code: request.data.referral_code || '',
          },
        })
        storage.local.remove('pendingRequest', () => {
          if (runtime.lastError) {
            console.error(
              '[Mojito Popup] Error removing pendingRequest:',
              runtime.lastError,
            )
          }
        })
        return
      }

      navigate('/wallet/Mintlayer/staking/create-delegation', {
        state: {
          action: 'createDelegate',
          pool_id: request.data.pool_id,
          referral_code: request.data.referral_code || '',
        },
      })
      storage.local.remove('pendingRequest', () => {
        if (runtime.lastError) {
          console.error(
            '[Mojito Popup] Error removing pendingRequest:',
            runtime.lastError,
          )
        }
      })
    }
  }

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
      {removeAccountPopupOpen && (
        <PopUp setOpen={setRemoveAccountPopupOpen}>
          <DeleteAccount />
        </PopUp>
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
          element={<SettingsPage unlocked={unlocked} />}
        />
        <Route
          path="/connect"
          element={<ConnectionPage />}
        />
        <Route
          path="/wallet/:coinType/sign-transaction"
          element={<SignTransactionPage />}
        />
        <Route
          path="/wallet/:coinType/sign-challenge"
          element={<SignChallengePage />}
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
          path="/wallet/:coinType/locked-balance"
          element={<LockedBalancePage />}
        />
        <Route
          path="/wallet/:coinType/sign-message"
          element={<MessagePage />}
        />
        <Route
          path="/wallet/:coinType/nft"
          element={<NftPage />}
        />
        <Route
          path="/wallet/:coinType/nft/:tokenId/send"
          element={<NftSendPage />}
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
        <MintlayerProvider>
          <BitcoinProvider>
            <ExchangeRatesProvider>
              <TransactionProvider>
                <MemoryRouter>
                  <App />
                </MemoryRouter>
              </TransactionProvider>
            </ExchangeRatesProvider>
          </BitcoinProvider>
        </MintlayerProvider>
      </SettingsProvider>
    </AccountProvider>
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
