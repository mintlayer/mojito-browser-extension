import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import SetAccountName from './index'
import SetAccountPassword from '../set-account-name/index'
import { act } from 'react-dom/test-utils'

test('Renders Set Account Name page', () => {
  render(<SetAccountName />, { wrapper: MemoryRouter })
  const setAccountNameComponent = screen.getByTestId('set-account-name')

  expect(setAccountNameComponent).toBeInTheDocument()
})

test('Renders Set Account Name page, and navigate to Create Account second step', async () => {
  let location

  const ProxyAccountName = () => {
    location = useLocation()
    return (<SetAccountName />)
  }

  const MockPage = () => {
    location = useLocation()
    return (<SetAccountPassword />)
  }

  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/set-account-password" element={<MockPage />} />
        <Route exact path="/" element={<ProxyAccountName />} />
      </Routes>
    </MemoryRouter>)

  const setAccountNameComponent = screen.getByTestId('set-account-name')
  const buttons = screen.getAllByTestId('button')

  expect(setAccountNameComponent).toBeInTheDocument()
  expect(buttons).toHaveLength(1)

  expect(location.pathname).toBe('/')

  act(()=>{
    buttons[0].click()
  })

  expect(location.pathname).toBe('/set-account-password')
})
