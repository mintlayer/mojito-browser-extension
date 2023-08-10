import { useState, useEffect, useContext } from 'react'
import { SettingsContext, AccountContext } from '@Contexts'
import LogoIcon from '@Assets/images/logo96.png'
import './Logo.css'

const Title = () => {
  const { networkType } = useContext(SettingsContext)
  return (
    <>
      Moji
      {networkType === 'testnet' ? (
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
    </>
  )
}

const Logo = () => {
  const [unlocked, setUnlocked] = useState(false)
  const { networkType } = useContext(SettingsContext)
  const { isAccountUnlocked } = useContext(AccountContext)

  useEffect(() => {
    const accountUnlocked = isAccountUnlocked()
    setUnlocked(accountUnlocked)
  }, [isAccountUnlocked])
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
        {unlocked ? <Title /> : 'Mojito'}
      </h1>
      {unlocked && networkType === 'testnet' && (
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
