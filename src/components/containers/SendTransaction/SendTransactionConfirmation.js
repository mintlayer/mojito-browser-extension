import { Button } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'

import './SendTransactionConfirmation.css'

const SendFundConfirmation = ({
  address,
  amountInFiat,
  amountInCrypto,
  cryptoName,
  fiatName,
  totalFeeFiat,
  totalFeeCrypto,
  fee,
  onConfirm,
  onCancel,
}) => {
  return (
    <CenteredLayout>
      <dl className="descriptionList">
        <dt>Send to:</dt>
        <dd>
          <strong>{address}</strong>
        </dd>

        <dt>Amount:</dt>
        <dd>
          <strong>{amountInFiat}</strong>
          {fiatName}

          <span>
            (<strong>{amountInCrypto}</strong>
            {cryptoName})
          </span>
        </dd>

        <dt>Total fee:</dt>
        <dd>
          <strong>{totalFeeFiat}</strong>
          {fiatName}

          <span>
            (<strong>{totalFeeCrypto}</strong>
            {cryptoName})
          </span>

          <span>
            (<strong>{fee}</strong>
            sat/B)
          </span>
        </dd>
      </dl>

      <VerticalGroup>
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
