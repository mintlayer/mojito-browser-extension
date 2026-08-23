import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { SettingsContext, MintlayerContext } from '@Contexts'
import { CryptoItem } from './CryptoList'
import CryptoList from './CryptoList'

describe('CryptoItem', () => {
  const colorList = {
    btc: '#f7931a',
    ml: '#00bfff',
  }

  const item = {
    name: 'Bitcoin',
    symbol: 'BTC',
    balance: 1.23456789,
    exchangeRate: 50000,
    historyRates: {
      '2022-01-01': 40000,
      '2022-01-02': 45000,
      '2022-01-03': 50000,
    },
    change24h: 1.23,
  }

  const onClickItem = jest.fn()

  const renderComponent = (networkType, balanceLoading = false) =>
    render(
      <SettingsContext.Provider value={{ networkType }}>
        <MintlayerContext.Provider
          value={{ balanceLoading: balanceLoading, tokenBalances: [] }}
        >
          <CryptoItem
            colorList={colorList}
            onClickItem={onClickItem}
            item={item}
          />
        </MintlayerContext.Provider>
      </SettingsContext.Provider>,
    )

  it('renders the crypto item correctly', () => {
    renderComponent('mainnet')
    const component = screen.getByTestId('crypto-item')

    expect(component).toBeInTheDocument()
    expect(component).toHaveTextContent('1.23456789')
    expect(component).toHaveTextContent('61728.39')
    expect(component).toHaveTextContent('1.23%')
  })

  // it('renders the crypto item with data loading', () => {
  //   renderComponent('mainnet', true)
  //   const skeletonLoading = screen.getByTestId('card')

  //   expect(skeletonLoading).toBeInTheDocument()
  // })

  it('renders the Mintlayer logo for Mintlayer items', () => {
    const mintlayerItem = {
      ...item,
      name: 'Mintlayer',
      symbol: 'ML',
    }

    render(
      <SettingsContext.Provider value={{ networkType: 'mainnet' }}>
        <MintlayerContext.Provider
          value={{ balanceLoading: false, tokenBalances: [] }}
        >
          <CryptoItem
            colorList={colorList}
            onClickItem={onClickItem}
            item={mintlayerItem}
          />
        </MintlayerContext.Provider>
      </SettingsContext.Provider>,
    )

    expect(screen.getByTestId('logo-round')).toBeInTheDocument()
  })

  it('calls the onClickItem callback when the item is clicked', () => {
    renderComponent('mainnet')

    fireEvent.click(screen.getByTestId('crypto-item'))

    expect(onClickItem).toHaveBeenCalledWith(item)
  })

  it('displays the balance in testnet mode', () => {
    renderComponent('testnet')
    const component = screen.getByTestId('crypto-item')

    expect(component).toHaveTextContent('1.23456789')
  })

  it('displays the balance in mainnet mode', () => {
    renderComponent('mainnet')
    const component = screen.getByTestId('crypto-item')

    expect(component).toHaveTextContent('61728.39')
  })
})

describe('CryptoList', () => {
  const colorList = {
    btc: '#f7931a',
    ml: '#00bfff',
  }

  //TDOO: enable this test when mainnet is ready

  // const cryptoList = [
  //   {
  //     name: 'Bitcoin',
  //     symbol: 'BTC',
  //     balance: 1.23456789,
  //     exchangeRate: 50000,
  //     historyRates: {
  //       '2022-01-01': 40000,
  //       '2022-01-02': 45000,
  //       '2022-01-03': 50000,
  //     },
  //     change24h: 1.23,
  //   },
  //   {
  //     name: 'Mintlayer',
  //     symbol: 'ML',
  //     balance: 100,
  //     exchangeRate: 1,
  //     historyRates: {
  //       '2022-01-01': 1,
  //       '2022-01-02': 2,
  //       '2022-01-03': 3,
  //     },
  //     change24h: -4.56,
  //   },
  // ]

  const onWalletItemClick = jest.fn()

  //TDOO: enable this test when mainnet is ready
  // const renderComponent = (networkType) =>
  //   render(
  //     <AccountContext.Provider value={{ walletDataLoading: false }}>
  //       <SettingsContext.Provider value={{ networkType }}>
  //         <CryptoList
  //           cryptoList={cryptoList}
  //           colorList={colorList}
  //           onWalletItemClick={onWalletItemClick}
  //         />
  //       </SettingsContext.Provider>
  //       ,
  //     </AccountContext.Provider>,
  //   )

  const renderEmptyComponent = (networkType) =>
    render(
      <SettingsContext.Provider value={{ networkType }}>
        <MintlayerContext.Provider
          value={{ balanceLoading: false, tokenBalances: [] }}
        >
          <CryptoList
            cryptoList={[]}
            colorList={colorList}
            onWalletItemClick={onWalletItemClick}
          />
        </MintlayerContext.Provider>
      </SettingsContext.Provider>,
    )

  //TDOO: enable this test when mainnet is ready

  // it('renders the list of crypto items', () => {
  //   renderComponent('mainnet')

  //   const items = screen.getAllByTestId('crypto-item')
  //   expect(items).toHaveLength(2)
  // })

  // it('calls the onWalletItemClick callback when a crypto item is clicked', () => {
  //   renderComponent('mainnet')
  //   const items = screen.getAllByTestId('crypto-item')
  //   fireEvent.click(items[0])

  //   expect(onWalletItemClick).toHaveBeenCalledWith(cryptoList[0])
  //   expect(onWalletItemClick).toHaveBeenCalledTimes(1)

  //   fireEvent.click(items[1])
  //   expect(onWalletItemClick).toHaveBeenCalledWith(cryptoList[1])
  //   expect(onWalletItemClick).toHaveBeenCalledTimes(2)
  // })

  const coin = {
    id: 'Mintlayer',
    name: 'Mintlayer',
    symbol: 'ML',
    balance: 100,
    exchangeRate: 1,
    historyRates: [],
    change24h: 0,
    type: 'coin',
  }

  const token = {
    id: 'token-id',
    name: 'OHFORF',
    symbol: 'OHFORF',
    balance: 45,
    change24h: 0,
    historyRates: [],
    type: 'token',
  }

  const renderWithList = (list) =>
    render(
      <SettingsContext.Provider value={{ networkType: 'mainnet' }}>
        <MintlayerContext.Provider
          value={{ balanceLoading: false, tokenBalances: [] }}
        >
          <CryptoList
            cryptoList={list}
            colorList={colorList}
            onWalletItemClick={onWalletItemClick}
          />
        </MintlayerContext.Provider>
      </SettingsContext.Provider>,
    )

  it('splits coins and tokens into separate groups', () => {
    renderWithList([coin, token])

    expect(screen.getByText('Coins')).toBeInTheDocument()
    expect(screen.getByText('Tokens')).toBeInTheDocument()

    const groups = document.querySelectorAll('.crypto-group')
    expect(groups).toHaveLength(2)
    expect(groups[0]).toHaveTextContent('Mintlayer (ML)')
    expect(groups[1]).toHaveTextContent('OHFORF (OHFORF)')
  })

  it('hides the group titles when there are no tokens', () => {
    renderWithList([coin])

    expect(screen.queryByText('Coins')).not.toBeInTheDocument()
    expect(screen.queryByText('Tokens')).not.toBeInTheDocument()
    expect(document.querySelectorAll('.crypto-group')).toHaveLength(1)
  })
})
