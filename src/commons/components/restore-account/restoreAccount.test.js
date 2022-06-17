import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, fireEvent, act } from '@testing-library/react'
import RestoreAccount from './restoreAccount'
import Expressions from '../../utils/expressions'

const SETSTEPSAMPLE = jest.fn()
const WORDSSAMPLE = ['car', 'house', 'cat']

test('Renders restore account page with step 1', () => {
  console.log = jest.fn()
  render(
    <RestoreAccount
      step={1}
      setStep={SETSTEPSAMPLE}
    />,
    { wrapper: MemoryRouter },
  )
  const RestoreAccountComponent = screen.getByTestId('restore-account')
  const restoreAccountForm = screen.getByTestId('restore-account-form')
  const buttons = screen.getAllByTestId('button')
  const inputComponent = screen.getByTestId('input')

  expect(buttons).toHaveLength(2)

  expect(RestoreAccountComponent).toBeInTheDocument()
  expect(restoreAccountForm).toBeInTheDocument()
  expect(restoreAccountForm).toHaveAttribute('method', 'POST')
  expect(inputComponent).toHaveAttribute('type', 'text')
  expect(inputComponent).toHaveAttribute('placeholder', 'Account Name')
  fireEvent.change(inputComponent, { target: { value: '1' } })
  expect(inputComponent).toHaveClass('invalid')

  act(() => {
    restoreAccountForm.submit()
  })

  expect(console.log).toHaveBeenCalledWith('something went wrong')

  fireEvent.change(inputComponent, { target: { value: 'more then 4' } })
  expect(inputComponent).toHaveClass('valid')

  act(() => {
    restoreAccountForm.submit()
  })
})

test('Renders restore account page with step 2', () => {
  const passwordPattern = Expressions.PASSWORD
  render(
    <RestoreAccount
      step={2}
      setStep={SETSTEPSAMPLE}
    />,
    { wrapper: MemoryRouter },
  )
  const RestoreAccountComponent = screen.getByTestId('restore-account')
  const restoreAccountForm = screen.getByTestId('restore-account-form')
  const buttons = screen.getAllByTestId('button')
  const inputComponent = screen.getByTestId('input')

  expect(buttons).toHaveLength(2)

  expect(RestoreAccountComponent).toBeInTheDocument()
  expect(restoreAccountForm).toBeInTheDocument()
  expect(restoreAccountForm).toHaveAttribute('method', 'POST')
  expect(inputComponent).toHaveAttribute('type', 'password')
  expect(inputComponent).toHaveAttribute('placeholder', 'Password')
  expect(inputComponent).toHaveAttribute('pattern', passwordPattern.toString())
  fireEvent.change(inputComponent, { target: { value: '1' } })
  expect(inputComponent).toHaveClass('invalid')

  fireEvent.change(inputComponent, { target: { value: 'qwertyuio!5678' } })
  expect(inputComponent).toHaveClass('invalid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5678' } })
  expect(inputComponent).toHaveClass('invalid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5@' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5#' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5$' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5%' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5ˆ' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5&' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5*' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5_' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5+' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5=' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5|' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5"' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio5?' } })
  expect(inputComponent).toHaveClass('valid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio!5678' } })
  expect(inputComponent).toHaveClass('valid')

  act(() => {
    restoreAccountForm.submit()
  })
})

test('Renders set account page with step 3', () => {
  render(
    <RestoreAccount
      step={3}
      setStep={SETSTEPSAMPLE}
    />,
    { wrapper: MemoryRouter },
  )
  const descriptionParagraph = screen.getAllByTestId('description-paragraph')
  const restoreAccountForm = screen.getByTestId('restore-account-form')
  const buttons = screen.getAllByTestId('button')

  expect(buttons).toHaveLength(2)
  expect(descriptionParagraph).toHaveLength(1)

  act(() => {
    restoreAccountForm.submit()
  })
})

test('Renders restore account page with step 4', () => {
  render(
    <RestoreAccount
      step={4}
      setStep={SETSTEPSAMPLE}
      words={WORDSSAMPLE}
    />,
    { wrapper: MemoryRouter },
  )
  const restoreAccountForm = screen.getByTestId('restore-account-form')
  const buttons = screen.getAllByTestId('button')
  const inputs = screen.getAllByTestId('input')

  expect(buttons).toHaveLength(2)
  expect(inputs).toHaveLength(12)

  inputs.forEach((input) => expect(input).toHaveAttribute('type', 'text'))
  inputs.forEach((input) => expect(input).toHaveClass('invalid'))
  inputs.forEach((input) =>
    fireEvent.change(input, { target: { value: WORDSSAMPLE[0] } }),
  )
  inputs.forEach((input) => expect(input).toHaveClass('valid'))

  act(() => {
    restoreAccountForm.submit()
  })
})
