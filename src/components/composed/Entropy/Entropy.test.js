import { render, screen } from '@testing-library/react'
import Entropy from './Entropy'
import { AccountProvider } from '@Contexts'

test('Render Entropy', async () => {
  render(
    <AccountProvider>
      <Entropy />
    </AccountProvider>,
  )

  const entropy = screen.getByTestId('entropy')
  const description = screen.getByTestId('entropy-description')
  const drawingBoard = screen.getByTestId('entropy-drawing-board')

  expect(entropy).toBeInTheDocument()
  expect(description).toBeInTheDocument()
  expect(drawingBoard).toBeInTheDocument()
})

test('Render Entropy with error', async () => {
  const errorMessages = 'Your entropy is too small. Please draw more lines.'
  render(
    <AccountProvider>
      <Entropy isError />
    </AccountProvider>,
  )

  const entropy = screen.getByTestId('entropy')
  const description = screen.getByTestId('entropy-description')
  const drawingBoard = screen.getByTestId('entropy-drawing-board')
  const errorMessage = screen.getByTestId('error-message')

  expect(entropy).toBeInTheDocument()
  expect(description).toBeInTheDocument()
  expect(drawingBoard).toBeInTheDocument()
  expect(errorMessage).toHaveTextContent(errorMessages)
})
