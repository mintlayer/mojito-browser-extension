import LogoMl from '@Assets/images/logo96_white.png'
import './LogoRound.css'

const LogoRound = ({ small }) => {
  return (
    <div
      className={`logo-round ${small ? 'logo-round-small' : ''}`}
      data-testid="logo-round"
    >
      <img
        src={LogoMl}
        alt="Logo"
      />
    </div>
  )
}

export default LogoRound
