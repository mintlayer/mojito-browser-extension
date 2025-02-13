import { render, screen, fireEvent } from '@testing-library/react'
import { AccountContext } from '@Contexts'
import AddWallet from './AddWallet'
import { BrowserRouter as Router } from 'react-router-dom'

describe('AddWallet', () => {
  const mockContext = {
    accountID: 'test-account-id',
    setWalletInfo: jest.fn(),
  }

  const mockPropsEmpty = {
    account: { seed: {} },
    walletType: {},
    setAllowClosing: jest.fn(),
    setOpenConnectConfirmation: jest.fn(),
  }

  const mockProps = {
    account: {
      seed: {
        encryptedMlTestnetPrivateKey: 'test-encrypted-ml-testnet-private-key',
      },
      walletType: {},
      setAllowClosing: jest.fn(),
      setOpenConnectConfirmation: jest.fn(),
    },
  }

  const memoryRouterFeature = {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
    v7_partialHydration: true,
  }

  test('renders without crashing', () => {
    render(
      <AccountContext.Provider value={mockContext}>
        <Router future={memoryRouterFeature}>
          <AddWallet {...mockPropsEmpty} />
        </Router>
      </AccountContext.Provider>,
    )
  })

  test('renders description paragraphs when step is 1', () => {
    render(
      <AccountContext.Provider value={mockContext}>
        <Router future={memoryRouterFeature}>
          <AddWallet {...mockPropsEmpty} />
        </Router>
      </AccountContext.Provider>,
    )

    const descriptionParagraphs = screen.getAllByTestId('description-paragraph')

    expect(descriptionParagraphs.length).toBe(2)
    descriptionParagraphs.forEach((paragraph) => {
      expect(paragraph).not.toBeEmptyDOMElement()
    })
  })

  test('renders InputList when step is 2', () => {
    render(
      <AccountContext.Provider value={mockContext}>
        <Router future={memoryRouterFeature}>
          <AddWallet {...mockPropsEmpty} />
        </Router>
      </AccountContext.Provider>,
    )
    const submitButton = screen.getByText('Next')
    fireEvent.click(submitButton)
    const inputList = screen.getByTestId('inputs-list')
    expect(inputList).toBeInTheDocument()

    const fields = screen.getAllByTestId('inputs-list-item')
    expect(fields.length).toBe(12)

    const inputs = screen.getAllByTestId('input')
    expect(inputs.length).toBe(12)

    inputs.forEach((input) => {
      fireEvent.change(input, { target: { value: 'test' } })
    })

    inputs.forEach((input) => {
      expect(input.value).toBe('test')
      expect(input).toHaveClass('valid')
    })
  })

  test('renders password field and submit button when step is 3', async () => {
    render(
      <AccountContext.Provider value={mockContext}>
        <Router future={memoryRouterFeature}>
          <AddWallet {...mockProps} />
        </Router>
      </AccountContext.Provider>,
    )

    const label = screen.getByTestId('label')
    const passwordField = screen.getByTestId('input')

    expect(label).toBeInTheDocument()
    expect(label).toHaveTextContent('Enter your password')

    expect(passwordField).toBeInTheDocument()

    const submitButton = screen.getByTestId('button')
    expect(submitButton).toBeInTheDocument()
    expect(submitButton).toHaveTextContent('Add Wallet')
  })

  test('changes step on submit button click', () => {
    render(
      <AccountContext.Provider value={mockContext}>
        <Router future={memoryRouterFeature}>
          <AddWallet {...mockPropsEmpty} />
        </Router>
      </AccountContext.Provider>,
    )

    const submitButton = screen.getByText('Next')
    fireEvent.click(submitButton)

    expect(submitButton).toBeInTheDocument()

    const inputList = screen.getByTestId('inputs-list')
    expect(inputList).toBeInTheDocument()
  })
})
