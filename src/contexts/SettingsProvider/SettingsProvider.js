import React, { createContext, useEffect, useState } from 'react'
import { LocalStorageService } from '@Storage'
import { NetworkTypeEntity } from '@Entities'
import { AppInfo } from '@Constants'

const SettingsContext = createContext()

const SettingsProvider = ({ value: propValue, children }) => {
  const [networkType, setNetworkType] = useState(NetworkTypeEntity.get())

  useEffect(() => {
    try {
      const storedNetworkType = LocalStorageService.getItem('networkType')
      if (storedNetworkType === null) {
        NetworkTypeEntity.set(AppInfo.NETWORK_TYPES.MAINNET)
      } else {
        setNetworkType(storedNetworkType)
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error)
    }
  }, [])

  const toggleNetworkType = () => {
    try {
      const newNetworkType =
        networkType === AppInfo.NETWORK_TYPES.MAINNET
          ? AppInfo.NETWORK_TYPES.TESTNET
          : AppInfo.NETWORK_TYPES.MAINNET
      setNetworkType(newNetworkType)
      NetworkTypeEntity.set(newNetworkType)
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
