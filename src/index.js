import React from 'react'
import ReactDOM from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import {
  HomePage,
  CreateAccountPage,
  RestoreAccountPage,
  WalletPage,
  SetAccountPasswordPage,
  CreateRestorePage,
  SendTransactionPage,
} from '@Pages'

import { AccountProvider } from '@Contexts'

import reportWebVitals from './utils/reportWebVitals'

import '@Assets/styles/constants.css'
import '@Assets/styles/index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <AccountProvider>
      <main className="App">
        <MemoryRouter>
          <Routes>
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
        </MemoryRouter>
      </main>
    </AccountProvider>
  </React.StrictMode>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
