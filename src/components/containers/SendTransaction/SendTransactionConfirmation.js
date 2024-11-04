import React, { useContext } from 'react'
import { Button, Error } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'
import { SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

import './SendTransactionConfirmation.css'

const SendFundConfirmation = ({
  address,
  amountInFiat,
  amountInCrypto,
  cryptoName,
  fiatName,
  txErrorMessage,
  totalFeeFiat,
  totalFeeCrypto,
  fee,
  onConfirm,
  onCancel,
  walletType,
  poolData,
}) => {
  const { networkType } = useContext(SettingsContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET
  const amountFiat = isTestnet ? '0,00' : amountInFiat
  const feeFiat = isTestnet ? '0,00' : totalFeeFiat

  const isLowReward =
    (poolData &&
      poolData[0].cost_per_block.decimal >
        AppInfo.APPROPRIATE_COST_PER_BLOCK) ||
    (poolData &&
      parseFloat(poolData[0].margin_ratio_per_thousand) >
        AppInfo.APPROPRIATE_MARGIN_RATIO_PER_THOUSAND)
  const rewardMessage =
    'The pool you are using has a high cost per block and/or margin ratio. This may result in lower rewards.'

  return (
    <CenteredLayout>
      <VerticalGroup>
        <dl className="descriptionList">
          <dt>Send to:</dt>
          <dd>
            <strong>{address}</strong>
          </dd>

          <dt>Amount:</dt>
          <dd>
            <strong>{amountInCrypto}</strong>
            {cryptoName}

            <span>
              (<strong>{amountFiat}</strong>
              {fiatName})
            </span>
          </dd>

          <dt>Total fee:</dt>
          <dd>
            <strong>{totalFeeCrypto}</strong>
            {walletType.name === 'Bitcoin' ? 'BTC' : 'ML'}
            <span>
              (<strong>{feeFiat}</strong>
              {fiatName})
            </span>
            {walletType.name !== 'Mintlayer' && (
              <span>
                (<strong>{fee}</strong>
                sat/B)
              </span>
            )}
          </dd>
          {poolData && isLowReward && (
            <dd className="pool-note-message">Please note: {rewardMessage}</dd>
          )}
        </dl>
        {txErrorMessage ? <Error error={txErrorMessage} /> : <></>}

        <CenteredLayout>
          <Button onClickHandle={onCancel}>Cancel</Button>
          <Button onClickHandle={onConfirm}>Confirm</Button>
        </CenteredLayout>
      </VerticalGroup>
    </CenteredLayout>
  )
}

export default SendFundConfirmation
