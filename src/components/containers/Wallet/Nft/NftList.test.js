import React from 'react'
import { render, screen } from '@testing-library/react'
import NftList from './NftList'
import { MintlayerContext } from '@Contexts'
import { BrowserRouter } from 'react-router'

const memoryRouterFeature = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_partialHydration: true,
}

const renderWithContext = (ui, { providerProps, ...renderOptions }) => {
  return render(
    <BrowserRouter future={memoryRouterFeature}>
      <MintlayerContext.Provider {...providerProps}>
        {ui}
      </MintlayerContext.Provider>
    </BrowserRouter>,
    renderOptions,
  )
}

describe('NftList', () => {
  const providerProps = {
    value: {
      nftData: [],
      fetchingNft: false,
    },
  }

  test('renders the NftList component', () => {
    renderWithContext(<NftList />, { providerProps })

    expect(screen.getByText('Your current Nft')).toBeInTheDocument()
  })

  test('displays empty list message when no NFTs are present', () => {
    renderWithContext(<NftList />, { providerProps })

    expect(screen.getByText('No NFT in this wallet')).toBeInTheDocument()
  })

  test('displays skeleton loaders when fetching NFTs', () => {
    providerProps.value.fetchingNft = true
    renderWithContext(<NftList />, { providerProps })

    expect(screen.getAllByTestId('card')).toHaveLength(6)
  })

  test('displays NFTs when nftData is present', () => {
    providerProps.value.nftData = [
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
    providerProps.value.fetchingNft = false
    renderWithContext(<NftList />, { providerProps })

    expect(screen.getByText('Test NFT 1')).toBeInTheDocument()
    expect(screen.getByText('Test NFT 2')).toBeInTheDocument()
  })
})
