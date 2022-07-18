import { render, screen, fireEvent } from '@testing-library/react'

import CreateTransactionField from './createTransactionField'

const ONCHANGEHANDLESAMPLE = () => {}

const PROPSSAMPLE = {
  label: 'Label',
  buttonTitle: 'Button title',
  placeholder: 'Placeholder',
  buttonClickHandler: () => {},
  withIcon: true,
  bottomText: 'Bottom text',
  value: '',
  setValue: ONCHANGEHANDLESAMPLE,
}

test('Render TextField component', () => {
  const mockHandleClickFn = jest.fn()
  render(
    <CreateTransactionField
      label={PROPSSAMPLE.label}
      buttonTitle={PROPSSAMPLE.buttonTitle}
      placeholder={PROPSSAMPLE.placeholder}
      buttonClickHandler={PROPSSAMPLE.buttonClickHandler}
      withIcon
      bottomText={PROPSSAMPLE.bottomText}
      value={PROPSSAMPLE.value}
      setValue={mockHandleClickFn}
    />,
  )

  const component = screen.getByTestId('create-transaction-field')
  const label = screen.getByTestId('create-transaction-label')
  const input = screen.getByTestId('input')
  const iconsWrapper = screen.getByTestId('create-tr-icons-wrapper')
  const arrowIcons = screen.getAllByTestId('arrow-icon')
  const actionButton = screen.getByTestId('button')
  const bottomNote = screen.getByTestId('create-tr-bottom-note')

  expect(component).toBeInTheDocument()
  expect(component).toHaveClass('create-tr-field-bottom')

  expect(label).toBeInTheDocument()
  expect(label.textContent).toBe(PROPSSAMPLE.label)

  expect(input).toBeInTheDocument()
  fireEvent.change(input, { target: { value: 'test' } })
  expect(input).toHaveValue('test')

  expect(iconsWrapper).toBeInTheDocument()
  expect(arrowIcons).toHaveLength(2)

  expect(actionButton).toBeInTheDocument()
  expect(actionButton).toHaveTextContent(PROPSSAMPLE.buttonTitle)

  expect(bottomNote).toBeInTheDocument()
  expect(bottomNote).toHaveTextContent(PROPSSAMPLE.bottomText)
})
