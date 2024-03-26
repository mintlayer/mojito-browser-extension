import { getRate, getOneDayAgoRate, getOneDayAgoHist } from './ExchangeRates'

test('getRate makes correct API call', async () => {
  const crypto = 'btc'
  const fiat = 'usd'

  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve('50000'),
    }),
  )

  const response = await getRate(crypto, fiat)

  expect(response).toEqual('50000')
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('getOneDayAgoRate makes correct API call', async () => {
  const crypto = 'btc'
  const fiat = 'usd'

  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve('50000'),
    }),
  )

  const response = await getOneDayAgoRate(crypto, fiat)

  expect(response).toEqual('50000')
  expect(fetch).toHaveBeenCalledTimes(1)
})

test('getOneDayAgoHist makes correct API call', async () => {
  const crypto = 'btc'
  const fiat = 'usd'

  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      text: () => Promise.resolve('50000'),
    }),
  )

  const response = await getOneDayAgoHist(crypto, fiat)

  expect(response).toEqual('50000')
  expect(fetch).toHaveBeenCalledTimes(1)
})
