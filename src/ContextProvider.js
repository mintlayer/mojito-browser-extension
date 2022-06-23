import React, { createContext, useState } from 'react'

export const Context = createContext()

export const ContextProvider = ({ children }) => {
  const [btcAddress, setBtcAddress] = useState('')
  const [isAccountUnlocked, unlockAccount] = useState(false)

  const value = {
    btcAddress,
    setBtcAddress,
    isAccountUnlocked,
    unlockAccount,
  }

  return <Context.Provider value={value}>{children}</Context.Provider>
}
