import { ReactComponent as LogoBTC } from '@Assets/images/btc-logo.svg'
import { ReactComponent as LogoML } from '@Assets/images/logo.svg'

// Pure constants (no JSX) live in AppInfoCore — see the note there.
export * from './AppInfoCore'

const walletTypes = [
  {
    name: 'Bitcoin',
    symbol: 'BTC',
    value: 'btc',
    icon: <LogoBTC />,
  },
  {
    name: 'Mintlayer',
    symbol: 'ML',
    value: 'ml',
    icon: <LogoML />,
  },
]

export { walletTypes }
