import { render, screen } from '@testing-library/react'
import Loading from './Loading.tsx'

test('Render Loading component', () => {
  render(<Loading />)
  const progressTrackerComponent = screen.getByTestId('loading')

  expect(progressTrackerComponent).toBeInTheDocument()
})
