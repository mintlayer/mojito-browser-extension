import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen, act } from '@testing-library/react'

import CreateRestore from './index'
import SetAccoun from '../set-account/index'

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

  const MockPage = () => {
    location = useLocation()
    return <SetAccoun />
  }

  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route
          path="/set-account"
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

  expect(location.pathname).toBe('/set-account')
})
