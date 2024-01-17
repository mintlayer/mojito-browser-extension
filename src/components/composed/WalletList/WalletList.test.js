import { render, screen } from '@testing-library/react'

import WalletList from './WalletList'

const PROPS_MOCK = {
  selectedWallet: [],
  setSelectedWallet: jest.fn(),
  walletTypes: [
    { name: 'low', value: 'low' },
    { name: 'norm', value: 'norm' },
    { name: 'high', value: 'high' },
  ],
}

test('Render wallet list', () => {
  render(<WalletList {...PROPS_MOCK} />)
  const component = screen.getByTestId('centered-layout-container')
  const description = screen.getByTestId('wallet-list-description')
  const optionButtons = screen.getByTestId('option-buttons')

  expect(component).toBeInTheDocument()
  expect(description).toBeInTheDocument()
  expect(description).not.toBeEmptyDOMElement()

  expect(optionButtons).toBeInTheDocument()
})
