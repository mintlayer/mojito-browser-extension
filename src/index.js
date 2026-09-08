import React, { useState, useEffect, useContext } from 'react'
import ReactDOM from 'react-dom/client'
import {
  MemoryRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from 'react-router'
import { Mintlayer, ExchangeRates } from '@APIs'
import {
  ConnectionErrorPopup,
  Header,
  PopUp,
  Sidebar,
} from '@ComposedComponents'
import { BrandPanel, ErrorBoundary } from '@BasicComponents'
import { DeleteAccount } from '@ContainerComponents'
import { Client } from '@mintlayer/sdk'

import {
  HomePage,
  CreateAccountPage,
  RestoreAccountPage,
  SetAccountPasswordPage,
  CreateRestorePage,
  SendBtcTransactionPage,
  SendMlTransactionPage,
  DashboardPage,
  SettingsPage,
  StakePage,
  ConnectionPage,
  CreateDelegationPage,
  DelegationStakePage,
  DelegationWithdrawPage,
  LockedBalancePage,
  MessagePage,
  NftPage,
  NftSendPage,
  SignChallengePage,
  SignInternalTransaction,
  SignExternalTransactionPage,
  OrderSwapPage,
  SignBitcoinTransactionPage,
  ConfirmBtcTransactionPage,
  AddressPage,
  AssetPage,
  ActivityPage,
  ReceivePage,
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
  SettingsContext,
} from '@Contexts'
import { ML } from '@Cryptos'
import { LocalStorageService } from '@Storage'
import { Browser } from '@Browser'

import '@Assets/styles/fonts.css'
import '@Assets/styles/constants.css'
import '@Assets/styles/theme.css'
import '@Assets/styles/index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))

const isExtendedView =
  window.location.href.includes('popup.html') ||
  [':300', ':800'].some((port) => window.location.href.includes(port))

if (isExtendedView) {
  document.documentElement.classList.add('extended-view')
}

const { storage, runtime, windows } = Browser

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
  const { setAllDataFetching, InMemoryAccountProvider, setClient } =
    useContext(MintlayerContext)
  const { networkType } = useContext(SettingsContext)
  const [nextAfterUnlock, setNextAfterUnlock] = useState(null)

  const currentMlAddresses = addresses.mlAddresses

  const isConnectionAvailable = async (accountUnlocked) => {
    try {
      const mintlayerResponse = await Mintlayer.getChainTip()
      const exchangeResponse = await ExchangeRates.getRate('ml', 'usd').catch(
        (error) => {
          console.error('Exchange rates unavailable:', error)
          return null
        },
      )
      return !!mintlayerResponse && !!exchangeResponse
    } catch (error) {
      if (accountUnlocked) {
        console.error('Connection check failed:', error)
        setErrorPopupOpen(true)
        setAllDataFetching(false)
        logout()
        navigate('/')
      }
    }
  }

  useEffect(() => {
    if (currentMlAddresses?.mlReceivingAddresses?.length > 0) {
      const initClient = async () => {
        const clientInstance = await Client.create({
          network: networkType,
          accountProvider: new InMemoryAccountProvider(
            {
              addressesByChain: {
                mintlayer: {
                  receiving: currentMlAddresses.mlReceivingAddresses || [],
                  change: currentMlAddresses.mlChangeAddresses || [],
                },
              },
            },
            navigate,
          ),
        })
        await clientInstance.connect()
        setClient(clientInstance)
      }
      initClient().catch((error) => {
        console.error('Failed to initialize Mintlayer Connect SDK:', error)
      })
    }
  }, [
    currentMlAddresses,
    navigate,
    setClient,
    InMemoryAccountProvider,
    networkType,
  ])

  useEffect(() => {
    const asyncInit = async () => {
      await ML.initWasm()
    }
    asyncInit()
  }, [])

  useEffect(() => {
    const accountUnlocked = isAccountUnlocked(true)
    setUnlocked(accountUnlocked)
    accountUnlocked && isConnectionAvailable(accountUnlocked)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname])

  useEffect(() => {
    let cancelled = false
    if (storage && windows) {
      // Read THIS window's pending request. Approval requests are keyed by
      // window id, so two approval windows can never read (and approve)
      // each other's request.
      windows.getCurrent((win) => {
        if (cancelled || !win) return
        const key = `pendingRequest:${win.id}`
        storage.local.get([key], (data) => {
          if (cancelled) return
          const pendingRequest = data?.[key]
          if (pendingRequest) {
            handlePendingRequest(pendingRequest)
          }
        })
      })
    }
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addresses, isAccountUnlocked, navigate])

  const handlePendingRequest = (pendingRequest) => {
    const { action, origin, requestId } = pendingRequest

    if (action === 'connect') {
      if (!unlocked) {
        setNextAfterUnlock({
          route: '/connect',
          state: {
            action: 'connect',
            origin,
            requestId,
            request: pendingRequest,
          },
        })
        return
      }

      navigate('/connect', {
        state: {
          action: 'connect',
          origin,
          requestId,
          request: pendingRequest,
        },
      })
    }

    if (action === 'signTransaction') {
      if (pendingRequest.data.chain === 'bitcoin') {
        if (!unlocked) {
          setNextAfterUnlock({
            route: '/wallet/Bitcoin/sign-transaction',
            state: { action: 'signTransaction', request: pendingRequest },
          })
          return
        }
        navigate('/wallet/Bitcoin/sign-transaction', {
          state: { action: 'signTransaction', request: pendingRequest },
        })
      } else {
        if (!unlocked) {
          setNextAfterUnlock({
            route: '/wallet/Mintlayer/sign-external-transaction',
            state: { action: 'signTransaction', request: pendingRequest },
          })
          return
        }
        navigate('/wallet/Mintlayer/sign-external-transaction', {
          state: { action: 'signTransaction', request: pendingRequest },
        })
      }
    }

    if (action === 'signChallenge') {
      if (!unlocked) {
        setNextAfterUnlock({
          route: '/wallet/Mintlayer/sign-challenge',
          state: { action: 'signChallenge', request: pendingRequest },
        })
        return
      }
      navigate('/wallet/Mintlayer/sign-challenge', {
        state: { action: 'signChallenge', request: pendingRequest },
      })
    }

    if (action === 'createDelegate') {
      if (!unlocked) {
        setNextAfterUnlock({
          route: '/wallet/Mintlayer/staking/create-delegation',
          state: {
            action: 'createDelegate',
            pool_id: pendingRequest.data.pool_id,
            referral_code: pendingRequest.data.referral_code || '',
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
          pool_id: pendingRequest.data.pool_id,
          referral_code: pendingRequest.data.referral_code || '',
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
    <>
      <Sidebar />
      {!unlocked && <BrandPanel />}
      <div className="app-content">
        <Header />
        <main className="App">
          {errorPopupOpen && (
            <ConnectionErrorPopup onClickHandle={popupButtonClickHandler} />
          )}
          {removeAccountPopupOpen && (
            <PopUp setOpen={setRemoveAccountPopupOpen}>
              <DeleteAccount />
            </PopUp>
          )}
          <ErrorBoundary>
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
                element={
                  <SetAccountPasswordPage nextAfterUnlock={nextAfterUnlock} />
                }
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
                path="/wallet/:coinType/sign-external-transaction"
                element={<SignExternalTransactionPage />}
              />
              <Route
                path="/wallet/Mintlayer/sign-internal-transaction"
                element={<SignInternalTransaction />}
              />
              <Route
                path="/wallet/Bitcoin/sign-transaction"
                element={<SignBitcoinTransactionPage />}
              />
              <Route
                path="/wallet/:coinType/sign-challenge"
                element={<SignChallengePage />}
              />
              <Route
                path="/wallet/:coinType"
                element={
                  <Navigate
                    to="/dashboard"
                    replace
                  />
                }
              />
              <Route
                path="/wallet/:coinType/send-btc-transaction"
                element={<SendBtcTransactionPage />}
              />
              <Route
                path="/wallet/:coinType/send-btc-transaction/confirm"
                element={<ConfirmBtcTransactionPage />}
              />
              <Route
                path="/wallet/:coinType/send-ml-transaction"
                element={<SendMlTransactionPage />}
              />
              <Route
                path="/wallet/:coinType/staking"
                element={
                  <Navigate
                    to="/staking"
                    replace
                  />
                }
              />
              <Route
                path="/staking"
                element={<StakePage />}
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
                path="/wallet/:coinType/order-swap"
                element={<OrderSwapPage />}
              />
              <Route
                path="/"
                element={<HomePage />}
              />
              <Route
                path="/wallet/:coinType/address"
                element={<AddressPage />}
              />
              <Route
                path="/asset/:id"
                element={<AssetPage />}
              />
              <Route
                path="/activity"
                element={<ActivityPage />}
              />
              <Route
                path="/receive"
                element={<ReceivePage />}
              />
              {/* Safety net: unknown routes land on the Dashboard instead of
                rendering a blank panel. */}
              <Route
                path="*"
                element={
                  <Navigate
                    to="/dashboard"
                    replace
                  />
                }
              />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </>
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
