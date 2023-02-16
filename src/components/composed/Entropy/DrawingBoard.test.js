import { render, screen, act } from '@testing-library/react'
import DrawingBoard from './Entropy'
import { AccountProvider } from '@Contexts'

test('Render Drawing Board', async () => {
  render(
    <AccountProvider>
      <DrawingBoard />
    </AccountProvider>,
  )

  const drawingBoard = screen.getByTestId('entropy-drawing-board')
  const layer = screen.getByRole('presentation')
  const clearButton = screen.getByTestId('button')

  expect(drawingBoard).toBeInTheDocument()

  expect(layer).toBeInTheDocument()
  expect(layer).toHaveClass('konvajs-content')

  expect(clearButton).toBeInTheDocument()
  expect(clearButton).toHaveTextContent('Clear')

  act(() => {
    clearButton.click()
  })
})
