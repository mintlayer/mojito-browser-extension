import { render, screen, fireEvent } from '@testing-library/react'
import AccountCard from './AccountCard.tsx'

const account = { id: '1', name: 'My Wallet' }
const gradient = 'linear-gradient(135deg, #a8e6cf, #f9e79f)'

describe('AccountCard', () => {
  it('renders account name', () => {
    render(
      <ul>
        <AccountCard
          account={account}
          gradient={gradient}
          onSelect={jest.fn()}
          onDelete={jest.fn()}
        />
      </ul>,
    )
    expect(screen.getByText('My Wallet')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = jest.fn()
    render(
      <ul>
        <AccountCard
          account={account}
          gradient={gradient}
          onSelect={onSelect}
          onDelete={jest.fn()}
        />
      </ul>,
    )
    fireEvent.click(screen.getByTestId('carousel-item'))
    expect(onSelect).toHaveBeenCalledWith(account)
  })

  it('calls onDelete when delete button clicked', () => {
    const onSelect = jest.fn()
    const onDelete = jest.fn()
    render(
      <ul>
        <AccountCard
          account={account}
          gradient={gradient}
          onSelect={onSelect}
          onDelete={onDelete}
        />
      </ul>,
    )
    fireEvent.click(screen.getByTestId('delete-wallet-button'))
    expect(onDelete).toHaveBeenCalled()
  })
})
