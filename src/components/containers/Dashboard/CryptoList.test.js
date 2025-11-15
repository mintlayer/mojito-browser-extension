import React from 'react'
import { render, fireEvent, screen } from '@testing-library/react'
import { SettingsContext, MintlayerContext } from '@Contexts'
import { CryptoItem, ConnectItem } from './CryptoList'
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

describe('ConnectItem', () => {
  const walletType = {
    name: 'Bitcoin',
    symbol: 'BTC',
    disabled: false,
  }

  const onClick = jest.fn()

  const renderComponent = (networkType) =>
    render(
      <SettingsContext.Provider value={{ networkType }}>
        <MintlayerContext.Provider
          value={{ balanceLoading: false, tokenBalances: [] }}
        >
          <ConnectItem
            walletType={walletType}
            onClick={onClick}
          />
        </MintlayerContext.Provider>
      </SettingsContext.Provider>,
    )

  it('renders the connect item correctly', () => {
    renderComponent('mainnet')

    expect(screen.getByText('Bitcoin (BTC)')).toBeInTheDocument()
    expect(screen.getByText('Add wallet')).toBeInTheDocument()
  })

  it('renders the Mintlayer logo for Mintlayer items', () => {
    const mintlayerWalletType = {
      ...walletType,
      name: 'Mintlayer',
      symbol: 'ML',
    }

    render(
      <SettingsContext.Provider value={{ networkType: 'mainnet' }}>
        <MintlayerContext.Provider
          value={{ balanceLoading: false, tokenBalances: [] }}
        >
          <ConnectItem
            walletType={mintlayerWalletType}
            onClick={onClick}
          />
        </MintlayerContext.Provider>
      </SettingsContext.Provider>,
    )

    expect(screen.getByTestId('logo-round')).toBeInTheDocument()
  })

  it('calls the onClick callback when the item is clicked', () => {
    renderComponent('mainnet')

    fireEvent.click(screen.getByText('Add wallet'))

    expect(onClick).toHaveBeenCalledWith(walletType)
  })

  it('does not disable the item for other wallet types on testnet', () => {
    const otherWalletType = {
      ...walletType,
      name: 'Other',
      symbol: 'OTH',
      disabled: false,
    }

    render(
      <SettingsContext.Provider value={{ networkType: 'testnet' }}>
        <MintlayerContext.Provider
          value={{ balanceLoading: false, tokenBalances: [] }}
        >
          <ConnectItem
            walletType={otherWalletType}
            onClick={onClick}
          />
        </MintlayerContext.Provider>
      </SettingsContext.Provider>,
    )

    expect(screen.getByText('Add wallet')).toBeInTheDocument()
    expect(screen.getByTestId('connect-item')).not.toHaveClass('disabled')
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
  const onConnectItemClick = jest.fn()

  //TDOO: enable this test when mainnet is ready
  // const renderComponent = (networkType) =>
  //   render(
  //     <AccountContext.Provider value={{ walletDataLoading: false }}>
  //       <SettingsContext.Provider value={{ networkType }}>
  //         <CryptoList
  //           cryptoList={cryptoList}
  //           colorList={colorList}
  //           onWalletItemClick={onWalletItemClick}
  //           onConnectItemClick={onConnectItemClick}
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
            onConnectItemClick={onConnectItemClick}
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

  it('calls the onConnectItemClick callback when the add wallet item is clicked', () => {
    renderEmptyComponent('mainnet')

    fireEvent.click(screen.getAllByText('Add wallet')[0])

    expect(onConnectItemClick).toHaveBeenCalled()
  })
})
