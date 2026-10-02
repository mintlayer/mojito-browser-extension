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
    expect(handler).toHaveBeenCalledTimes(1)
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
    expect(handler).not.toHaveBeenCalled()
  })
})

test('doesnt calls handler when ref has no current element', () => {
  const handler = jest.fn()

  const TestComponent = () => {
    const ref = createRef()
    useOnClickOutside(ref, handler)

    return <div data-testid="element">Hello</div>
  }

  render(<TestComponent />)

  fireEvent.mouseDown(document.body)

  expect(handler).not.toHaveBeenCalled()
})
