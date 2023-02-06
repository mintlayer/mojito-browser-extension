import { render, screen } from '@testing-library/react'
import Entropy from './Entropy'

test('Render Entropy', async () => {
  render(<Entropy />)

  const entropy = screen.getByTestId('entropy')
  const description = screen.getByTestId('entropy-description')
  const drawingBoard = screen.getByTestId('entropy-drawing-board')

  expect(entropy).toBeInTheDocument()
  expect(description).toBeInTheDocument()
  expect(drawingBoard).toBeInTheDocument()
})
