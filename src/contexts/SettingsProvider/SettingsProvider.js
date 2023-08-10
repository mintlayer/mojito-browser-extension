import React, { createContext, useEffect, useState } from 'react'

const SettingsContext = createContext()

const SettingsProvider = ({ value: propValue, children }) => {
  const [networkType, setNetworkType] = useState(
    localStorage.getItem('networkType') || 'mainnet',
  )
  // TODO: Localstorage is being used directly in the Provider. It would be nice to have an Entity for this dataset, as we have for user, and use a Service for LocalStorage as we have for IndexedDB
  useEffect(() => {
    try {
      const storedNetworkType = localStorage.getItem('networkType')
      if (storedNetworkType === null) {
        localStorage.setItem('networkType', 'mainnet')
      } else {
        setNetworkType(storedNetworkType)
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error)
    }
  }, [])

  const toggleNetworkType = () => {
    try {
      const newNetworkType = networkType === 'mainnet' ? 'testnet' : 'mainnet'
      setNetworkType(newNetworkType)
      localStorage.setItem('networkType', newNetworkType)
    } catch (error) {
      console.error('Error accessing localStorage:', error)
    }
  }

  const value = {
    networkType,
    toggleNetworkType,
  }

  return (
    <SettingsContext.Provider value={propValue || value}>
      {children}
    </SettingsContext.Provider>
  )
}

export { SettingsContext, SettingsProvider }
