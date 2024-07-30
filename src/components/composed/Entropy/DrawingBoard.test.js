import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import DrawingBoard from './DrawingBoard'
import { AccountProvider } from '@Contexts'
import 'konva/lib/shapes/Line'

const setLines = jest.fn()
const setEntropy = jest.fn()

const scaleMock = jest.fn()


test('Render Drawing Board', () => {
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
})

test('allows drawing on the canvas', () => {
  render(
    <AccountProvider value={{ lines: [], setLines, scale: scaleMock }}>
      <DrawingBoard />
    </AccountProvider>,
  )
  const canvas = screen.getByRole('presentation')

  fireEvent.mouseDown(canvas, { clientX: 50, clientY: 50 })
  fireEvent.mouseUp(canvas)
  fireEvent.mouseDown(canvas, { clientX: 60, clientY: 60 })
  fireEvent.mouseUp(canvas)

  expect(setLines).toHaveBeenCalledTimes(2)
})

test('Clears the canvas when the Clear button is clicked', () => {
  render(
    <AccountProvider value={{ lines: [], setLines, setEntropy }}>
      <DrawingBoard />
    </AccountProvider>,
  )

  const clearButton = screen.getByText('Clear')
  fireEvent.click(clearButton)

  expect(setLines).toHaveBeenCalledWith([])
  expect(setEntropy).toHaveBeenCalledWith([])
})
