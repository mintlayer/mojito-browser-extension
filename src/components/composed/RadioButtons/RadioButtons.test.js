import { render, screen, fireEvent } from '@testing-library/react'

import RadioButtons from './RadioButtons'

const _data = {
  value: undefined,
  options: [
    { name: 'low', value: 'low' },
    { name: 'norm', value: 'norm' },
    { name: 'high', value: 'high' },
  ],
  onSelect: jest.fn(),
}

const _dataColumn = {
  value: undefined,
  options: [
    { name: 'low', value: 'low' },
    { name: 'norm', value: 'norm' },
    { name: 'high', value: 'high' },
  ],
  onSelect: jest.fn(),
  column: true,
}

const setup = ({ data = _data } = {}) => {
  const utils = render(<RadioButtons {...data} />)
  const low = screen.getByRole('button', { name: /low/i })
  const norm = screen.getByRole('button', { name: /norm/i })
  const high = screen.getByRole('button', { name: /high/i })
  return {
    low,
    norm,
    high,
    utils,
  }
}

test('Renders RadioButtons page', () => {
  const { low, norm, high } = setup()

  expect(low).toBeInTheDocument()
  expect(norm).toBeInTheDocument()
  expect(high).toBeInTheDocument()
})

test('Renders RadioButtons and click on low', async () => {
  const { low } = setup()

  fireEvent.click(low)
  expect(_data.onSelect).toHaveBeenCalled()
  expect(low).toHaveClass('alternate')
})

test('Renders RadioButtons and reset selection with new value', async () => {
  const { low, utils } = setup()

  fireEvent.click(low)
  expect(low).toHaveClass('alternate')

  utils.rerender(
    <RadioButtons
      {..._data}
      value={1}
    />,
  )
  expect(screen.getByRole('button', { name: /low/i })).not.toHaveClass(
    'alternate',
  )
})

test('Renders RadioButtons do select and unselected', async () => {
  const { low } = setup()

  fireEvent.click(low)
  expect(_data.onSelect).toHaveBeenCalled()
  expect(low).toHaveClass('alternate')

  fireEvent.click(low)
  expect(_data.onSelect).toHaveBeenCalledTimes(2)
  expect(low).not.toHaveClass('alternate')
})

test('Render Inputs list item', async () => {
  render(<RadioButtons {..._dataColumn} />)
  const component = screen.getByTestId('radio-buttons')

  expect(component).toBeInTheDocument()
  expect(component).toHaveClass('radio-buttons-column')
})
