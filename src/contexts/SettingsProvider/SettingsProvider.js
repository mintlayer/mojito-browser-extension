import React, { createContext, useEffect, useState } from 'react'
import { LocalStorageService } from '@Storage'
import { NetworkTypeEntity } from '@Entities'
import { AppInfo } from '@Constants'

const SettingsContext = createContext()

const SettingsProvider = ({ value: propValue, children }) => {
  const [networkType, setNetworkType] = useState(NetworkTypeEntity.get())
  const [restoreBtcMode, setRestoreBtcMode] = useState(
    LocalStorageService.getItem('restoreBtcMode') || false,
  )

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

  // TODO: This has been made to let users restore their btc wallet with old incorrect path
  useEffect(() => {
    try {
      const storedRestoreBtcMode = LocalStorageService.getItem('restoreBtcMode')
      if (storedRestoreBtcMode === null) {
        LocalStorageService.setItem('restoreBtcMode', false)
      } else {
        setRestoreBtcMode(storedRestoreBtcMode)
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error)
    }
  }, [])

  const toggleRestoreBtcMode = () => {
    try {
      const newRestoreBtcMode = !restoreBtcMode
      setRestoreBtcMode(newRestoreBtcMode)
      LocalStorageService.setItem('restoreBtcMode', newRestoreBtcMode)
    } catch (error) {
      console.error('Error accessing localStorage:', error)
    }
  }
  // ----------------------------------------------------------------------------

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
    restoreBtcMode,
    toggleRestoreBtcMode,
  }

  return (
    <SettingsContext.Provider value={propValue || value}>
      {children}
    </SettingsContext.Provider>
  )
}

export { SettingsContext, SettingsProvider }
