import { render, screen, fireEvent } from '@testing-library/react'

import OptionButtons from './OptionButtons'

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

const _dataMultiple = {
  value: [],
  options: [
    { name: 'low', value: 'low' },
    { name: 'norm', value: 'norm' },
    { name: 'high', value: 'high' },
  ],
  onSelect: jest.fn(),
  multiple: true,
}

const setup = ({ data = _data } = {}) => {
  const utils = render(<OptionButtons {...data} />)
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
    <OptionButtons
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
  render(<OptionButtons {..._dataColumn} />)
  const component = screen.getByTestId('option-buttons')

  expect(component).toBeInTheDocument()
  expect(component).toHaveClass('option-buttons-column')
})

test('Render multiple selection', async () => {
  render(<OptionButtons {..._dataMultiple} />)

  const low = screen.getByRole('button', { name: /low/i })
  const norm = screen.getByRole('button', { name: /norm/i })
  const high = screen.getByRole('button', { name: /high/i })

  fireEvent.click(low)
  fireEvent.click(norm)
  fireEvent.click(high)
  expect(_dataMultiple.onSelect).toHaveBeenCalledTimes(3)
  expect(low).toHaveClass('alternate')
  expect(norm).toHaveClass('alternate')
  expect(high).toHaveClass('alternate')

  fireEvent.click(norm)
  expect(_dataMultiple.onSelect).toHaveBeenCalledTimes(4)
  expect(norm).not.toHaveClass('alternate')
})
