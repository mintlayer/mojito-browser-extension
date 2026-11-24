import { render, screen, fireEvent } from '@testing-library/react'

import CryptoFiatField from './CryptoFiatField'
import {
  SettingsProvider,
  AccountProvider,
  TransactionProvider,
} from '@Contexts'

const TRANSACTIONDATASAMPLE = {
  fiatName: 'USD',
  tokenName: 'BTC',
}

const PROPSSAMPLE = {
  buttonTitle: 'Button title',
  placeholder: 'Placeholder',
  value: '',
  transactionData: TRANSACTIONDATASAMPLE,
}

const [exchangeRate, maxValueInToken, totalFeeCrypto] = [22343.23, 450, 0.00045]

test('Render TextField component', () => {
  render(
    <AccountProvider>
      <SettingsProvider value={{ networkType: 'mainnet' }}>
        <TransactionProvider>
          <CryptoFiatField
            buttonTitle={PROPSSAMPLE.buttonTitle}
            placeholder={PROPSSAMPLE.placeholder}
            inputValue={PROPSSAMPLE.value}
            transactionData={PROPSSAMPLE.transactionData}
            exchangeRate={exchangeRate}
            maxValueInToken={maxValueInToken}
            setAmountValidity={() => {}}
            totalFeeInCrypto={totalFeeCrypto}
          />
        </TransactionProvider>
      </SettingsProvider>
    </AccountProvider>,
  )

  const component = screen.getByTestId('crypto-fiat-field')
  const input = screen.getByTestId('input')
  const bottomNote = screen.getByTestId('crypto-fiat-bottom-text')

  expect(component).toBeInTheDocument()
  expect(input).toBeInTheDocument()
  expect(bottomNote).toBeInTheDocument()
  expect(bottomNote).toHaveTextContent('Available to spend')

  fireEvent.change(input, {
    target: { value: maxValueInToken },
  })

  expect(input).toHaveValue(maxValueInToken.toString())
})

test('Render TextField component fdf', async () => {
  const mockSetAmountValidity = jest.fn()
  const mockSetErrorMessage = jest.fn()

  render(
    <AccountProvider>
      <SettingsProvider>
        <TransactionProvider>
          <CryptoFiatField
            label={PROPSSAMPLE.label}
            buttonTitle={PROPSSAMPLE.buttonTitle}
            placeholder={PROPSSAMPLE.placeholder}
            inputValue={PROPSSAMPLE.value}
            transactionData={PROPSSAMPLE.transactionData}
            exchangeRate={exchangeRate}
            maxValueInToken={maxValueInToken}
            setErrorMessage={mockSetErrorMessage}
            setAmountValidity={mockSetAmountValidity}
            totalFeeInCrypto={totalFeeCrypto}
          />
        </TransactionProvider>
      </SettingsProvider>
    </AccountProvider>,
  )

  const cryptoInput = screen.getByTestId('input')

  // enter a value first so clearing it actually fires a change event
  fireEvent.change(cryptoInput, { target: { value: '1' } })
  fireEvent.change(cryptoInput, { target: { value: '' } })

  expect(mockSetAmountValidity).toHaveBeenLastCalledWith(false)
  expect(mockSetErrorMessage).toHaveBeenLastCalledWith(
    'Amount must be greater than 0.',
  )
})

test('Render TextField when networkType is testnet', () => {
  render(
    <AccountProvider>
      <SettingsProvider value={{ networkType: 'testnet' }}>
        <TransactionProvider>
          <CryptoFiatField
            buttonTitle={PROPSSAMPLE.buttonTitle}
            placeholder={PROPSSAMPLE.placeholder}
            inputValue={PROPSSAMPLE.value}
            transactionData={PROPSSAMPLE.transactionData}
            exchangeRate={exchangeRate}
            maxValueInToken={maxValueInToken}
            setAmountValidity={() => {}}
            totalFeeInCrypto={totalFeeCrypto}
          />
        </TransactionProvider>
      </SettingsProvider>
    </AccountProvider>,
  )

  const component = screen.getByTestId('crypto-fiat-field')
  const input = screen.getByTestId('input')
  const bottomNote = screen.getByTestId('crypto-fiat-bottom-text')

  expect(component).toBeInTheDocument()
  expect(input).toBeInTheDocument()
  expect(bottomNote).toBeInTheDocument()
  expect(bottomNote).toHaveTextContent('Available to spend')

  fireEvent.change(input, {
    target: { value: maxValueInToken },
  })

  expect(input).toHaveValue(maxValueInToken.toString())
})

