import { render, screen } from '@testing-library/react'
import Loading from './loading'

test('Render Loading component', () => {
  render(<Loading />)
  const progressTrackerComponent = screen.getByTestId('loading')

  expect(progressTrackerComponent).toBeInTheDocument()
})
