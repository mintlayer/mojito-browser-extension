import { useContext } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { Header, CurrentStaking } from '@ComposedComponents'
import { AccountContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

import './Staking.css'

const StakingPage = () => {
  const { coinType } = useParams()
  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddress
      : addresses.mlTestnetAddresses
  const navigate = useNavigate()

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  const backToWallet = () => {
    navigate('/wallet/' + coinType)
  }

  return (
    <>
      <Header customBackAction={backToWallet} />
      <CurrentStaking addressList={currentMlAddresses} />
    </>
  )
}

export default StakingPage
