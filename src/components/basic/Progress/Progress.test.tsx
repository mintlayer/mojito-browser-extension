import { render, screen } from '@testing-library/react'
import Progress from './Progress'

test('renders the track', () => {
  render(<Progress step={1} />)
  expect(screen.getByTestId('progress-track')).toBeInTheDocument()
})

test('renders the given number of segments', () => {
  const { container } = render(
    <Progress
      step={2}
      total={4}
    />,
  )
  expect(container.querySelectorAll('div[class*="segment"]').length).toBe(4)
})

test('marks completed segments as done', () => {
  const { container } = render(
    <Progress
      step={2}
      total={4}
    />,
  )
  const doneSegments = container.querySelectorAll('div[class*="done"]')
  expect(doneSegments.length).toBe(2)
})
