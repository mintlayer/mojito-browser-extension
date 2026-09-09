import { fireEvent, render, screen } from '@testing-library/react'
import Seg from './Seg'

const setup = (value = 'All') => {
  const onChange = jest.fn()
  const utils = render(
    <Seg
      value={value}
      options={['All', 'BTC', 'ML']}
      onChange={onChange}
    />,
  )
  return { onChange, container: utils.container }
}

test('renders all options', () => {
  render(
    <Seg
      value="All"
      options={['All', 'BTC', 'ML']}
      onChange={() => {}}
    />,
  )
  expect(screen.getByText('All')).toBeInTheDocument()
  expect(screen.getByText('BTC')).toBeInTheDocument()
  expect(screen.getByText('ML')).toBeInTheDocument()
})

test('marks the active option', () => {
  const { container } = setup('BTC')
  const active = container.querySelector('button[class*="on"]')
  expect(active).toHaveTextContent('BTC')
})

test('calls onChange with the clicked value', () => {
  const { onChange } = setup()
  fireEvent.click(screen.getByText('ML'))
  expect(onChange).toHaveBeenCalledWith('ML')
})
