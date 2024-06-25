import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'

import Popup from './Popup'

const popupContent = 'example popup content'

test('Render Inputs list item', async () => {
  const mockSetOpen = jest.fn()
  render(
    <Popup
      setOpen={mockSetOpen}
      children={popupContent}
    />,
  )
  const backdropComponent = screen.getByTestId('backdrop')
  const popupComponent = screen.getByTestId('popup')
  const buttonCloseComponent = screen.getByTestId('button')

  expect(backdropComponent).toBeInTheDocument()
  expect(popupComponent).toBeInTheDocument()
  expect(buttonCloseComponent).toBeInTheDocument()

  expect(backdropComponent).toHaveClass('backdrop')
  expect(popupComponent).toHaveClass('popup')

  expect(popupComponent).toHaveTextContent(popupContent)

  act(() => {
    buttonCloseComponent.click()
  })

  await waitFor(() => {
    expect(mockSetOpen.mock.calls.length).toBe(1)
  })
})
