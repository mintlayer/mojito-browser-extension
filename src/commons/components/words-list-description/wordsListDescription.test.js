import { render, screen } from '@testing-library/react'
import WordsDescription from './wordsListDescription'

test('Render set acount page field', () => {
  render(<WordsDescription />)
  const wordsListDescription = screen.getByTestId('centered-layout-container')
  const descriptionParagraph = screen.getAllByTestId('description-paragraph')

  expect(descriptionParagraph).toHaveLength(2)

  expect(wordsListDescription).toBeInTheDocument()
})
