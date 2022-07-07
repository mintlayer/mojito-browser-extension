import React from 'react'
import ReactDOM from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import App from './App'
import SetAccount from './pages/set-account'
import RestoreAccount from './pages/restore-account'
import Wallet from './pages/wallet'
import SetAccountPasswordPage from './pages/list-accounts/set-account-password'
import CreateRestore from './pages/create-restore'

import { ContextProvider } from './ContextProvider'

import reportWebVitals from './commons/utils/reportWebVitals'

import './constants.css'
import './commons/assets/css/index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <ContextProvider>
      <main className="App">
        <MemoryRouter>
          <Routes>
            <Route
              path="/wallet"
              element={<Wallet />}
            />
            <Route
              path="/set-account"
              element={<SetAccount />}
            />
            <Route
              path="/restore-account"
              element={<RestoreAccount />}
            />
            <Route
              path="/wallet"
              element={<Wallet />}
            />
            <Route
              path="/set-account-password"
              element={<SetAccountPasswordPage />}
            />
            <Route
              path="/create-restore"
              element={<CreateRestore />}
            />
            <Route
              exact
              path="/"
              element={<App />}
            />
          </Routes>
        </MemoryRouter>
      </main>
    </ContextProvider>
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
