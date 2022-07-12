import { render, screen, fireEvent } from '@testing-library/react'

import FeeButtons from './index'

const _data = {
  onSelect: jest.fn(),
}

const setup = ({ data = _data } = {}) => {
  const utils = render(<FeeButtons {...data} />)
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

test('Renders FeeButtons page', () => {
  const { low, norm, high } = setup()

  expect(low).toBeInTheDocument()
  expect(norm).toBeInTheDocument()
  expect(high).toBeInTheDocument()
})

test('Renders FeeButtons page and click on low', async () => {
  const { low } = setup()

  fireEvent.click(low)
  expect(_data.onSelect).toHaveBeenCalled()
  expect(low).toHaveClass('alternate')
})

test('Renders FeeButtons page clear option', async () => {
  const { low, utils } = setup()

  fireEvent.click(low)
  expect(low).toHaveClass('alternate')

  utils.rerender(<FeeButtons clear />)
  expect(screen.getByRole('button', { name: /low/i })).not.toHaveClass(
    'alternate',
  )
})

test('Renders FeeButtons page and unselected', async () => {
  const { low } = setup()

  fireEvent.click(low)
  expect(_data.onSelect).toHaveBeenCalled()
  expect(low).toHaveClass('alternate')

  fireEvent.click(low)
  expect(_data.onSelect).toHaveBeenCalledTimes(2)
  expect(low).not.toHaveClass('alternate')
})
