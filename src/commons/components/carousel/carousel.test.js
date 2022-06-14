import '@testing-library/jest-dom'
import { fireEvent, render, screen } from '@testing-library/react'
import Carousel from './carousel'

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

test('Render Empty Carousel', () => {
  render(<Carousel />)
  expect(screen.getByRole('button', { name: 'back' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'next' })).toBeInTheDocument()

  expect(screen.queryAllByRole('button', { name: 'account' })).toEqual([])
})

test('Render Carousel', () => {
  render(<Carousel {...data} />)
  expect(screen.getByRole('button', { name: 'back' })).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'next' })).toBeInTheDocument()

  data.accounts.forEach((account) => {
    expect(screen.getByText(account.name)).toBeInTheDocument()
  })
})

test('Render Carousel onClick', () => {
  render(<Carousel {...data} />)

  fireEvent.click(screen.getByText('Account Name'))
  expect(data.onClick).toHaveBeenCalled()
  screen.getByText('Account Name')
  expect(screen.getByText('Account Name')).toHaveClass('selected')
})

test('Render Carousel previousSlide', () => {
  render(<Carousel {...data} />)

  const backButton = screen.getByRole('button', { name: 'back' })
  const nextButton = screen.getByRole('button', { name: 'next' })

  fireEvent.click(backButton)
  expect(data.onPrevious).not.toHaveBeenCalled()

  fireEvent.click(nextButton)
  fireEvent.click(backButton)

  expect(data.onPrevious).toHaveBeenCalled()
})

test('Render Carousel nextSlide', () => {
  render(<Carousel {...data} />)
  const nextButton = screen.getByRole('button', { name: 'next' })

  for (let i = 0; i < data.accounts.length; i++) {
    fireEvent.click(nextButton)
  }

  expect(data.onNext).toHaveBeenCalledTimes(data.accounts.length - 1)
  expect(nextButton).toBeDisabled()
})
