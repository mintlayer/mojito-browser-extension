import { fireEvent, render, screen } from '@testing-library/react'
import Input from './input'

test('Input component', () => {
  render(<Input />)
  const inputComponent = screen.getByTestId('input')

  inputComponent.focus()
  inputComponent.blur()
  fireEvent.change(inputComponent,  {target: {value: 'test'}})

  expect(inputComponent).toBeInTheDocument()
  expect(inputComponent).toHaveClass('input')
  expect(inputComponent).toHaveAttribute('placeholder', 'Placeholder')
})

test('Input component with placeholder', () => {
  render(<Input placeholder='inputfield' />)
  const inputComponent = screen.getByTestId('input')

  expect(inputComponent).toBeInTheDocument()
  expect(inputComponent).toHaveAttribute('placeholder', 'inputfield')
})

test('Input component with extra classes', () => {
  render(<Input extraStyleClasses={['testClass', 'otherTestClass']} />)
  const inputComponent = screen.getByTestId('input')

  expect(inputComponent).toBeInTheDocument()
  expect(inputComponent).toHaveClass('input')
  expect(inputComponent).toHaveClass('testClass')
  expect(inputComponent).toHaveClass('otherTestClass')
})

test('Input component with blur, focus, and change function', () => {
  let val
  const mockHandleBlurFn = jest.fn()
  const mockHandleFocusFn = jest.fn()
  const mockHandleChangeFn = jest.fn(ev => {
    val = ev.target.value
  })

  render(<Input
    onBlurHandle={mockHandleBlurFn}
    onFocusHandle={mockHandleFocusFn}
    onChangeHandle={mockHandleChangeFn}/>)
  const inputComponent = screen.getByTestId('input')

  inputComponent.focus()
  fireEvent.change(inputComponent,  {target: {value: 'test'}})
  inputComponent.blur()

  expect(inputComponent).toBeInTheDocument()
  expect(mockHandleBlurFn).toBeCalledTimes(1)
  expect(mockHandleFocusFn).toBeCalledTimes(1)
  expect(mockHandleChangeFn).toBeCalledTimes(1)
  expect(val).toBe('test')

  inputComponent.focus()
  fireEvent.change(inputComponent,  {target: {value: 'test2'}})
  inputComponent.blur()

  expect(mockHandleBlurFn).toBeCalledTimes(2)
  expect(mockHandleFocusFn).toBeCalledTimes(2)
  expect(mockHandleChangeFn).toBeCalledTimes(2)
  expect(val).toBe('test2')
})
