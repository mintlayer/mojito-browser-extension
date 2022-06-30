import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import WalletPage from './index'

function setupFetchStub(data) {
  return function fetchStub(_url) {
    return new Promise((resolve) => {
      resolve({
        json: () =>
          Promise.resolve({
            data,
          }),
      })
    })
  }
}

test('Renders transactions page', () => {
  render(<WalletPage />, { wrapper: MemoryRouter })
  const WalletPageComponent = screen.getByTestId('wallet-page')
  expect(WalletPageComponent).toBeInTheDocument()
})

test('doesnt really fetch', async () => {
  render(<WalletPage />, { wrapper: MemoryRouter })
  const fakeData = { fake: 'data' }
  jest.spyOn(global, 'fetch').mockImplementation(setupFetchStub(fakeData))

  const res = await fetch('anyUrl')
  const json = await res.json()
  expect(json).toEqual({ data: fakeData })

  global.fetch.mockClear()
})
