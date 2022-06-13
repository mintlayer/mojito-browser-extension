import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import Error from './error'

const ERRORSAMPLE = 'Error sample'

test('Renders error component', () => {
  render(<Error />, { wrapper: MemoryRouter })
  const errorComponent = screen.getByTestId('error')
  expect(errorComponent).toBeInTheDocument()
  expect(errorComponent).toHaveTextContent('')
})

test('Renders error component with message', () => {
  render(<Error error={ERRORSAMPLE} />)
  const errorComponent = screen.getByTestId('error')
  expect(errorComponent).toBeInTheDocument()
  expect(errorComponent).toHaveTextContent(ERRORSAMPLE)
})
