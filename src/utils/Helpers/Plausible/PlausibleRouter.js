import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import Plausible from 'plausible-tracker'
import { EnvVars } from '@Constants'

const { trackPageview } = Plausible({
  domain: EnvVars.PLAUSIBLE_DOMAIN,
  trackLocalhost: EnvVars.PLAUSIBLE_TRACK_LOCALHOST,
})

const PlausibleRouter = () => {
  const location = useLocation()

  useEffect(() => {
    trackPageview({ url: location.pathname })
  }, [location])

  return null
}

export default PlausibleRouter
