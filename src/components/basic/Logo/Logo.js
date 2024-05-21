import { useContext } from 'react'
import { SettingsContext } from '@Contexts'
import LogoIcon from '@Assets/images/logo.svg'
import { AppInfo } from '@Constants'
import './Logo.css'

const Logo = () => {
  const { networkType } = useContext(SettingsContext)

  return (
    <div className="logoContainer">
      <img
        src={LogoIcon}
        alt="Mojito Logo"
        className="logo"
      />
      <h1
        className="mojitoLettering"
        data-testid="logo-name"
      >
        Moji
        {networkType === AppInfo.NETWORK_TYPES.TESTNET ? (
          <span
            className="testnetMark"
            data-testid="testnet-mark"
          >
            t
          </span>
        ) : (
          't'
        )}
        o
      </h1>
      {networkType === AppInfo.NETWORK_TYPES.TESTNET && (
        <div
          className="testnetMessage"
          data-testid="testnet-message"
        >
          testnet
        </div>
      )}
    </div>
  )
}

export default Logo
