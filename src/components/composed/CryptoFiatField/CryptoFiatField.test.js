import { render, screen, fireEvent } from '@testing-library/react'

import CryptoFiatField from './CryptoFiatField'

const TRANSACTIONDATASAMPLE = {
  fiatName: 'USD',
  tokenName: 'BTC',
  exchangeRate: 22343.23,
  maxValueInToken: 450,
}

const PROPSSAMPLE = {
  buttonTitle: 'Button title',
  placeholder: 'Placeholder',
  value: '',
  transactionData: TRANSACTIONDATASAMPLE,
}

test('Render TextField component', () => {
  render(
    <CryptoFiatField
      buttonTitle={PROPSSAMPLE.buttonTitle}
      placeholder={PROPSSAMPLE.placeholder}
      inputValue={PROPSSAMPLE.value}
      transactionData={PROPSSAMPLE.transactionData}
    />,
  )

  const component = screen.getByTestId('crypto-fiat-field')
  const input = screen.getByTestId('input')
  const switchButton = screen.getByTestId('crypto-fiat-switch-button')
  const arrowIcons = screen.getAllByTestId('arrow-icon')
  const actionButton = screen.getByTestId('button')
  const bottomNote = screen.getByTestId('crypto-fiat-bottom-text')

  expect(component).toBeInTheDocument()

  expect(input).toBeInTheDocument()

  fireEvent.change(input, {
    target: { value: TRANSACTIONDATASAMPLE.maxValueInToken },
  })
  expect(input).toHaveValue(TRANSACTIONDATASAMPLE.maxValueInToken.toString())
  expect(bottomNote).toHaveTextContent(
    TRANSACTIONDATASAMPLE.maxValueInToken * TRANSACTIONDATASAMPLE.exchangeRate,
  )

  expect(switchButton).toBeInTheDocument()
  expect(arrowIcons).toHaveLength(2)

  expect(actionButton).toBeInTheDocument()
  expect(actionButton).toHaveTextContent(PROPSSAMPLE.buttonTitle)

  expect(bottomNote).toBeInTheDocument()
})

test('Render TextField component fdf', () => {
  render(
    <CryptoFiatField
      label={PROPSSAMPLE.label}
      buttonTitle={PROPSSAMPLE.buttonTitle}
      placeholder={PROPSSAMPLE.placeholder}
      inputValue={PROPSSAMPLE.value}
      transactionData={PROPSSAMPLE.transactionData}
    />,
  )

  const switchButton = screen.getByTestId('crypto-fiat-switch-button')
  const actionButton = screen.getByTestId('button')
  const bottomNote = screen.getByTestId('crypto-fiat-bottom-text')
  const input = screen.getByTestId('input')

  fireEvent.click(actionButton)
  expect(input).toHaveValue(TRANSACTIONDATASAMPLE.maxValueInToken.toString())

  fireEvent.click(switchButton)
  expect(bottomNote).toHaveTextContent(TRANSACTIONDATASAMPLE.maxValueInToken)

  fireEvent.change(input, { target: { value: '' } })

  fireEvent.click(actionButton)
  expect(input).toHaveValue(
    (TRANSACTIONDATASAMPLE.maxValueInToken * TRANSACTIONDATASAMPLE.exchangeRate)
      .toFixed(2)
      .toString(),
  )

  fireEvent.click(switchButton)
  expect(input).toHaveValue(TRANSACTIONDATASAMPLE.maxValueInToken.toString())

  fireEvent.change(input, { target: { value: '0' } })
  fireEvent.click(switchButton)
  expect(input).toHaveValue('0.00')

  fireEvent.change(input, {
    target: {
      value:
        (TRANSACTIONDATASAMPLE.maxValueInToken + 1) *
        TRANSACTIONDATASAMPLE.exchangeRate,
    },
  })
  expect(input).toHaveClass('invalid')

  fireEvent.change(input, { target: { value: '0' } })
  fireEvent.click(switchButton)
  expect(input).toHaveValue('0')
})

test('Render TextField component without transactionData', () => {
  render(<CryptoFiatField />)

  expect(screen.queryByTestId('crypto-fiat-field')).not.toBeInTheDocument()
})
