import { render, screen } from '@testing-library/react'
import ConnectionErrorPopup from './ConnectionErrorPopup'

const onClickHandle = jest.fn()
test('Render Connection error popup', () => {
  render(<ConnectionErrorPopup onClickHandle={onClickHandle} />)
  const backdrop = screen.getByTestId('backdrop')
  const popup = screen.getByTestId('popup')
  const message = screen.getByTestId('connection-error-message')
  const buttons = screen.getAllByTestId('button')

  expect(backdrop).toBeInTheDocument()
  expect(popup).toBeInTheDocument()
  expect(message).toBeInTheDocument()
  expect(message).toHaveClass('connection-error-message')

  expect(buttons).toHaveLength(2)
  expect(buttons[1]).toHaveTextContent('Close')

  buttons[1].click()
  expect(onClickHandle).toHaveBeenCalledTimes(1)
})
