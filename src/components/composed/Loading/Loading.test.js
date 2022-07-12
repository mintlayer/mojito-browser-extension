import { render, screen } from '@testing-library/react'
import Loading from './Loading'

test('Render Loading component', () => {
  render(<Loading />)
  const progressTrackerComponent = screen.getByTestId('loading')

  expect(progressTrackerComponent).toBeInTheDocument()
})