test('Render TextField component without transactionData', () => {
  render(
    <AccountProvider>
      <SettingsProvider>
        <TransactionProvider>
          <CryptoFiatField setAmountValidity={() => {}} />
        </TransactionProvider>
      </SettingsProvider>
    </AccountProvider>,
  )

  expect(screen.queryByTestId('crypto-fiat-field')).not.toBeInTheDocument()
})

// Token sends pay the network fee in ML coins: the fee must never be
// subtracted from the token-unit balance (mirror of the send-form gate).
test('token send keeps the full token balance as the spendable max', () => {
  const mockSetAmountValidity = jest.fn()

  render(
    <AccountProvider>
      <SettingsProvider>
        <TransactionProvider>
          <CryptoFiatField
            buttonTitle={PROPSSAMPLE.buttonTitle}
            placeholder={PROPSSAMPLE.placeholder}
            inputValue={PROPSSAMPLE.value}
            transactionData={{ fiatName: 'USD', tokenName: 'TKN' }}
            maxValueInToken={1000000}
            setAmountValidity={mockSetAmountValidity}
            totalFeeInCrypto={0.1}
            feeCurrencyDiffers
          />
        </TransactionProvider>
      </SettingsProvider>
    </AccountProvider>,
  )

  const input = screen.getByTestId('input')

  // 1,000,000 TKN with a 0.1 ML fee: valid, because the fee is not paid
  // from the token balance.
  fireEvent.change(input, { target: { value: '1000000' } })

  expect(mockSetAmountValidity).toHaveBeenLastCalledWith(true)
  expect(
    screen.queryByText('Amount set is bigger than this wallet balance.'),
  ).not.toBeInTheDocument()

  // The spendable note shows the token balance without a fee subtraction.
  expect(screen.getByTestId('crypto-fiat-bottom-text')).toHaveTextContent(
    /1000000 TKN/,
  )
})

test('coin send still reserves the fee from the same-unit balance', () => {
  const mockSetAmountValidity = jest.fn()
  const mockSetErrorMessage = jest.fn()

  render(
    <AccountProvider>
      <SettingsProvider>
        <TransactionProvider>
          <CryptoFiatField
            buttonTitle={PROPSSAMPLE.buttonTitle}
            placeholder={PROPSSAMPLE.placeholder}
            inputValue={PROPSSAMPLE.value}
            transactionData={{ fiatName: 'USD', tokenName: 'ML' }}
            maxValueInToken={10}
            setAmountValidity={mockSetAmountValidity}
            setErrorMessage={mockSetErrorMessage}
            totalFeeInCrypto={1}
          />
        </TransactionProvider>
      </SettingsProvider>
    </AccountProvider>,
  )

  const input = screen.getByTestId('input')

  // 10 with a 1 ML fee exceeds the fee-subtracted max of 9: blocked.
  fireEvent.change(input, { target: { value: '10' } })

  expect(mockSetAmountValidity).toHaveBeenLastCalledWith(false)
  expect(mockSetErrorMessage).toHaveBeenLastCalledWith(
    'Amount set is bigger than this wallet balance.',
  )
  expect(screen.getByTestId('crypto-fiat-bottom-text')).toHaveTextContent(
    '9.00000 ML',
  )

  // 9 stays within the fee-subtracted max: valid.
  fireEvent.change(input, { target: { value: '9' } })

  expect(mockSetAmountValidity).toHaveBeenLastCalledWith(true)
})
