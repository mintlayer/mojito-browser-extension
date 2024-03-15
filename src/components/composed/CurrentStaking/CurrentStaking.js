import { useContext } from 'react'
import { Button } from '@BasicComponents'
import { HelpTooltip } from '@ComposedComponents'
import { VerticalGroup } from '@LayoutComponents'
import { Wallet } from '@ContainerComponents'
import { useMlWalletInfo } from '@Hooks'
import { ML } from '@Helpers'

import { TransactionContext, SettingsContext } from '@Contexts'

import './CurrentStaking.css'

const CurrentStaking = ({ addressList }) => {
  const { networkType } = useContext(SettingsContext)
  const { setDelegationStep } = useContext(TransactionContext)
  const { mlDelegationList, mlDelegationsBalance } =
    useMlWalletInfo(addressList)

  const onNextButtonClick = () => {
    setDelegationStep(2)
  }
  const stakingGuideLink =
    'https://mintlayer.info/en/Guides/Staking/browser-extension'
  const poolListLink =
    networkType === 'testnet'
      ? 'https://lovelace.explorer.mintlayer.org/pools'
      : 'https://explorer.mintlayer.org/pools'

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
        <a
          href={poolListLink}
          target="_blank"
        >
          <Button extraStyleClasses={['pool-button']}>Pool list</Button>
        </a>
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
