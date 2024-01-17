import LogoMl from '@Assets/images/logo96_white.png'
import './LogoRound.css'

const LogoRound = () => {
  return (
    <div
      className="logo-round"
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
