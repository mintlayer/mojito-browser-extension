import { fireEvent, render, screen } from '@testing-library/react'
import { TransactionContext } from '@Contexts'
import InputBTC from './InputBTC'

const renderInputBTC = () => {
  const changes = []
  render(
    <TransactionContext.Provider value={{}}>
      <InputBTC
        onChangeHandle={(ev) =>
          changes.push({
            value: ev.target.value,
            parsedValue: ev.target.parsedValue,
          })
        }
      />
    </TransactionContext.Provider>,
  )
  return { changes, input: screen.getByTestId('input') }
}

test('strips thousands separators from a pasted value', () => {
  const { changes, input } = renderInputBTC()

  fireEvent.change(input, { target: { value: '1,234' } })

  expect(input).toHaveValue('1234')
  expect(changes[0]).toEqual({ value: '1234', parsedValue: 1234 })
})

test('typing a lone decimal separator does not crash and parses to NaN', () => {
  const { changes, input } = renderInputBTC()

  fireEvent.change(input, { target: { value: '.' } })

  expect(input).toHaveValue('.')
  expect(changes[0].parsedValue).toBeNaN()
  expect(changes[0].value).not.toContain('NaN')
})

test('deleting a mid-string separator keeps the parsed value sane', () => {
  const { changes, input } = renderInputBTC()

  // The user deletes the comma from '1,234': the raw value becomes comma-free.
  fireEvent.change(input, { target: { value: '1,234' } })
  expect(input).toHaveValue('1234')
  expect(changes[0]).toEqual({ value: '1234', parsedValue: 1234 })

  // Same for a decimal separator, with the caret left mid-string (position 1):
  // raw '1.234' -> '1234' must stay sane (no NaN, no scrambled output).
  // React dedupes change events with an unchanged DOM value, so the deletion
  // is simulated from the '1.234' state above.
  fireEvent.change(input, { target: { value: '1.234' } })
  expect(input).toHaveValue('1.234')

  fireEvent.change(input, { target: { value: '1234', selectionStart: 1 } })
  expect(input).toHaveValue('1234')
  expect(changes[2]).toEqual({ value: '1234', parsedValue: 1234 })
})
