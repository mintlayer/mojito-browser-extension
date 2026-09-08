import { render, screen } from '@testing-library/react'
import ChainBadge from './ChainBadge'

test('ChainBadge renders the uppercased chain', () => {
  render(<ChainBadge chain="Bitcoin" />)
  expect(screen.getByTestId('chain-badge')).toHaveTextContent('BITCOIN')
})

test('unknown chains fall back to a neutral style', () => {
  render(<ChainBadge chain="Unknownchain" />)
  expect(screen.getByTestId('chain-badge')).toHaveTextContent('UNKNOWNCHAIN')
})
