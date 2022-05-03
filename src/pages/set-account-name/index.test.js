import { render, screen } from '@testing-library/react'
import SetAccountName from './index'

test('Renders Set Account Name page', () => {
  render(<SetAccountName />)
  const setAccountNameComponent = screen.getByTestId('set-account-name')

  expect(setAccountNameComponent).toBeInTheDocument()
})
