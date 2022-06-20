import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen, act } from '@testing-library/react'

import CreateRestore from './index'
import SetAccount from '../set-account/index'
import RestoreAccount from '../restore-account/index'

test('Renders Create/Restore page', () => {
  render(<CreateRestore />, { wrapper: MemoryRouter })
  const createRestoreComponent = screen.getByTestId('create-restore')
  const createRestoreFootnoteName = screen.getByTestId('footnote-name')
  const createRestoreFootnoteLink = screen.getByTestId('footnote-link')

  expect(createRestoreComponent).toBeInTheDocument()
  expect(createRestoreFootnoteName).toBeInTheDocument()
  expect(createRestoreFootnoteLink).toBeInTheDocument()
})

test('Renders Create/Restore page, and navigate to Create Account first step', async () => {
  let location

  const ProxyRestore = () => {
    location = useLocation()
    return <CreateRestore />
  }

  const MockSetAccountPage = () => {
    location = useLocation()
    return <SetAccount />
  }

  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/set-account"
          element={<MockSetAccountPage />}
        />
        <Route
          exact
          path="/"
          element={<ProxyRestore />}
        />
      </Routes>
    </MemoryRouter>,
  )

  const createRestoreComponent = screen.getByTestId('create-restore')
  const buttons = screen.getAllByTestId('button')

  expect(createRestoreComponent).toBeInTheDocument()
  expect(buttons).toHaveLength(2)

  expect(location.pathname).toBe('/')

  act(() => {
    buttons[0].click()
  })

  expect(location.pathname).toBe('/set-account')
})

test('Renders Create/Restore page, and navigate to Recover Account page', async () => {
  let location

  const ProxyRestore = () => {
    location = useLocation()
    return <CreateRestore />
  }

  const MockRestoreAccountPage = () => {
    location = useLocation()
    return <RestoreAccount />
  }

  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/restore-account"
          element={<MockRestoreAccountPage />}
        />
        <Route
          exact
          path="/"
          element={<ProxyRestore />}
        />
      </Routes>
    </MemoryRouter>,
  )

  const createRestoreComponent = screen.getByTestId('create-restore')
  const buttons = screen.getAllByTestId('button')

  expect(createRestoreComponent).toBeInTheDocument()
  expect(buttons).toHaveLength(2)

  expect(location.pathname).toBe('/')

  act(() => {
    buttons[1].click()
  })

  expect(location.pathname).toBe('/restore-account')
})
