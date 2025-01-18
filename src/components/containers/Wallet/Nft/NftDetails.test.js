import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import NftDetails from './NftDetails'
import { SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

const mockNft = {
  token_id: '1',
  data: {
    name: { string: 'Test NFT' },
    icon_uri: { string: 'ipfs://test-icon' },
    description: { string: 'Test Description' },
    ticker: { string: 'TEST' },
  },
  destination: 'Test Address',
}

const renderWithContext = (ui, { providerProps, ...renderOptions }) => {
  return render(
    <SettingsContext.Provider {...providerProps}>
      {ui}
    </SettingsContext.Provider>,
    renderOptions,
  )
}

describe('NftDetails', () => {
  const providerProps = {
    value: {
      networkType: AppInfo.NETWORK_TYPES.TESTNET,
    },
  }

  test('renders the NftDetails component', () => {
    renderWithContext(<NftDetails nft={mockNft} />, { providerProps })

    expect(screen.getByTestId('nft-details')).toBeInTheDocument()
    expect(screen.getByRole('img')).toHaveAttribute(
      'src',
      'https://gateway.ipfs.io/ipfs/test-icon',
    )

    expect(screen.getAllByTestId('nft-details-item')).toHaveLength(5)
    expect(screen.getAllByTestId('nft-details-item-title')).toHaveLength(5)
    expect(screen.getAllByTestId('nft-details-item-content')).toHaveLength(5)

    expect(screen.getByText('Test NFT')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('TEST')).toBeInTheDocument()
    expect(screen.getByText('Test Address')).toBeInTheDocument()
  })

  test('calls handleSend when Send button is clicked', () => {
    const handleSend = jest.fn()
    renderWithContext(
      <NftDetails
        nft={mockNft}
        handleSend={handleSend}
      />,
      { providerProps },
    )

    fireEvent.click(screen.getByText('Send'))
    expect(handleSend).toHaveBeenCalled()
  })

  test('renders the correct explorer link', () => {
    renderWithContext(<NftDetails nft={mockNft} />, { providerProps })

    const explorerLink = screen.getByRole('link', {
      name: /Open In Block Explorer/i,
    })
    expect(explorerLink).toHaveAttribute(
      'href',
      'https://lovelace.explorer.mintlayer.org/nft/1',
    )
  })
})
