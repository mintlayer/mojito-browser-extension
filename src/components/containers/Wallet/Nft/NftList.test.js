import React from 'react'
import { render, screen } from '@testing-library/react'
import NftList from './NftList'
import { MintlayerContext, SettingsContext } from '@Contexts'
import { BrowserRouter } from 'react-router'

// The image resolver hits the network — mock it at the hook boundary.
jest.mock('./useNftImage', () => jest.fn(() => null))

const memoryRouterFeature = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_partialHydration: true,
}

const renderWithContext = (ui, { providerProps, ...renderOptions }) => {
  return render(
    <BrowserRouter future={memoryRouterFeature}>
      <MintlayerContext.Provider {...providerProps}>
        <SettingsContext.Provider value={{ networkType: 'mainnet' }}>
          {ui}
        </SettingsContext.Provider>
      </MintlayerContext.Provider>
    </BrowserRouter>,
    renderOptions,
  )
}

describe('NftList', () => {
  const NFT_SAMPLE = [
    {
      token_id: '1',
      data: {
        name: { string: 'Test NFT 1' },
        icon_uri: { string: 'ipfs://test-icon' },
        description: { string: 'Test Description' },
        ticker: { string: 'TEST' },
      },
      destination: 'Test Address',
    },
    {
      token_id: '2',
      data: {
        name: { string: 'Test NFT 2' },
        icon_uri: { string: 'ipfs://test-icon' },
        description: { string: 'Test Description' },
        ticker: { string: 'TEST' },
      },
      destination: 'Test Address',
    },
  ]

  // fresh provider props per test — no shared mutable state
  const buildProviderProps = ({ nftData = [], fetchingNft = false } = {}) => ({
    value: { nftData, fetchingNft },
  })

  test('displays empty list message when no NFTs are present', () => {
    renderWithContext(<NftList />, { providerProps: buildProviderProps() })

    expect(screen.getByTestId('empty-list')).toHaveTextContent(
      'No NFTs in this wallet',
    )
  })

  test('displays skeleton loaders when fetching NFTs', () => {
    renderWithContext(<NftList />, {
      providerProps: buildProviderProps({ fetchingNft: true }),
    })

    expect(screen.getAllByTestId('card')).toHaveLength(6)
  })

  test('displays NFT tiles when nftData is present', () => {
    renderWithContext(<NftList />, {
      providerProps: buildProviderProps({ nftData: NFT_SAMPLE }),
    })

    expect(screen.getAllByTestId('nft-tile')).toHaveLength(2)
    expect(screen.getByText('Test NFT 1')).toBeInTheDocument()
    expect(screen.getByText('Test NFT 2')).toBeInTheDocument()
  })
})
