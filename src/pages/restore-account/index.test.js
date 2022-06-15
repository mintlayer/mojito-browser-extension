import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, fireEvent, act } from '@testing-library/react'
import RestoreAccountPage from './index'

const WORDSSAMPLE = ['car', 'house', 'cat']

test('Renders restore account page', () => {
  console.log = jest.fn()
  render(<RestoreAccountPage />, { wrapper: MemoryRouter })
  const restoreAccountFormComponet = screen.getByTestId('restore-account-form')
  const headerComponet = screen.getByTestId('header-container')
  const buttons = screen.getAllByTestId('button')
  const inputs = screen.getAllByTestId('input')

  expect(headerComponet).toBeInTheDocument()
  expect(restoreAccountFormComponet).toBeInTheDocument()

  expect(buttons).toHaveLength(2)
  expect(inputs).toHaveLength(12)

  inputs.forEach((input) =>
    fireEvent.change(input, { target: { value: 'wrong' } }),
  )

  act(() => {
    restoreAccountFormComponet.submit()
  })

  expect(console.log).toHaveBeenCalledWith('Something went wrong')

  inputs.forEach((input) => expect(input).toHaveClass('invalid'))

  inputs.forEach((input) => expect(input).toHaveAttribute('type', 'text'))
  inputs.forEach((input) => expect(input).toHaveClass('invalid'))
  inputs.forEach((input) =>
    fireEvent.change(input, { target: { value: WORDSSAMPLE[0] } }),
  )
  inputs.forEach((input) => expect(input).toHaveClass('valid'))

  buttons[1].click()
  expect(console.log).toHaveBeenCalledWith('Account restored')
})
