import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, fireEvent, act } from '@testing-library/react'
import SetAccount from './setAccount'

// const NAMEVALUESAMPLE = 'test'
// const NAMESETVALIDITY = jest.fn()

const SETSTEPSAMPLE = jest.fn()
const WORDSSAMPLE = ['car', 'house', 'cat']

test('Renders set account page with step 1', () => {
  console.log = jest.fn()
  render(
    <SetAccount
      step={1}
      setStep={SETSTEPSAMPLE}
    />,
    { wrapper: MemoryRouter },
  )
  const setAccountComponent = screen.getByTestId('set-account')
  const setAccountForm = screen.getByTestId('set-account-form')
  const buttons = screen.getAllByTestId('button')
  const inputComponent = screen.getByTestId('input')

  expect(buttons).toHaveLength(2)

  expect(setAccountComponent).toBeInTheDocument()
  expect(setAccountForm).toBeInTheDocument()
  expect(setAccountForm).toHaveAttribute('method', 'POST')
  expect(inputComponent).toHaveAttribute('type', 'text')
  expect(inputComponent).toHaveAttribute('placeholder', 'Account Name')
  fireEvent.change(inputComponent, { target: { value: '1' } })
  expect(inputComponent).toHaveClass('invalid')

  act(() => {
    setAccountForm.submit()
  })

  expect(console.log).toHaveBeenCalledWith('something went wrong')

  fireEvent.change(inputComponent, { target: { value: 'more then 4' } })
  expect(inputComponent).toHaveClass('valid')

  act(() => {
    setAccountForm.submit()
  })
})

test('Renders set account page with step 2', () => {
  render(
    <SetAccount
      step={2}
      setStep={SETSTEPSAMPLE}
    />,
    { wrapper: MemoryRouter },
  )
  const setAccountComponent = screen.getByTestId('set-account')
  const setAccountForm = screen.getByTestId('set-account-form')
  const buttons = screen.getAllByTestId('button')
  const inputComponent = screen.getByTestId('input')

  expect(buttons).toHaveLength(2)

  expect(setAccountComponent).toBeInTheDocument()
  expect(setAccountForm).toBeInTheDocument()
  expect(setAccountForm).toHaveAttribute('method', 'POST')
  expect(inputComponent).toHaveAttribute('type', 'password')
  expect(inputComponent).toHaveAttribute('placeholder', 'Password')
  fireEvent.change(inputComponent, { target: { value: '1' } })
  expect(inputComponent).toHaveClass('invalid')

  fireEvent.change(inputComponent, { target: { value: 'Qwertyuio!5678' } })
  expect(inputComponent).toHaveClass('valid')

  act(() => {
    setAccountForm.submit()
  })
})

test('Renders set account page with step 3', () => {
  render(
    <SetAccount
      step={3}
      setStep={SETSTEPSAMPLE}
    />,
    { wrapper: MemoryRouter },
  )
  const descriptionParagraph = screen.getAllByTestId('description-paragraph')
  const setAccountForm = screen.getByTestId('set-account-form')
  const buttons = screen.getAllByTestId('button')

  expect(buttons).toHaveLength(2)
  expect(descriptionParagraph).toHaveLength(2)

  act(() => {
    setAccountForm.submit()
  })
})

test('Renders set account page with step 4', () => {
  render(
    <SetAccount
      step={4}
      setStep={SETSTEPSAMPLE}
      words={WORDSSAMPLE}
    />,
    { wrapper: MemoryRouter },
  )
  const setAccountForm = screen.getByTestId('set-account-form')
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
    setAccountForm.submit()
  })
})
