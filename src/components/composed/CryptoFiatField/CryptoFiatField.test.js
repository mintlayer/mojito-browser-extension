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
  // const switchButton = screen.getByTestId('crypto-fiat-switch-button')
  // const arrowIcons = screen.getAllByTestId('arrow-icon')
  const actionButton = screen.getByTestId('button')
  const bottomNote = screen.getByTestId('crypto-fiat-bottom-text')

  expect(component).toBeInTheDocument()

  expect(input).toBeInTheDocument()

  fireEvent.change(input, {
    target: { value: maxValueInToken },
  })

  expect(input).toHaveValue(maxValueInToken.toString())
  expect(bottomNote).toHaveTextContent('≈ 10054453,50 USD')

  // expect(switchButton).toBeInTheDocument()
  // expect(arrowIcons).toHaveLength(2)

  expect(actionButton).toBeInTheDocument()
  expect(actionButton).toHaveTextContent(PROPSSAMPLE.buttonTitle)

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

  // const switchButton = screen.getByTestId('crypto-fiat-switch-button')
  const actionButton = screen.getByTestId('button')
  // const bottomNote = screen.getByTestId('crypto-fiat-bottom-text')
  const cryptoInput = screen.getByTestId('input')

  const maxValueInCrypto = maxValueInToken - totalFeeCrypto

  fireEvent.click(actionButton)
  expect(cryptoInput).toHaveValue(maxValueInCrypto.toString().replace('.', ','))

  // fireEvent.click(switchButton)
  // const fiatInput = screen.getByTestId('input')
  // expect(fiatInput).toHaveValue(
  //   getDecimalNumber(maxValueInCrypto * exchangeRate)
  //     .toString()
  //     .replace('.', ','),
  // )

  // expect(bottomNote).toHaveTextContent(
  //   `≈ ${maxValueInCrypto.toString().replace('.', ',')} BTC`,
  // )

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
  // const switchButton = screen.getByTestId('crypto-fiat-switch-button')
  const actionButton = screen.getByTestId('button')
  const bottomNote = screen.getByTestId('crypto-fiat-bottom-text')

  expect(component).toBeInTheDocument()

  expect(input).toBeInTheDocument()

  fireEvent.change(input, {
    target: { value: maxValueInToken },
  })

  expect(input).toHaveValue(maxValueInToken.toString())
  expect(bottomNote).toHaveTextContent('≈ 0,00 USD')

  // expect(switchButton).toBeInTheDocument()

  expect(actionButton).toBeInTheDocument()
  expect(actionButton).toHaveTextContent(PROPSSAMPLE.buttonTitle)

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
