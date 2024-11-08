import { render, screen, fireEvent } from '@testing-library/react'
// import { getDecimalNumber } from 'src/utils/Helpers/Number/Number'

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
          ,
        </TransactionProvider>
      </SettingsProvider>
      ,
    </AccountProvider>,
  )

  const component = screen.getByTestId('crypto-fiat-field')
  const input = screen.getByTestId('input')

  // TODO: revert this after max button is implemented
  // const actionButton = screen.getByTestId('button')
  const bottomNote = screen.getByTestId('crypto-fiat-bottom-text')

  expect(component).toBeInTheDocument()

  expect(input).toBeInTheDocument()

  fireEvent.change(input, {
    target: { value: maxValueInToken },
  })

  expect(input).toHaveValue(maxValueInToken.toString())
  expect(bottomNote).toHaveTextContent('≈ 10054453.50 USD')

  // TODO: revert this after max button is implemented
  // expect(actionButton).toBeInTheDocument()
  // expect(actionButton).toHaveTextContent(PROPSSAMPLE.buttonTitle)

  expect(bottomNote).toBeInTheDocument()
})

test('Render TextField component fdf', async () => {
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
            setErrorMessage={() => {}}
            setAmountValidity={() => {}}
            totalFeeInCrypto={totalFeeCrypto}
          />
          ,
        </TransactionProvider>
      </SettingsProvider>
    </AccountProvider>,
  )

  // TODO: revert this after max button is implemented
  // const actionButton = screen.getByTestId('button')

  const cryptoInput = screen.getByTestId('input')

  // TODO: revert this after max button is implemented
  // const maxValueInCrypto = maxValueInToken - totalFeeCrypto
  // fireEvent.click(actionButton)
  // expect(cryptoInput).toHaveValue(maxValueInCrypto.toString())

  fireEvent.change(cryptoInput, { target: { value: '' } })
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
          ,
        </TransactionProvider>
      </SettingsProvider>
      ,
    </AccountProvider>,
  )

  const component = screen.getByTestId('crypto-fiat-field')
  const input = screen.getByTestId('input')
  // TODO: revert this after max button is implemented
  // const actionButton = screen.getByTestId('button')
  const bottomNote = screen.getByTestId('crypto-fiat-bottom-text')

  expect(component).toBeInTheDocument()

  expect(input).toBeInTheDocument()

  fireEvent.change(input, {
    target: { value: maxValueInToken },
  })

  expect(input).toHaveValue(maxValueInToken.toString())
  expect(bottomNote).toHaveTextContent('≈ 0.00 USD')

  // TODO: revert this after max button is implemented
  // expect(actionButton).toBeInTheDocument()
  // expect(actionButton).toHaveTextContent(PROPSSAMPLE.buttonTitle)

  expect(bottomNote).toBeInTheDocument()
})

test('Render TextField component without transactionData', () => {
  render(
    <AccountProvider>
      <SettingsProvider>
        <TransactionProvider>
          <CryptoFiatField setAmountValidity={() => {}} />,
        </TransactionProvider>
      </SettingsProvider>
    </AccountProvider>,
  )

  expect(screen.queryByTestId('crypto-fiat-field')).not.toBeInTheDocument()
})
