import { fireEvent, render } from '@testing-library/react'
import Sheet from './Sheet'

test('renders nothing when closed', () => {
  const { container } = render(
    <Sheet
      open={false}
      onClose={() => {}}
    >
      <p>content</p>
    </Sheet>,
  )
  expect(container).toBeEmptyDOMElement()
})

test('renders children when open and closes on backdrop click', () => {
  const onClose = jest.fn()
  render(
    <Sheet
      open
      onClose={onClose}
    >
      <p>sheet content</p>
    </Sheet>,
  )
  expect(document.body).toHaveTextContent('sheet content')
  const backdrop = document.body.querySelector('[class*="backdrop"]')
  fireEvent.click(backdrop)
  expect(onClose).toHaveBeenCalledTimes(1)
})
