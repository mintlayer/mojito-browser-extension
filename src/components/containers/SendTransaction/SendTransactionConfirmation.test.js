import { render, screen, fireEvent } from '@testing-library/react'

import SendFundConfirmation from './SendTransactionConfirmation'
import { SettingsProvider, AccountProvider } from '@Contexts'

const _data = {
  address: '43c5n73485v73894cm43mr98',
  amountInFiat: 888888.88,
  amountInCrypto: 12.24983,
  cryptoName: 'BTC',
  fiatName: 'USD',
  totalFeeFiat: '1.20',
  totalFeeCrypto: '0.00000456',
  fee: 2,
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
  walletType: {
    name: 'Bitcoin',
    ticker: 'BTC',
    chain: 'bitcoin',
    tokenId: null,
  }
}

const setup = ({ data = _data } = {}) => {
  render(
    <AccountProvider>
      <SettingsProvider>
        <SendFundConfirmation {...data} />
      </SettingsProvider>
    </AccountProvider>,
  )
  const address = screen.getByText(data.address)
  const amountInFiat = screen.getByText(data.amountInFiat)
  const amountInCrypto = screen.getByText(data.amountInCrypto)
  const totalFeeFiat = screen.getByText(data.totalFeeFiat)
  const totalFeeCrypto = screen.getByText(data.totalFeeCrypto)
  const fee = screen.getByText(data.fee)
  const confirmButton = screen.getByText('Confirm')
  const cancelButton = screen.getByText('Cancel')

  return {
    address,
    amountInFiat,
    amountInCrypto,
    totalFeeFiat,
    totalFeeCrypto,
    fee,
    confirmButton,
    cancelButton,
  }
}

test('Renders SendFundConfirmation page', () => {
  const {
    address,
    amountInFiat,
    amountInCrypto,
    totalFeeFiat,
    totalFeeCrypto,
    fee,
    confirmButton,
    cancelButton,
  } = setup()

  expect(address).toBeInTheDocument()
  expect(amountInFiat).toBeInTheDocument()
  expect(amountInCrypto).toBeInTheDocument()
  expect(totalFeeFiat).toBeInTheDocument()
  expect(totalFeeCrypto).toBeInTheDocument()
  expect(fee).toBeInTheDocument()
  expect(confirmButton).toBeInTheDocument()
  expect(cancelButton).toBeInTheDocument()
})

test('Renders SendFundConfirmation and confirm', async () => {
  const { confirmButton } = setup()

  fireEvent.click(confirmButton)
  expect(_data.onConfirm).toBeCalled()
  expect(_data.onCancel).not.toBeCalled()
})

test('Renders SendFundConfirmation and cancel', async () => {
  const { cancelButton } = setup()

  fireEvent.click(cancelButton)
  expect(_data.onConfirm).not.toBeCalled()
  expect(_data.onCancel).toBeCalled()
})
