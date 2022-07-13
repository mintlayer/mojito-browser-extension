import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { Expressions } from '@Constants'
import Input from './Input'

test('Input component', () => {
  render(<Input />)
  const inputComponent = screen.getByTestId('input')

  inputComponent.focus()
  inputComponent.blur()
  fireEvent.change(inputComponent, { target: { value: 'test' } })

  expect(inputComponent).toBeInTheDocument()
  expect(inputComponent).toHaveClass('input')
  expect(inputComponent).toHaveAttribute('placeholder', 'Placeholder')
})

test('Input component with placeholder', () => {
  render(<Input placeholder="inputfield" />)
  const inputComponent = screen.getByTestId('input')

  expect(inputComponent).toBeInTheDocument()
  expect(inputComponent).toHaveAttribute('placeholder', 'inputfield')
})

test('Input component with pattern', () => {
  const passwordPattern = Expressions.PASSWORD
  render(<Input pattern={passwordPattern} />)
  const inputComponent = screen.getByTestId('input')

  expect(inputComponent).toBeInTheDocument()
  expect(inputComponent).toHaveAttribute('pattern', passwordPattern.toString())
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
  const mockHandleChangeFn = jest.fn((ev) => {
    val = ev.target.value
  })

  render(
    <Input
      onBlurHandle={mockHandleBlurFn}
      onFocusHandle={mockHandleFocusFn}
      onChangeHandle={mockHandleChangeFn}
    />,
  )
  const inputComponent = screen.getByTestId('input')

  inputComponent.focus()
  fireEvent.change(inputComponent, { target: { value: 'test' } })
  inputComponent.blur()

  expect(inputComponent).toBeInTheDocument()
  expect(mockHandleBlurFn).toBeCalledTimes(1)
  expect(mockHandleFocusFn).toBeCalledTimes(1)
  expect(mockHandleChangeFn).toBeCalledTimes(1)
  expect(val).toBe('test')

  inputComponent.focus()
  fireEvent.change(inputComponent, { target: { value: 'test2' } })
  inputComponent.blur()

  expect(mockHandleBlurFn).toBeCalledTimes(2)
  expect(mockHandleFocusFn).toBeCalledTimes(2)
  expect(mockHandleChangeFn).toBeCalledTimes(2)
  expect(val).toBe('test2')
})

test('Input component with validity', async () => {
  const { rerender } = render(<Input />)
  let inputComponent = screen.getByTestId('input')

  expect(inputComponent).not.toHaveClass('valid')
  expect(inputComponent).not.toHaveClass('invalid')

  rerender(<Input validity="invalid" />)
  inputComponent = screen.getByTestId('input')
  await waitFor(() => {
    expect(inputComponent).toHaveClass('invalid')
  })
  expect(inputComponent).not.toHaveClass('valid')

  rerender(<Input validity="valid" />)
  inputComponent = screen.getByTestId('input')
  await waitFor(() => {
    expect(inputComponent).toHaveClass('valid')
  })
  expect(inputComponent).not.toHaveClass('invalid')

  rerender(<Input validity="anythingElse" />)
  inputComponent = screen.getByTestId('input')
  await waitFor(() => {
    expect(inputComponent).not.toHaveClass('anythingElse')
  })

  expect(inputComponent).not.toHaveClass('valid')
  expect(inputComponent).not.toHaveClass('invalid')
})

test('Input component - password', async () => {
  const { rerender } = render(<Input />)
  let inputComponent = screen.getByTestId('input')

  expect(inputComponent).toHaveAttribute('type', 'text')

  rerender(<Input password />)
  inputComponent = screen.getByTestId('input')
  await waitFor(() => {
    expect(inputComponent).toHaveAttribute('type', 'password')
  })
})

test('Input component - id', async () => {
  render(<Input id="testId" />)
  const inputComponent = screen.getByTestId('input')

  expect(inputComponent).toHaveAttribute('id', 'testId')
})
