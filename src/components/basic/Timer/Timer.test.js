import { render, act } from '@testing-library/react'
import Timer from './Timer'

describe('Timer', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('calls onTimerEnd after duration', () => {
    const onTimerEnd = jest.fn()
    render(
      <Timer
        onTimerEnd={onTimerEnd}
        duration={5000}
      />,
    )

    expect(onTimerEnd).not.toHaveBeenCalled()

    act(() => jest.advanceTimersByTime(5000))
    expect(onTimerEnd).toHaveBeenCalledTimes(1)
  })

  it('does not call onTimerEnd before duration elapses', () => {
    const onTimerEnd = jest.fn()
    render(
      <Timer
        onTimerEnd={onTimerEnd}
        duration={5000}
      />,
    )

    act(() => jest.advanceTimersByTime(4999))
    expect(onTimerEnd).not.toHaveBeenCalled()
  })

  it('repeats when repeat is true', () => {
    const onTimerEnd = jest.fn()
    render(
      <Timer
        onTimerEnd={onTimerEnd}
        duration={1000}
        repeat
      />,
    )

    act(() => jest.advanceTimersByTime(1000))
    expect(onTimerEnd).toHaveBeenCalledTimes(1)

    act(() => jest.advanceTimersByTime(1000))
    expect(onTimerEnd).toHaveBeenCalledTimes(2)

    act(() => jest.advanceTimersByTime(1000))
    expect(onTimerEnd).toHaveBeenCalledTimes(3)
  })

  it('does not repeat when repeat is falsy', () => {
    const onTimerEnd = jest.fn()
    render(
      <Timer
        onTimerEnd={onTimerEnd}
        duration={1000}
      />,
    )

    act(() => jest.advanceTimersByTime(1000))
    expect(onTimerEnd).toHaveBeenCalledTimes(1)

    act(() => jest.advanceTimersByTime(3000))
    expect(onTimerEnd).toHaveBeenCalledTimes(1)
  })

  it('renders an empty div', () => {
    const { container } = render(
      <Timer
        onTimerEnd={jest.fn()}
        duration={1000}
      />,
    )

    expect(container.querySelector('div')).toBeInTheDocument()
    expect(container.querySelector('div')).toBeEmptyDOMElement()
  })
})
