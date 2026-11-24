import React, { createContext, useEffect, useState } from 'react'
import { LocalStorageService } from '@Storage'
import { NetworkTypeEntity } from '@Entities'
import { AppInfo } from '@Constants'
import { Browser } from '@Browser'

const SettingsContext = createContext()

const { storage, runtime } = Browser

// The background service worker re-validates every dApp grant against the
// wallet's active network — but an MV3 service worker cannot read this
// page's localStorage. Publish the network value (initial + every toggle)
// to chrome.storage.local so the worker can revoke grants approved on a
// different network and answer connect/checkConnection/getSession honestly.
const publishNetworkType = (networkType) => {
  if (!storage) return

  storage.local.set({ networkType }, () => {
    if (runtime?.lastError) {
      console.error('[Mojito] Storage set error:', runtime.lastError)
    }
  })
}

const SettingsProvider = ({ value: propValue, children }) => {
  const [networkType, setNetworkType] = useState(NetworkTypeEntity.get())

  useEffect(() => {
    try {
      if (!LocalStorageService.getItem('networkType')) {
        NetworkTypeEntity.set(AppInfo.NETWORK_TYPES.MAINNET)
      }
      // Initial publish: an existing install (networkType already in
      // localStorage) publishes its network the first time the UI opens,
      // so the background can re-validate grants from that point on.
      publishNetworkType(NetworkTypeEntity.get())
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
      publishNetworkType(newNetworkType)
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
