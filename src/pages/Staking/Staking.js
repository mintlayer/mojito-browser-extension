import { useContext } from 'react'
import { useNavigate } from 'react-router'

import { CurrentStaking } from '@ComposedComponents'
import { AccountContext } from '@Contexts'

import './Staking.css'

const StakingPage = () => {
  const { accountID } = useContext(AccountContext)
  const navigate = useNavigate()

  if (!accountID) {
    console.log('No account id.')
    navigate('/wallet')
    return
  }

  return (
    <div className="staking-page">
      <CurrentStaking />
    </div>
  )
}

export default StakingPage
