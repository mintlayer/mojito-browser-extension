import React from 'react'
import { render, fireEvent, screen, act } from '@testing-library/react'
import CopyButton from './CopyButton'

jest.useFakeTimers()

describe('CopyButton', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    jest.clearAllTimers()
    jest.clearAllMocks()
  })

  it('renders copy icon initially', () => {
    render(<CopyButton content="test content" />)
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument()
  })

  it('copies content to clipboard on click', () => {
    render(<CopyButton content="test content" />)
    fireEvent.click(screen.getByTestId('copy-btn'))
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test content')
  })

  it('shows success icon after copying', async () => {
    render(<CopyButton content="test content" />)
    fireEvent.click(screen.getByTestId('copy-btn'))
    await act(async () => {}) // flush the clipboard promise
    expect(screen.getByTestId('success-icon')).toBeInTheDocument()
  })

  it('resets copied state after timeout', async () => {
    render(<CopyButton content="test content" />)
    fireEvent.click(screen.getByTestId('copy-btn'))
    await act(async () => {}) // flush the clipboard promise
    expect(screen.getByTestId('success-icon')).toBeInTheDocument()
    act(() => {
      jest.advanceTimersByTime(1200)
    })
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument()
  })

  it('does not copy if content is empty', () => {
    render(<CopyButton content="" />)
    fireEvent.click(screen.getByTestId('copy-btn'))
    expect(navigator.clipboard.writeText).not.toHaveBeenCalled()
  })
})

describe('CopyButton clipboard failures', () => {
  it('never shows the success icon when the clipboard write rejects', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn().mockRejectedValue(new Error('denied')),
      },
    })
    jest.useRealTimers()
    render(<CopyButton content="test content" />)
    fireEvent.click(screen.getByTestId('copy-btn'))
    await act(async () => {})
    expect(screen.queryByTestId('success-icon')).not.toBeInTheDocument()
    expect(screen.getByTestId('copy-icon')).toBeInTheDocument()
    jest.useFakeTimers()
  })
})
