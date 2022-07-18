import { render, screen, fireEvent } from '@testing-library/react'
import { act } from 'react-dom/test-utils'

import CreateTransactionField from './createTransactionField'

const ONCHANGEHANDLESAMPLE = () => {}

const TRANSACTIONDATASAMPLE = {
  fiatName: 'USD',
  tokenName: 'BTC',
  exchangeRate: 22343.23,
  maxValueInToken: 450,
}

const PROPSSAMPLE = {
  label: 'Label',
  buttonTitle: 'Button title',
  placeholder: 'Placeholder',
  value: '',
  transactionData: TRANSACTIONDATASAMPLE,
}

test('Render TextField component', () => {
  render(
    <CreateTransactionField
      label={PROPSSAMPLE.label}
      buttonTitle={PROPSSAMPLE.buttonTitle}
      placeholder={PROPSSAMPLE.placeholder}
      inputValue={PROPSSAMPLE.value}
      transactionData={PROPSSAMPLE.transactionData}
    />,
  )

  const component = screen.getByTestId('create-transaction-field')
  const label = screen.getByTestId('create-transaction-label')
  const input = screen.getByTestId('input')
  const switchButton = screen.getByTestId('create-tr-switch-button')
  const arrowIcons = screen.getAllByTestId('arrow-icon')
  const actionButton = screen.getByTestId('button')
  const bottomNote = screen.getByTestId('create-tr-bottom-note')

  expect(component).toBeInTheDocument()

  expect(label).toBeInTheDocument()
  expect(label.textContent).toBe(PROPSSAMPLE.label)

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
    <CreateTransactionField
      label={PROPSSAMPLE.label}
      buttonTitle={PROPSSAMPLE.buttonTitle}
      placeholder={PROPSSAMPLE.placeholder}
      inputValue={PROPSSAMPLE.value}
      transactionData={PROPSSAMPLE.transactionData}
    />,
  )

  const switchButton = screen.getByTestId('create-tr-switch-button')
  const actionButton = screen.getByTestId('button')
  const bottomNote = screen.getByTestId('create-tr-bottom-note')
  const input = screen.getByTestId('input')

  fireEvent.click(actionButton)
  expect(input).toHaveValue(TRANSACTIONDATASAMPLE.maxValueInToken.toString())

  fireEvent.click(switchButton)
  expect(bottomNote).toHaveTextContent(TRANSACTIONDATASAMPLE.maxValueInToken)

  fireEvent.change(input, { target: { value: '' } })

  fireEvent.click(actionButton)
  expect(input).toHaveValue(
    (
      TRANSACTIONDATASAMPLE.maxValueInToken * TRANSACTIONDATASAMPLE.exchangeRate
    ).toString(),
  )

  fireEvent.click(switchButton)
  expect(input).toHaveValue(TRANSACTIONDATASAMPLE.maxValueInToken.toString())

  fireEvent.change(input, { target: { value: '0' } })
  fireEvent.click(switchButton)
  expect(input).toHaveValue('0')

  fireEvent.change(input, { target: { value: '0' } })
  fireEvent.click(switchButton)
  expect(input).toHaveValue('0')
})

test('Render TextField component without transactionData', () => {
  render(<CreateTransactionField />)

  expect(
    screen.queryByTestId('create-transaction-field'),
  ).not.toBeInTheDocument()
})
