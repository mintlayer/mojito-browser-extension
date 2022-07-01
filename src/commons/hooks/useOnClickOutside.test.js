import { createRef } from 'react'
import {
  fireEvent,
  render,
  screen,
  renderHook,
  waitFor,
} from '@testing-library/react'

import { useOnClickOutside } from './useOnClickOutside'

test('calls handler when click is outside element', async () => {
  const handler = jest.fn()

  const Component = () => {
    const ref = createRef()
    useOnClickOutside(ref, handler)

    return (
      <div data-testid="wrapper">
        <div
          ref={ref}
          data-testid="element"
        >
          Hello
        </div>
      </div>
    )
  }

  render(<Component />)
  const wrapper = screen.getByTestId('wrapper')
  const element = screen.getByTestId('element')
  expect(wrapper).toBeInTheDocument()
  expect(element).toBeInTheDocument()

  fireEvent.mouseDown(wrapper)

  await waitFor(() => {
    expect(handler).toBeCalledTimes(1)
  })
})

test('doesnt calls handler when click is within element', async () => {
  const handler = jest.fn()

  const Component = () => {
    const ref = createRef()
    useOnClickOutside(ref, handler)

    return (
      <div data-testid="wrapper">
        <div
          ref={ref}
          data-testid="element"
        >
          Hello
        </div>
      </div>
    )
  }

  render(<Component />)
  const wrapper = screen.getByTestId('wrapper')
  const element = screen.getByTestId('element')
  expect(wrapper).toBeInTheDocument()
  expect(element).toBeInTheDocument()

  fireEvent.mouseDown(element)

  await waitFor(() => {
    expect(handler).not.toBeCalled()
  })
})

test('doesnt calls handler when click is without ref', () => {
  render(<div data-testid="element"></div>)
  const element = screen.getByTestId('element')
  expect(element).toBeInTheDocument()

  renderHook(() => useOnClickOutside())
  fireEvent.click(element)
  expect(useOnClickOutside).toThrow(undefined)
})
