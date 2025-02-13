import React from 'react'
import { render, screen } from '@testing-library/react'
import DrawingBoard from './DrawingBoard'
import { AccountProvider } from '@Contexts'
import 'konva/lib/shapes/Line'

// TODO: Mock the react-konva library to pass the test cause react-konva is not properly working with jest. Need to find a bettr way to test this component.
jest.mock('react-konva', () => ({
  Stage: ({ children, ...props }) => (
    <div
      role={'presentation'}
      {...props}
    >
      {children}
    </div>
  ),
  Layer: ({ children, ...props }) => <div {...props}>{children}</div>,
  Line: ({ ...props }) => <div {...props} />,
}))

// const setLines = jest.fn()
// const setEntropy = jest.fn()

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
  expect(clearButton).toBeInTheDocument()
  expect(clearButton).toHaveTextContent('Clear')
})

// test('allows drawing on the canvas', () => {
//   render(
//     <AccountProvider value={{ lines: [], setLines }}>
//       <DrawingBoard />
//     </AccountProvider>,
//   )
//   const drawingBoard = screen.getByTestId('entropy-drawing-board')

//   fireEvent.mouseDown(drawingBoard, { clientX: 50, clientY: 50 })
//   fireEvent.mouseUp(drawingBoard)
//   fireEvent.mouseDown(drawingBoard, { clientX: 60, clientY: 60 })
//   fireEvent.mouseUp(drawingBoard)

//   expect(setLines).toHaveBeenCalledTimes(2)
// })

// test('Clears the canvas when the Clear button is clicked', () => {
//   render(
//     <AccountProvider value={{ lines: [], setLines, setEntropy }}>
//       <DrawingBoard />
//     </AccountProvider>,
//   )

//   const clearButton = screen.getByText('Clear')
//   fireEvent.click(clearButton)

//   expect(setLines).toHaveBeenCalledWith([])
//   expect(setEntropy).toHaveBeenCalledWith([])
// })
