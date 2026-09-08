import { render } from '@testing-library/react'
import ErrorBoundary from './ErrorBoundary'

const Bomb = ({ shouldThrow }: { shouldThrow?: boolean }) => {
  if (shouldThrow) throw new Error('boom')
  return <p>fine</p>
}

test('renders children when no error occurs', () => {
  const { getByText } = render(
    <ErrorBoundary>
      <Bomb />
    </ErrorBoundary>,
  )
  expect(getByText('fine')).toBeInTheDocument()
})

test('renders the fallback screen when a child throws', () => {
  // silence the expected console error
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  const { getByTestId } = render(
    <ErrorBoundary>
      <Bomb shouldThrow />
    </ErrorBoundary>,
  )
  expect(getByTestId('error-boundary')).toBeInTheDocument()
  spy.mockRestore()
})

test('offers a reload button', () => {
  const spy = jest.spyOn(console, 'error').mockImplementation(() => {})
  const { getByText } = render(
    <ErrorBoundary>
      <Bomb shouldThrow />
    </ErrorBoundary>,
  )
  expect(getByText('Reload wallet')).toBeInTheDocument()
  spy.mockRestore()
})
