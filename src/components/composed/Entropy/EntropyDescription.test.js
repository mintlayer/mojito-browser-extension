import { render, screen } from '@testing-library/react'
import EntropyDescription from './EntropyDescription'

const DESCRIPTION_ITEMS = ['one', 'two']

test('Render account balance', () => {
  render(<EntropyDescription descriptionItems={DESCRIPTION_ITEMS} />)
  const description = screen.getByTestId('entropy-description')
  const verticalContainer = screen.getByTestId('vertical-group-container')
  const descriptionItems = screen.getAllByTestId('entropy-paragraph')

  expect(description).toBeInTheDocument()
  expect(verticalContainer).toBeInTheDocument()
  expect(description).toHaveClass('entropy-description')

  descriptionItems.forEach((item, index) => {
    expect(item).toHaveTextContent(DESCRIPTION_ITEMS[index])
  })

  expect(descriptionItems).toHaveLength(DESCRIPTION_ITEMS.length)
})
