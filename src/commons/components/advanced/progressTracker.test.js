import { render, screen } from '@testing-library/react'
import ProgressTracker from './progressTracker'

test('Render ProgressTracker component', () => {
  render(<ProgressTracker />)
  const progressTrackerComponent = screen.getByTestId(
    'progress-tracker-container',
  )

  expect(progressTrackerComponent).toBeInTheDocument()
  expect(progressTrackerComponent).not.toBeEmptyDOMElement()
})

test('Render ProgressTracker component - with steps', () => {
  const steps = [
    { name: 'Step 1' },
    { name: 'Step 2', active: true },
    { name: 'Step 3' },
    { name: 'Step 4' },
    { name: 'Step 5' },
  ]

  render(<ProgressTracker steps={steps} />)
  const progressTrackerComponent = screen.getByTestId(
    'progress-tracker-container',
  )
  const items = screen.getAllByTestId('progress-step')

  expect(progressTrackerComponent).toBeInTheDocument()
  expect(items).toHaveLength(items.length)
})
