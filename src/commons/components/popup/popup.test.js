import { render, screen } from '@testing-library/react'
import { act } from 'react-dom/test-utils'

import Popup from './popup'

const popupContent = 'example popup content'

test('Render Inputs list item', () => {
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
})