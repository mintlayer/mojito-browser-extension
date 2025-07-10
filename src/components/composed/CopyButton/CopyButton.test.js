import React from 'react'
import { render, fireEvent, screen, act } from '@testing-library/react'
import CopyButton from './CopyButton'

jest.useFakeTimers()

describe('CopyButton', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: {
        writeText: jest.fn(),
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

  it('shows success icon after copying', () => {
    render(<CopyButton content="test content" />)
    fireEvent.click(screen.getByTestId('copy-btn'))
    expect(screen.getByTestId('success-icon')).toBeInTheDocument()
  })

  it('resets copied state after timeout', () => {
    render(<CopyButton content="test content" />)
    fireEvent.click(screen.getByTestId('copy-btn'))
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
