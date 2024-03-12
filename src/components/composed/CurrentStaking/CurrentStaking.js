import { useContext } from 'react'
import { Button } from '@BasicComponents'
import { VerticalGroup } from '@LayoutComponents'
import { Wallet } from '@ContainerComponents'
import { useMlWalletInfo } from '@Hooks'
import { ML } from '@Helpers'

import { TransactionContext } from '@Contexts'

import './CurrentStaking.css'

const CurrentStaking = ({ addressList }) => {
  const { setDelegationStep } = useContext(TransactionContext)
  const { mlDelegationList, mlDelegationsBalance } =
    useMlWalletInfo(addressList)

  const onNextButtonClick = () => {
    setDelegationStep(2)
  }

  return (
    <VerticalGroup>
      <div className="staking-title-wrapper">
        <h1 className="staking-title">Your current staking</h1>
        <p className="total-staked">
          Total staked: {ML.getAmountInCoins(mlDelegationsBalance)} ML
        </p>
      </div>

      <Wallet.DelegationList delegationsList={mlDelegationList} />
      <div className="delegation-button-wrapper">
        <Button
          onClickHandle={onNextButtonClick}
          extraStyleClasses={['delegation-button']}
        >
          Create new delegation
        </Button>
      </div>
    </VerticalGroup>
  )
}

export default CurrentStaking
