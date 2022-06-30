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
  const ref = createRef()
  render(
    <div data-testid="wrapper">
      <div
        ref={ref}
        data-testid="element"
      >
        Hello
      </div>
    </div>,
  )
  const wrapper = screen.getByTestId('wrapper')
  const element = screen.getByTestId('element')
  expect(wrapper).toBeInTheDocument()
  expect(element).toBeInTheDocument()

  renderHook(() => useOnClickOutside(ref, handler)) //do not call handler, why?

  fireEvent.click(wrapper)

  await waitFor(() => {
    expect(handler).toBeCalledTimes(0)
  })
})

test('doesnt calls handler when click is within element', () => {
  const handler = jest.fn()
  const ref = createRef()
  render(
    <div
      ref={ref}
      data-testid="element"
    ></div>,
  )
  const element = screen.getByTestId('element')
  expect(element).toBeInTheDocument()

  renderHook(() => useOnClickOutside(ref, handler))
  fireEvent.click(element)
  expect(handler).not.toBeCalled()
})

test('doesnt calls handler when click is without ref', () => {
  render(<div data-testid="element"></div>)
  const element = screen.getByTestId('element')
  expect(element).toBeInTheDocument()

  renderHook(() => useOnClickOutside())
  fireEvent.click(element)
  expect(useOnClickOutside).toThrow(undefined)
})
