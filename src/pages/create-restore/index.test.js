import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen, act } from '@testing-library/react'

import CreateRestore from './index'
import SetAccountName from '../set-account-name/index'

test('Renders Create/Restore page', () => {
  render(<CreateRestore />, { wrapper: MemoryRouter })
  const createRestoreComponent = screen.getByTestId('create-restore')

  expect(createRestoreComponent).toBeInTheDocument()
})

test('Renders Create/Restore page, and navigate to Create Account first step', async () => {
  let location

  const ProxyRestore = () => {
    location = useLocation()
    return <CreateRestore />
  }

  const MockPage = () => {
    location = useLocation()
    return <SetAccountName />
  }

  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/set-account-name"
          element={<MockPage />}
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

  expect(location.pathname).toBe('/set-account-name')
})
