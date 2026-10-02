import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { SettingsProvider } from '@Contexts'
import NftItem from './Nft'

// The image resolver hits the network — mock it at the hook boundary.
jest.mock('./useNftImage', () => jest.fn())

const useNftImage = require('./useNftImage')

const mockNft = {
  token_id: 'tmltk1test',
  data: {
    name: { string: 'Test NFT' },
    icon_uri: { string: 'ipfs://test-icon' },
    media_uri: { string: 'ipfs://test-media' },
    description: { string: 'Test Description' },
    ticker: { string: 'TEST' },
  },
}

const memoryRouterFeature = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_partialHydration: true,
}

const renderTile = () =>
  render(
    <BrowserRouter future={memoryRouterFeature}>
      <SettingsProvider>
        <NftItem nft={mockNft} />
      </SettingsProvider>
    </BrowserRouter>,
  )

describe('NftItem', () => {
  afterEach(() => {
    useNftImage.mockReset()
  })

  test('renders the tile with name and ticker', () => {
    useNftImage.mockReturnValue(null)

    renderTile()

    expect(screen.getByTestId('nft-tile')).toBeInTheDocument()
    expect(screen.getByTestId('nft-image')).toBeInTheDocument()
    // No image resolved: the procedural fallback letter renders instead.
    expect(screen.getByTestId('nft-image')).toHaveTextContent('T')
    expect(screen.getByTestId('nft-name')).toHaveTextContent('Test NFT')
    expect(screen.getByTestId('nft-ticker')).toHaveTextContent('TEST')
  })

  test('renders the image when one is resolved', () => {
    useNftImage.mockReturnValue('blob:nft-image')

    renderTile()

    expect(screen.getByAltText('Test NFT')).toHaveAttribute(
      'src',
      'blob:nft-image',
    )
  })

  test('opens the details popup on click', () => {
    useNftImage.mockReturnValue(null)

    renderTile()

    fireEvent.click(screen.getByTestId('nft-tile'))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(screen.getByTestId('nft-details')).toBeInTheDocument()
  })
})
