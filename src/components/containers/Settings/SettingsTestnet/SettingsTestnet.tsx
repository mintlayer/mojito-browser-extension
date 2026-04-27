import { useContext } from 'react'
import { useNavigate } from 'react-router'

import { AccountContext, MintlayerContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

import styles from './SettingsTestnet.module.css'

const SettingsTestnet = () => {
  const { networkType, toggleNetworkType } = useContext(SettingsContext)
  const { logout } = useContext(AccountContext)
  const { setAllDataFetching } = useContext(MintlayerContext)
  const navigate = useNavigate()

  const isMainnet = networkType === AppInfo.NETWORK_TYPES.MAINNET

  const switchNetwork = (target: string) => {
    if (networkType === target) return
    setAllDataFetching(false)
    toggleNetworkType()
    logout()
    navigate('/')
  }

  return (
    <div
      className={styles.container}
      data-testid="settings-testnet"
    >
      <h2
        className={styles.title}
        data-testid="title"
      >
        Active network
      </h2>
      <div className={styles.switcher}>
        <button
          className={[styles.option, isMainnet && styles.optionActive]
            .filter(Boolean)
            .join(' ')}
          onClick={() => switchNetwork(AppInfo.NETWORK_TYPES.MAINNET)}
          data-testid="toggle"
        >
          Mintlayer Mainnet
        </button>
        <button
          className={[styles.option, !isMainnet && styles.optionActive]
            .filter(Boolean)
            .join(' ')}
          onClick={() => switchNetwork(AppInfo.NETWORK_TYPES.TESTNET)}
          data-testid="toggle"
        >
          Mintlayer Testnet
        </button>
      </div>
    </div>
  )
}

export default SettingsTestnet
