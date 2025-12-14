import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router'
import { SettingsProvider } from '@Contexts'
import NftItem from './Nft'

const mockNft = {
  token_id: '1',
  data: {
    name: { string: 'Test NFT' },
    icon_uri: { string: 'ipfs://test-icon' },
    description: { string: 'Test Description' },
    ticker: { string: 'TEST' },
  },
}

const memoryRouterFeature = {
  v7_startTransition: true,
  v7_relativeSplatPath: true,
  v7_partialHydration: true,
}

describe('NftItem', () => {
  test('renders the NftItem component', () => {
    render(
      <BrowserRouter future={memoryRouterFeature}>
        <SettingsProvider>
          <NftItem nft={mockNft} />
        </SettingsProvider>
      </BrowserRouter>,
    )

    expect(screen.getByTestId('transaction')).toBeInTheDocument()
    expect(screen.getByTestId('transaction-icon')).toBeInTheDocument()
    expect(screen.getByTestId('transaction-otherPart')).toHaveTextContent(
      'Test NFT',
    )
    expect(screen.getByTestId('transaction-date')).toHaveTextContent(
      'Test Description',
    )
    expect(screen.getByTestId('transaction-amount')).toHaveTextContent(
      'Tiker: TEST',
    )
  })

  test('opens detail popup on click', () => {
    render(
      <BrowserRouter future={memoryRouterFeature}>
        <SettingsProvider>
          <NftItem nft={mockNft} />
        </SettingsProvider>
      </BrowserRouter>,
    )

    fireEvent.click(screen.getByTestId('transaction'))
    expect(screen.getByTestId('popup')).toBeInTheDocument()
    expect(screen.getByTestId('nft-details')).toBeInTheDocument()
  })
})
