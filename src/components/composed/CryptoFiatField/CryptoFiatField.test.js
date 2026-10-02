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
