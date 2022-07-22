import { render, screen, act, fireEvent } from '@testing-library/react'
import SendTransaction from './SendTransaction'

test('Send Transaction', () => {
  render(<SendTransaction />)
  const btn = screen.getByText('Send')

  act(() => {
    fireEvent.click(btn)
  })

  const confirm = screen.getByText('Confirm')
  act(() => {
    fireEvent.click(confirm)
  })

  act(() => {
    fireEvent.click(btn)
  })

  const cancel = screen.getByText('Cancel')
  act(() => {
    fireEvent.click(cancel)
  })
})
