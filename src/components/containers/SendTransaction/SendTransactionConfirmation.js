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
}) => {
  const { networkType } = useContext(SettingsContext)
  const isTestnet = networkType === AppInfo.NETWORK_TYPES.TESTNET
  const amountFiat = isTestnet ? '0,00' : amountInFiat
  const feeFiat = isTestnet ? '0,00' : totalFeeFiat
  return (
    <CenteredLayout>
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
      </dl>

      <VerticalGroup>
        {txErrorMessage ? <Error error={txErrorMessage} /> : <></>}

        <Button onClickHandle={onConfirm}>Confirm</Button>
        <Button
          dark
          onClickHandle={onCancel}
        >
          Cancel
        </Button>
      </VerticalGroup>
    </CenteredLayout>
  )
}

export default SendFundConfirmation
