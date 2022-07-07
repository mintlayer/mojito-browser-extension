import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ContextProvider } from '../../../ContextProvider'
import SetAccountPassword from './index'

jest.spyOn(console, 'error').getMockImplementation(() => {
  console.error.restoreMock()
})

const _data = {
  account: { id: '1', name: 'Account Name' },
  onChangePassword: jest.fn(),
  onSubmit: jest.fn(),
}

const setup = ({ data = _data } = {}) => {
  const utils = render(
    <ContextProvider>
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/',
            state: { account: data.account },
          },
        ]}
      >
        <SetAccountPassword {...data} />
      </MemoryRouter>
    </ContextProvider>,
  )
  const title = screen.getByText('Password for')
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

test('Renders SetAccountPassword page with change password', async () => {
  const { password } = setup()

  fireEvent.change(password, { target: { value: 'change' } })

  expect(_data.onChangePassword).toHaveBeenCalled()
})

test('Click login button onSubmit', async () => {
  const checkPassword = async () => {
    return new Promise((resolve) => {
      resolve('address')
    })
  }

  render(
    <ContextProvider>
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/',
            state: { account: _data.account },
          },
        ]}
      >
        <SetAccountPassword
          {..._data}
          checkPassword={checkPassword}
        />
      </MemoryRouter>
    </ContextProvider>,
  )

  const login = screen.getByRole('button', { name: 'Log In' })
  fireEvent.click(login)
  await waitFor(() => {
    expect(_data.onSubmit).toHaveBeenCalled()
  })
})

test('Click login button onSubmit - error', async () => {
  const checkPassword = async () => {
    return new Promise((_, reject) => {
      reject()
    })
  }

  render(
    <ContextProvider>
      <MemoryRouter
        initialEntries={[
          {
            pathname: '/',
            state: { account: _data.account },
          },
        ]}
      >
        <SetAccountPassword
          {..._data}
          checkPassword={checkPassword}
        />
      </MemoryRouter>
    </ContextProvider>,
  )

  const login = screen.getByRole('button', { name: 'Log In' })

  fireEvent.click(login)

  await waitFor(() => {
    expect(_data.onSubmit).not.toHaveBeenCalled()
  })
})
