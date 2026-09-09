import { render, screen } from '@testing-library/react'
import TxRow from './TxRow'

const tx = {
  type: 'receive' as const,
  sym: 'BTC',
  amount: 0.0052,
  when: 'Today, 09:14',
  status: 'Confirming',
  conf: '2/6',
}

test('renders label, amount and status', () => {
  render(<TxRow t={tx} />)
  expect(screen.getByText('Received')).toBeInTheDocument()
  expect(screen.getByText('+0.0052 BTC')).toBeInTheDocument()
  expect(screen.getByText('Confirming')).toBeInTheDocument()
})

test('renders outgoing amounts with a minus sign', () => {
  render(<TxRow t={{ ...tx, type: 'send', sym: 'ML', amount: 120 }} />)
  expect(screen.getByText('Sent')).toBeInTheDocument()
  expect(screen.getByText('−120 ML')).toBeInTheDocument()
})

test('renders the NFT name for nft type', () => {
  render(
    <TxRow
      t={{ ...tx, type: 'nft', name: 'Cryptobeat #341', amount: undefined }}
    />,
  )
  expect(screen.getByText('Cryptobeat #341')).toBeInTheDocument()
})
