import { render, screen } from '@testing-library/react'
import SkeletonLoader from './SkeletonLoader'

describe('SkeletonLoader', () => {
  it('renders without crashing', () => {
    render(<SkeletonLoader />)
  })

  it('renders the correct number of skeleton text elements', () => {
    render(<SkeletonLoader />)
    const skeletonTextElements = screen.getAllByTestId('card-body')
    expect(skeletonTextElements.length).toBe(6)
  })

  it('renders the correct number of card bodies', () => {
    render(<SkeletonLoader />)
    const cardBodies = screen.getAllByTestId('body-item')
    expect(cardBodies.length).toBe(2)
  })
})
