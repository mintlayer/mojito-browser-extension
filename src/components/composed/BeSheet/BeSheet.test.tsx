import { render, fireEvent } from '@testing-library/react'
import BeSheet from './BeSheet'

test('renders title and children when open', () => {
  render(
    <BeSheet
      open
      onClose={() => {}}
      title="Transaction detail"
    >
      <p>body</p>
    </BeSheet>,
  )
  expect(document.body.querySelector('[class*="title"]')).toHaveTextContent(
    'Transaction detail',
  )
  expect(document.body).toHaveTextContent('body')
})

test('renders nothing when closed', () => {
  const { container } = render(
    <BeSheet
      open={false}
      onClose={() => {}}
    >
      <p>body</p>
    </BeSheet>,
  )
  expect(container).toBeEmptyDOMElement()
})

test('backdrop click closes the sheet', () => {
  const onClose = jest.fn()
  render(
    <BeSheet
      open
      onClose={onClose}
    >
      <p>body</p>
    </BeSheet>,
  )
  fireEvent.click(document.body.querySelector('[class*="backdrop"]'))
  expect(onClose).toHaveBeenCalledTimes(1)
})
