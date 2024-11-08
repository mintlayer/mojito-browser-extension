import * as React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'

import { AccountProvider, SettingsProvider } from '@Contexts'
import SetPassword from './SetPassword'

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
    <AccountProvider>
      <SettingsProvider>
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/',
              state: { account: data.account },
            },
          ]}
        >
          <SetPassword {...data} />
        </MemoryRouter>
      </SettingsProvider>
    </AccountProvider>,
  )
  const title = screen.getByText('Password for')
  const account = screen.getByText(data.account.name)
  const password = screen.getByPlaceholderText('Password')
  const loginButton = screen.getByTestId('login-password-submit')
  return {
    title,
    account,
    password,
    loginButton,
    utils,
  }
}

test('Renders SetAccountPassword page', () => {
  const { title, account, password, loginButton } = setup()

  expect(title).toBeInTheDocument()
  expect(account).toBeInTheDocument()
  expect(password).toBeInTheDocument()
  expect(loginButton).toBeInTheDocument()
})

test('Renders SetAccountPassword page with change password', async () => {
  const { password } = setup()

  fireEvent.change(password, { target: { value: 'change' } })

  expect(_data.onChangePassword).toHaveBeenCalled()
})

test('Click login button onSubmit', async () => {
  const checkPassword = async () => {
    return new Promise((resolve) => {
      resolve({
        addresses: {
          btcMainnetAddress: 'btcMainnetAddress',
          btcTestnetAddress: 'btcTestnetAddress',
          mlMainnetAddress: 'mlMainnetAddress',
          mlTestnetAddress: 'mlTestnetAddress',
        },
      })
    })
  }

  render(
    <AccountProvider>
      <SettingsProvider>
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/',
              state: { account: _data.account },
            },
          ]}
        >
          <SetPassword
            {..._data}
            checkPassword={checkPassword}
          />
        </MemoryRouter>
      </SettingsProvider>
    </AccountProvider>,
  )

  const loginButton = screen.getByTestId('login-password-submit')
  fireEvent.click(loginButton)
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
    <AccountProvider>
      <SettingsProvider>
        <MemoryRouter
          initialEntries={[
            {
              pathname: '/',
              state: { account: _data.account },
            },
          ]}
        >
          <SetPassword
            {..._data}
            checkPassword={checkPassword}
          />
        </MemoryRouter>
      </SettingsProvider>
    </AccountProvider>,
  )

  const loginButton = screen.getByTestId('login-password-submit')

  fireEvent.click(loginButton)

  await waitFor(() => {
    expect(_data.onSubmit).not.toHaveBeenCalled()
  })
})
