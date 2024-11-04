import { fireEvent, render, screen } from '@testing-library/react'
import Carousel from './Carousel'
import { AccountContext } from '@Contexts'

const data = {
  accounts: [
    { id: '1', name: 'Account Name' },
    { id: '2', name: 'Account Name 2' },
    { id: '3', name: 'Account Name 3' },
    { id: '4', name: 'Account Name 4' },
  ],
  onClick: jest.fn(),
  onPrevious: jest.fn(),
  onNext: jest.fn(),
}

const mockContext = {
  logout: jest.fn(),
  verifyAccountsExistence: jest.fn(),
  deletingAccount: { id: '1', addresses: ['address1'] },
  setRemoveAccountPopupOpen: jest.fn(),
}

test('Render Empty Carousel', () => {
  render(
    <AccountContext.Provider value={mockContext}>
      <Carousel />
    </AccountContext.Provider>,
  )
  const backButton = screen.getByTestId('back')
  const nextButton = screen.getByTestId('next')

  expect(backButton).toBeInTheDocument()
  expect(nextButton).toBeInTheDocument()

  const accounts = screen.queryAllByTestId('carousel-item')
  expect(accounts).toEqual([])
})

test('Render Carousel', () => {
  render(
    <AccountContext.Provider value={mockContext}>
      <Carousel {...data} />
    </AccountContext.Provider>,
  )

  const backButton = screen.getByTestId('back')
  const nextButton = screen.getByTestId('next')
  expect(backButton).toBeInTheDocument()
  expect(nextButton).toBeInTheDocument()

  data.accounts.forEach((account) => {
    expect(screen.getByText(account.name)).toBeInTheDocument()
  })
})

test('Render Carousel onClick', () => {
  render(
    <AccountContext.Provider value={mockContext}>
      <Carousel {...data} />
    </AccountContext.Provider>,
  )

  const items = screen.getAllByTestId('carousel-item')
  fireEvent.click(items[0])
  expect(data.onClick).toHaveBeenCalled()
  const buttons = screen.getAllByTestId('carousel-item-button')
  expect(buttons[0]).toHaveClass('selected')
})

test('Render Carousel previousSlide', () => {
  render(
    <AccountContext.Provider value={mockContext}>
      <Carousel {...data} />
    </AccountContext.Provider>,
  )

  const backButton = screen.getByTestId('back')
  const nextButton = screen.getByTestId('next')

  fireEvent.click(backButton)
  expect(data.onPrevious).not.toHaveBeenCalled()

  fireEvent.click(nextButton)
  fireEvent.click(backButton)

  expect(data.onPrevious).toHaveBeenCalled()
})

test('Render Carousel nextSlide', () => {
  render(
    <AccountContext.Provider value={mockContext}>
      <Carousel {...data} />
    </AccountContext.Provider>,
  )
  const nextButton = screen.getByTestId('next')

  for (let i = 0; i < data.accounts.length; i++) {
    fireEvent.click(nextButton)
  }

  expect(data.onNext).toHaveBeenCalledTimes(data.accounts.length - 1)
  expect(nextButton).toBeDisabled()
})
