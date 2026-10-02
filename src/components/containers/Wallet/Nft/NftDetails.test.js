import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import NftDetails from './NftDetails'
import { SettingsContext } from '@Contexts'
import { AppInfo } from '@Constants'

// The image resolver hits the network — mock it at the hook boundary.
jest.mock('./useNftImage', () => jest.fn())

const useNftImage = require('./useNftImage')

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

  afterEach(() => {
    useNftImage.mockReset()
  })

  test('renders the NftDetails component with the placeholder when no image resolved', () => {
    useNftImage.mockReturnValue(null)

    renderWithContext(<NftDetails nft={mockNft} />, { providerProps })

    expect(screen.getByTestId('nft-details')).toBeInTheDocument()
    // No image resolved: the procedural placeholder letter renders instead.
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
    expect(screen.getByText('T')).toBeInTheDocument()

    expect(screen.getAllByTestId('nft-details-item')).toHaveLength(5)
    expect(screen.getAllByTestId('nft-details-item-title')).toHaveLength(5)
    expect(screen.getAllByTestId('nft-details-item-content')).toHaveLength(5)

    expect(screen.getByText('Test NFT')).toBeInTheDocument()
    expect(screen.getByText('Test Description')).toBeInTheDocument()
    expect(screen.getByText('TEST')).toBeInTheDocument()
    expect(screen.getByText('Test Address')).toBeInTheDocument()
  })

  test('renders the artwork image when one is resolved', () => {
    useNftImage.mockReturnValue('blob:nft-artwork')

    renderWithContext(<NftDetails nft={mockNft} />, { providerProps })

    expect(screen.getByRole('img')).toHaveAttribute('src', 'blob:nft-artwork')
  })

  test('calls handleSend when Send button is clicked', () => {
    useNftImage.mockReturnValue(null)
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
    useNftImage.mockReturnValue(null)
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
