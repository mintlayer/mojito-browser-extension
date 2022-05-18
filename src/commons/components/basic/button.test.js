import { render, screen } from '@testing-library/react'
import Button from './button'

test('Button component', () => {
  render(<Button />)
  const buttonComponent = screen.getByTestId('button')
  buttonComponent.click()

  expect(buttonComponent).toBeInTheDocument()
  expect(buttonComponent).toHaveClass('btn')
})

test('Button component with extra classes', () => {
  render(<Button extraStyleClasses={['testClass', 'otherTestClass']} />)
  const buttonComponent = screen.getByTestId('button')

  expect(buttonComponent).toBeInTheDocument()
  expect(buttonComponent).toHaveClass('btn')
  expect(buttonComponent).toHaveClass('testClass')
  expect(buttonComponent).toHaveClass('otherTestClass')
})

test('Button component with click function', () => {
  const mockHandleClickFn = jest.fn()
  render(<Button onClickHandle={mockHandleClickFn}/>)
  const buttonComponent = screen.getByTestId('button')

  buttonComponent.click()

  expect(buttonComponent).toBeInTheDocument()
  expect(mockHandleClickFn).toBeCalledTimes(1)

  buttonComponent.click()
  expect(mockHandleClickFn).toBeCalledTimes(2)
})

test('Button component with children', () => {
  render(<Button>Test</Button>)
  const buttonComponent = screen.getByTestId('button')

  expect(buttonComponent).toBeInTheDocument()
  expect(buttonComponent).toHaveClass('btn')
})
