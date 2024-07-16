import { useState, useEffect } from 'react'
import { VerticalGroup } from '@LayoutComponents'

import { EnvVars, AppInfo } from '@Constants'
import { LocalStorageService } from '@Storage'
import SettingsApiItem from './SettingsAPIItem.js'

import './SettingsAPI.css'

const SettingsAPI = () => {
  const [mintlayerTestnetFieldValue, setMintlayerTestnetFieldValue] = useState('')
  const [mintlayerMainnetFieldValue, setMintlayerMainnetFieldValue] = useState('')
  const [bitconinTestnetFieldValue, setBitconinTestnetFieldValue] = useState('')
  const [bitconinMainnetFieldValue, setBitconinMainnetFieldValue] = useState('')
  const [currentServers, setCurrentServers] = useState({})

  const mintlayerDefauldTestnetServer = EnvVars.TESTNET_MINTLAYER_SERVERS
  const mintlayerDefauldMainnetServer = EnvVars.MAINNET_MINTLAYER_SERVERS
  const bitconinDefauldTestnetServer = EnvVars.TESTNET_ELECTRUM_SERVERS
  const bitconinDefauldMainnetServer = EnvVars.MAINNET_ELECTRUM_SERVERS

  useEffect(() => {
    const getCurrentServer = () => {
      const customServersFromStore =
        LocalStorageService.getItem(AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS) ||
        {} // Ensure it's an object even if null/undefined is returned

      const currentServers = {
        mintlayer_testnet:
          customServersFromStore.mintlayer_testnet ||
          mintlayerDefauldTestnetServer,
        mintlayer_mainnet:
          customServersFromStore.mintlayer_mainnet ||
          mintlayerDefauldMainnetServer,
        bitcoin_testnet:
          customServersFromStore.bitcoin_testnet ||
          bitconinDefauldTestnetServer,
        bitcoin_mainnet:
          customServersFromStore.bitcoin_mainnet ||
          bitconinDefauldMainnetServer,
      }

      setCurrentServers(currentServers)
    }
    getCurrentServer()
  }, [bitconinDefauldMainnetServer, bitconinDefauldTestnetServer, mintlayerDefauldMainnetServer, mintlayerDefauldTestnetServer])


  const submitHandler = (data) => {
    const customServersFromStore = LocalStorageService.getItem(
      AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
    )
    const customServers = customServersFromStore ? customServersFromStore : {}
    const key = `${data.wallet}_${data.networkType}`
    customServers[key] = data.data

    LocalStorageService.setItem(
      AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
      customServers,
    )
  }

  const resetHandler = (data) => {
    const customServersFromStore = LocalStorageService.getItem(
      AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
    )
     const key = `${data.wallet}_${data.networkType}`
     const storageKey = customServersFromStore[key]

     if (storageKey) {
       delete customServersFromStore[key]
       LocalStorageService.setItem(
         AppInfo.APP_LOCAL_STORAGE_CUSTOM_SERVERS,
         customServersFromStore,
       )
       setMintlayerTestnetFieldValue('')
        setMintlayerMainnetFieldValue('')
        setBitconinTestnetFieldValue('')
        setBitconinMainnetFieldValue('')
     } else {
       console.log('Invalid wallet or network type.')
     }
  }

  const inputsList = [
    {
      wallet: 'mintlayer',
      networkType: 'testnet',
      cuurrentServer: currentServers.mintlayer_testnet,
      inputValue: mintlayerTestnetFieldValue,
      setInputValue: setMintlayerTestnetFieldValue,
    },
    {
      wallet: 'mintlayer',
      networkType: 'mainnet',
      cuurrentServer: currentServers.mintlayer_mainnet,
      inputValue: mintlayerMainnetFieldValue,
      setInputValue: setMintlayerMainnetFieldValue,
    },
    {
      wallet: 'bitcoin',
      networkType: 'testnet',
      cuurrentServer: currentServers.bitcoin_testnet,
      inputValue: bitconinTestnetFieldValue,
      setInputValue: setBitconinTestnetFieldValue,
    },
    {
      wallet: 'bitcoin',
      networkType: 'mainnet',
      cuurrentServer: currentServers.bitcoin_mainnet,
      inputValue: bitconinMainnetFieldValue,
      setInputValue: setBitconinMainnetFieldValue,
    },
  ]

  return (
    <div
      className="settings-api"
      data-testid="settings-api"
    >
      <div className="api-description">
        <VerticalGroup>
          <h2 data-testid="title">API SERVERS</h2>
          <p>
            Here you can define the API server for each wallet and network type.
            If you leave the field empty, the default server will be used. To
            reset the API server to default, click the reset button.
          </p>
          <p>
            Plese note that the API server is used for the transaction and if
            you are using a custom server, make sure it is a safe and reliable
            server
          </p>
        </VerticalGroup>
      </div>
      {inputsList.map((item, index) => (
        <SettingsApiItem
          key={index}
          walletData={{
            wallet: item.wallet,
            networkType: item.networkType,
            cuurrentServer: item.cuurrentServer,
          }}
          inputValue={item.inputValue}
          setInputValue={item.setInputValue}
          onSubmitClick={submitHandler}
          onResetClick={resetHandler}
        />
      ))}
    </div>
  )
}

export default SettingsAPI
