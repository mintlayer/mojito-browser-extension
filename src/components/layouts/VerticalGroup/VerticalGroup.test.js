import { render, screen } from '@testing-library/react'
import VerticalGroup from './VerticalGroup'

test('Render VerticalGroup component', () => {
  render(<VerticalGroup />)
  const vGroupComponent = screen.getByTestId('vertical-group-container')

  expect(vGroupComponent).toBeInTheDocument()
  expect(vGroupComponent).toBeEmptyDOMElement()
  expect(vGroupComponent).not.toHaveClass('bigGap')
  expect(vGroupComponent).not.toHaveClass('midGap')
  expect(vGroupComponent).not.toHaveClass('smallGap')
})

test('Render VerticalGroup component with children', () => {
  render(<VerticalGroup>content</VerticalGroup>)
  const vGroupComponent = screen.getByTestId('vertical-group-container')

  expect(vGroupComponent).toBeInTheDocument()
  expect(vGroupComponent).not.toBeEmptyDOMElement()
})

test('Render VerticalGroup component - bigGap', () => {
  render(<VerticalGroup bigGap />)
  const vGroupComponent = screen.getByTestId('vertical-group-container')

  expect(vGroupComponent).toBeInTheDocument()
  expect(vGroupComponent).toHaveClass('bigGap')
})

test('Render VerticalGroup component - midGap', () => {
  render(<VerticalGroup midGap />)
  const vGroupComponent = screen.getByTestId('vertical-group-container')

  expect(vGroupComponent).toBeInTheDocument()
  expect(vGroupComponent).toHaveClass('midGap')
})

test('Render VerticalGroup component - smallGap', () => {
  render(<VerticalGroup smallGap />)
  const vGroupComponent = screen.getByTestId('vertical-group-container')

  expect(vGroupComponent).toBeInTheDocument()
  expect(vGroupComponent).toHaveClass('smallGap')
})

test('Render VerticalGroup component - fullWidth, grow and center', () => {
  render(
    <VerticalGroup
      fullWidth
      grow
      center
    />,
  )
  const vGroupComponent = screen.getByTestId('vertical-group-container')

  expect(vGroupComponent).toBeInTheDocument()
  expect(vGroupComponent).toHaveClass('fullWidth')
  expect(vGroupComponent).toHaveClass('grow')
  expect(vGroupComponent).toHaveClass('center')
})

test('Render VerticalGroup component - warns when gap props are combined', () => {
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {})

  render(
    <VerticalGroup
      bigGap
      midGap
    />,
  )
  const vGroupComponent = screen.getByTestId('vertical-group-container')

  expect(vGroupComponent).toBeInTheDocument()
  expect(console.warn).toHaveBeenCalledWith(
    'VerticalGroup: bigGap, midGap and smallGap are mutually exclusive; CSS source order decides the winner.',
  )

  warnSpy.mockRestore()
})
