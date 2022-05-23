import React from 'react'
import ReactDOM from 'react-dom/client'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

import App from './App'
import SetAccountName from './pages/set-account-name'
import SetAccountPassword from './pages/set-account-password'

import { appHasAccounts } from './commons/utils/appInfo'
import reportWebVitals from './commons/utils/reportWebVitals'

import './constants.css'
import './commons/assets/css/index.css'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <main className="App">
      <MemoryRouter>
        <Routes>
          <Route path="/set-account-password" element={<SetAccountPassword />} />
          <Route path="/set-account-name" element={<SetAccountName />} />
          <Route exact path="/" element={<App appHasAccounts={appHasAccounts()} />} />
        </Routes>
      </MemoryRouter>
    </main>
  </React.StrictMode>
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
