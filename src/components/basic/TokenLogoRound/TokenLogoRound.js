import LogoMl from '@Assets/images/logo96_white.png'
import './TokenLogoRound.css'

const TokenLogoRound = ({ text, small }) => {
  return (
    <div
      className={`token-logo-round ${small ? 'token-logo-round-small' : ''}`}
      data-testid="token-logo-round"
    >
      {text}
      <img
        src={LogoMl}
        alt="Logo"
      />
    </div>
  )
}

export default TokenLogoRound
