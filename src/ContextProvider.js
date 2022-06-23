import React, { createContext, useState } from 'react'

export const Context = createContext()

export const ContextProvider = ({ children }) => {
  const [btcAddress, setBtcAddress] = useState('')

  const value = {
    btcAddress,
    setBtcAddress,
  }

  return (
    <Context.Provider value={value}>
      {children}
    </Context.Provider>
  )
}
