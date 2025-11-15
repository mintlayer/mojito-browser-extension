import { render, screen, waitFor } from '@testing-library/react'
import { act } from 'react'
import {
  Link,
  MemoryRouter,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'

import {
  AccountProvider,
  SettingsProvider,
  MintlayerProvider,
  BitcoinProvider,
} from '@Contexts'
import Header from './Header'
import { expect } from '@playwright/test'

global.AbortSignal = global.AbortSignal || {}

global.AbortSignal.timeout = jest.fn((timeout) => {
  const controller = new AbortController()
  setTimeout(() => controller.abort(), timeout)
  return controller.signal
})

const toggleNetworkType = jest.fn()

const setup = async (location, mode = 'default') => {
  const valueDefaul = {
    isAccountUnlocked: () => true,
    logout: jest.fn(),
    setSliderMenuOpen: jest.fn(),
    addresses: {
      mlAddresses: ['address'],
    },
  }

  const valueOpenMenu = {
    isAccountUnlocked: () => true,
    logout: jest.fn(),
    setSliderMenuOpen: jest.fn(),
    sliderMenuOpen: true,
    addresses: {
      mlAddresses: ['address'],
    },
  }

  const mintlayerProviderValue = {
    currentMlAddresses: {
      mlReceivingAddresses: ['address'],
      mlChangeAddresses: ['address'],
    },
    setAllDataFetching: jest.fn(),
  }

  const PreviousPage = () => {
    location = useLocation()
    return (
      <div data-testid="prev-page">
        <Link
          to="/next-page"
          data-testid="next-page-link"
        ></Link>
      </div>
    )
  }

  const NextPage = () => {
    location = useLocation()

    return (
      <div data-testid="next-page">
        <Header />
      </div>
    )
  }

  const value = mode === 'default' ? valueDefaul : valueOpenMenu

  const memoryRouterFeature = {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_partialHydration: true,
  }

  render(
    <AccountProvider value={value}>
      <SettingsProvider value={{ networkType: 'testnet', toggleNetworkType }}>
        <MintlayerProvider value={mintlayerProviderValue}>
          <BitcoinProvider>
            <MemoryRouter
              initialEntries={['/']}
              future={memoryRouterFeature}
            >
              <Routes>
                <Route
                  path="/next-page"
                  element={<NextPage />}
                />
                <Route
                  exact
                  path="/"
                  element={<PreviousPage />}
                />
              </Routes>
            </MemoryRouter>
          </BitcoinProvider>
        </MintlayerProvider>
      </SettingsProvider>
    </AccountProvider>,
  )

  return { value }
}

test('Header component, renders a page before, navigate to Header and go back', async () => {
  await setup()

  const nextPageLinkComponent = screen.getByTestId('next-page-link')

  await waitFor(async () => {
    expect(nextPageLinkComponent).toBeInTheDocument()
  })

  act(() => {
    nextPageLinkComponent.click()
  })

  const nextPageComponent = screen.getByTestId('next-page')
  const buttons = screen.getAllByTestId('button')
  expect(nextPageComponent).toBeInTheDocument()

  expect(nextPageComponent).toBeInTheDocument()

  act(() => {
    buttons[0].click()
  })

  const prevPageComponent = screen.getByTestId('prev-page')
  expect(prevPageComponent).toBeInTheDocument()
})

test('Header component, navigate to Header and open menu', async () => {
  const { value } = await setup(false, 'open')

  const nextPageLinkComponent = screen.getByTestId('next-page-link')

  await waitFor(async () => {
    expect(nextPageLinkComponent).toBeInTheDocument()
  })

  act(() => {
    nextPageLinkComponent.click()
  })

  const nextPageComponent = screen.getByTestId('next-page')
  const buttons = screen.getAllByTestId('button')
  expect(nextPageComponent).toBeInTheDocument()

  act(() => {
    buttons[1].click()
  })

  await waitFor(async () => {
    expect(value.setSliderMenuOpen).toBeCalled()
  })

  const backdrop = screen.getByTestId('backdrop')
  const sliderMenu = screen.getByTestId('slider-menu')

  expect(backdrop).toBeInTheDocument()
  expect(sliderMenu).toBeInTheDocument()

  const logoutButton = screen.getByTestId('navigation-logout')
  const expandViewButton = screen.getByTestId('navigation-expand-view')
  expect(logoutButton).toBeInTheDocument()
  expect(expandViewButton).toBeInTheDocument()

  act(() => {
    logoutButton.click()
  })

  await waitFor(async () => {
    expect(value.logout).toBeCalled()
  })
})
