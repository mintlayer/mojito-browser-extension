import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import SliderMenu from './SliderMenu'

describe('SliderMenu', () => {
  const onCloseMock = jest.fn()

  beforeEach(() => {
    onCloseMock.mockClear()
  })

  test('renders children when isOpen is true', () => {
    render(
      <SliderMenu
        isOpen={true}
        onClose={onCloseMock}
      >
        <div>Menu Content</div>
      </SliderMenu>,
    )

    expect(screen.getByText('Menu Content')).toBeInTheDocument()
  })

  test('does not render children when isOpen is false', () => {
    render(
      <SliderMenu
        isOpen={false}
        onClose={onCloseMock}
      >
        <div>Menu Content</div>
      </SliderMenu>,
    )

    expect(screen.queryByText('Menu Content')).not.toBeInTheDocument()
  })

  test('calls onClose when close button is clicked', () => {
    render(
      <SliderMenu
        isOpen={true}
        onClose={onCloseMock}
      >
        <div>Menu Content</div>
      </SliderMenu>,
    )

    fireEvent.click(screen.getByRole('button'))
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })

  test('calls onClose when clicking outside the slider menu', () => {
    render(
      <SliderMenu
        isOpen={true}
        onClose={onCloseMock}
      >
        <div>Menu Content</div>
      </SliderMenu>,
    )

    fireEvent.mouseDown(document)
    expect(onCloseMock).toHaveBeenCalledTimes(1)
  })
})
