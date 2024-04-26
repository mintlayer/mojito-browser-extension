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

  const { mlDelegationList, mlDelegationsBalance } =
    useMlWalletInfo(addressList)

  const onDelegationCreateButtonClick = () => {
    navigate('/wallet/' + walletType.name + '/staking/create-delegation')
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
