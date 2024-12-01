import React from 'react'
import { render, screen } from '@testing-library/react'
import Loader from './Loader'

describe('Loader Component', () => {
  test('renders the loader element', () => {
    render(<Loader />)
    const loaderElement = screen.getByTestId('loader')
    expect(loaderElement).toBeInTheDocument()
  })

  test('has the correct class name', () => {
    render(<Loader />)
    const loaderElement = screen.getByTestId('loader')
    expect(loaderElement).toHaveClass('ldsEllipsis')
  })

  test('renders four loader dots', () => {
    render(<Loader />)
    const loaderDots = screen.getAllByTestId('loader-dot')
    expect(loaderDots).toHaveLength(4)
  })
})
