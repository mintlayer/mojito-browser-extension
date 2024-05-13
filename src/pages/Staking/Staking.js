import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'

import { CurrentStaking } from '@ComposedComponents'
import { AccountContext, SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

import './Staking.css'

const StakingPage = () => {
  const { addresses, accountID } = useContext(AccountContext)
  const { networkType } = useContext(SettingsContext)

  const currentMlAddresses =
    networkType === AppInfo.NETWORK_TYPES.MAINNET
      ? addresses.mlMainnetAddresses
      : addresses.mlTestnetAddresses
  const navigate = useNavigate()

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  return (
    <>
      <CurrentStaking addressList={currentMlAddresses} />
    </>
  )
}

export default StakingPage
