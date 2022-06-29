import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, fireEvent } from '@testing-library/react'

import SetAccountPassword from './index'

const _data = {
  account: { id: '1', name: 'Account Name' },
  onSubmit: jest.fn(),
}

const setup = ({ data = _data } = {}) => {
  const utils = render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: '/',
          state: { account: data.account },
        },
      ]}
    >
      <SetAccountPassword {...data} />
    </MemoryRouter>,
  )
  const title = screen.getByText('Password For')
  const account = screen.getByText(data.account.name)
  const password = screen.getByPlaceholderText('Password')
  const login = screen.getByRole('button', { name: 'Log In' })
  return {
    title,
    account,
    password,
    login,
    utils,
  }
}

test('Renders SetAccountPassword page', () => {
  const { title, account, password, login } = setup()

  expect(title).toBeInTheDocument()
  expect(account).toBeInTheDocument()
  expect(password).toBeInTheDocument()
  expect(login).toBeInTheDocument()
})

test('Renders SetAccountPassword page with invalid password', () => {
  const { password } = setup()

  fireEvent.change(password, { target: { value: 'Qwertyuio5678' } })
  expect(password).toHaveClass('invalid')

  fireEvent.change(password, { target: { value: 'Qwertyuio5@' } })
  expect(password).toHaveClass('valid')
})

test('Click login button onSubmit', () => {
  const { login } = setup()

  fireEvent.click(login)
  expect(_data.onSubmit).toHaveBeenCalled()
})
