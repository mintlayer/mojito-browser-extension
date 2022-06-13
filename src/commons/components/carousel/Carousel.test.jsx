/**
 * @jest-environment jsdom
 */
import React from 'react'
import '@testing-library/jest-dom'

import { render, screen, fireEvent } from '@testing-library/react'

import Carousel from './Carousel'

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

test('Render Carousel', () => {
  render(<Carousel {...data} />)
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

  fireEvent.click(screen.getByText('<'))
  expect(data.onPrevious).not.toHaveBeenCalled()

  fireEvent.click(screen.getByText('>'))
  fireEvent.click(screen.getByText('<'))
  expect(data.onPrevious).toHaveBeenCalled()
})

test('Render Carousel nextSlide', () => {
  render(<Carousel {...data} />)

  for (let i = 0; i < data.accounts.length; i++) {
    fireEvent.click(screen.getByText('>'))
  }

  expect(data.onNext).toHaveBeenCalledTimes(data.accounts.length - 1)
  expect(screen.getByText('>')).toBeDisabled()
})
