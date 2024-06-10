import { useContext } from 'react'
import { Button } from '@BasicComponents'
import { HelpTooltip } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { Wallet } from '@ContainerComponents'
import { useMlWalletInfo } from '@Hooks'
import { ML } from '@Helpers'

import { SettingsContext } from '@Contexts'

import './CurrentStaking.css'
import { useNavigate, useParams } from 'react-router-dom'

const CurrentStaking = ({ addressList }) => {
  const navigate = useNavigate()
  const { coinType } = useParams()
  const { networkType } = useContext(SettingsContext)

  const walletType = {
    name: coinType,
    ticker: coinType === 'Mintlayer' ? 'ML' : 'BTC',
    network: coinType === 'Bitcoin' ? 'bitcoin' : 'mintlayer',
  }

  const { mlDelegationList, mlDelegationsBalance, fetchingDelegations } =
    useMlWalletInfo(addressList)

  const delegationsLoading = fetchingDelegations && mlDelegationList.length === 0
  const onDelegationCreateButtonClick = () => {
    navigate('/wallet/' + walletType.name + '/staking/create-delegation')
  }
  const stakingGuideLink =
    'https://mintlayer.info/en/Guides/Staking/browser-extension'
  const poolListLink =
    networkType === 'testnet'
      ? 'https://lovelace.explorer.mintlayer.org/pools'
      : 'https://explorer.mintlayer.org/pools'

  const decommissionedPools = mlDelegationList.filter(
    (delegation) => delegation.decommissioned && delegation.balance.length > 11,
  )

  const handleScrollToPool = () => {
    const firstDecommissionedPool = mlDelegationList.find(
      (delegation) => delegation.decommissioned === true && delegation.balance.length > 11,
    ).pool_id
    const poolList = document.querySelectorAll(`[data-poolid="${firstDecommissionedPool}"]`)[0]
    poolList.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <VerticalGroup>
      <div className="staking-title-wrapper">
        <div className="main-info">
          <div className="guide-wraper">
            <h1 className="staking-title">Your current staking</h1>
            <HelpTooltip
              message="Staking guide"
              link={stakingGuideLink}
            />
          </div>

          <p className="total-staked">
            Total staked: {ML.getAmountInCoins(mlDelegationsBalance)} ML
          </p>
        </div>
        {decommissionedPools.length > 0 && (
          <div className="delegation-inactive">
            <div onClick={handleScrollToPool} className="warning-inactive">
              Some of your delegations are inactive. {decommissionedPools.length}{' '} pool{decommissionedPools.length > 1?'s are' : ' is'} decommissioned.
            </div>
          </div>
        )}
        <a
          href={poolListLink}
          target="_blank"
        >
          <Button extraStyleClasses={['pool-button']}>Pool list</Button>
        </a>
      </div>

      <Wallet.DelegationList
        delegationsList={mlDelegationList}
        delegationsLoading={delegationsLoading}
      />
      <div className="delegation-button-wrapper">
        <Button
          onClickHandle={onDelegationCreateButtonClick}
          extraStyleClasses={['delegation-button']}
        >
          Create new delegation
        </Button>
      </div>
    </VerticalGroup>
  )
}

export default CurrentStaking
