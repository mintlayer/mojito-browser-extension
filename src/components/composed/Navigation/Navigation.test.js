import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navigation from './Navigation'
import { AccountContext } from '@Contexts'

// Mock the chrome object
global.chrome = {
  runtime: {
    getURL: jest.fn((path) => `chrome-extension://mocked-id/${path}`),
  },
}

const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const mockIsAccountUnlocked = jest.fn()
const mockLogout = jest.fn()
const mockSetSliderMenuOpen = jest.fn()

const renderWithProviders = (ui, { providerProps, ...renderOptions }) => {
  return render(
    <MemoryRouter>
      <AccountContext.Provider {...providerProps}>{ui}</AccountContext.Provider>
    </MemoryRouter>,
    renderOptions,
  )
}

describe('Navigation Component', () => {
  let providerProps

  beforeEach(() => {
    providerProps = {
      value: {
        isAccountUnlocked: mockIsAccountUnlocked,
        logout: mockLogout,
        isExtended: false,
        sliderMenuOpen: false,
        setSliderMenuOpen: mockSetSliderMenuOpen,
      },
    }
  })

  test('renders navigation items when account is unlocked', () => {
    mockIsAccountUnlocked.mockReturnValue(true)

    renderWithProviders(<Navigation />, { providerProps })

    expect(screen.getByText('Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.getByTestId('navigation-logout')).toBeInTheDocument()
  })

  test('renders navigation items when account is locked', () => {
    mockIsAccountUnlocked.mockReturnValue(false)

    renderWithProviders(<Navigation />, { providerProps })

    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByText('Create/Restore Wallet')).toBeInTheDocument()
    expect(screen.getByText('Settings')).toBeInTheDocument()
    expect(screen.queryByTestId('navigation-logout')).not.toBeInTheDocument()
  })

  test('clicking on Dashboard navigates to /dashboard', () => {
    mockIsAccountUnlocked.mockReturnValue(true)

    renderWithProviders(<Navigation />, { providerProps })

    fireEvent.click(screen.getByText('Dashboard'))
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  test('clicking on Settings navigates to /settings', () => {
    mockIsAccountUnlocked.mockReturnValue(true)

    renderWithProviders(<Navigation />, { providerProps })

    fireEvent.click(screen.getByText('Settings'))
    expect(mockNavigate).toHaveBeenCalledWith('/settings')
  })

  test('clicking on Login navigates to /', () => {
    mockIsAccountUnlocked.mockReturnValue(false)

    renderWithProviders(<Navigation />, { providerProps })

    fireEvent.click(screen.getByText('Login'))
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })

  test('clicking on Create/Restore Wallet navigates to /create-restore', () => {
    mockIsAccountUnlocked.mockReturnValue(false)

    renderWithProviders(<Navigation />, { providerProps })

    fireEvent.click(screen.getByText('Create/Restore Wallet'))
    expect(mockNavigate).toHaveBeenCalledWith('/create-restore')
  })

  test('clicking on Expand view opens a new window', () => {
    global.open = jest.fn()

    renderWithProviders(<Navigation />, { providerProps })

    fireEvent.click(screen.getByTestId('navigation-expand-view'))
    expect(global.open).toHaveBeenCalled()
  })

  test('clicking on Logout calls logout function and navigates to /', () => {
    mockIsAccountUnlocked.mockReturnValue(true)

    renderWithProviders(<Navigation />, { providerProps })

    fireEvent.click(screen.getByTestId('navigation-logout'))
    expect(mockLogout).toHaveBeenCalled()
    expect(mockNavigate).toHaveBeenCalledWith('/')
  })
})
