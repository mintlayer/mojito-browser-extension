import { EnvVars } from '@Constants'

const EXCHANGE_RATES_SERVER_URL = EnvVars.EXCHANGE_RATES_SERVER

const EXCHANGE_RATES_SERVER_ENDPOINTS = {
  GET_RATE: '/getCurrentRate/:crypto/:fiat',
  GET_OLD_RATE: '/getOneDayAgoRate/:crypto/:fiat',
  GET_HIST: '/getOneDayAgoHist/:crypto/:fiat',
  GET_THIRTY_DAYS_HIST: '/getThirtyDaysHist/:crypto/:fiat',
}

const REQUEST_TIMEOUT_MS = 10000

const requestExchangeRates = async (endpoint, request = fetch) => {
  try {
    const result = await request(EXCHANGE_RATES_SERVER_URL + endpoint, {
      // A hung rates server must never leave fiat displays stuck loading.
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
    if (!result.ok) throw new Error('Request not successful')
    const content = await result.text()
    return Promise.resolve(content)
  } catch (error) {
    console.error(error)
    throw error
  }
}

const getRate = (crypto, fiat) =>
  requestExchangeRates(
    EXCHANGE_RATES_SERVER_ENDPOINTS.GET_RATE.replace(
      ':crypto',
      encodeURIComponent(crypto),
    ).replace(':fiat', encodeURIComponent(fiat)),
  )

const getOneDayAgoRate = (crypto, fiat) =>
  requestExchangeRates(
    EXCHANGE_RATES_SERVER_ENDPOINTS.GET_OLD_RATE.replace(
      ':crypto',
      encodeURIComponent(crypto),
    ).replace(':fiat', encodeURIComponent(fiat)),
  )

const getOneDayAgoHist = (crypto, fiat) =>
  requestExchangeRates(
    EXCHANGE_RATES_SERVER_ENDPOINTS.GET_HIST.replace(
      ':crypto',
      encodeURIComponent(crypto),
    ).replace(':fiat', encodeURIComponent(fiat)),
  )

const getThirtyDaysHist = (crypto, fiat) =>
  requestExchangeRates(
    EXCHANGE_RATES_SERVER_ENDPOINTS.GET_THIRTY_DAYS_HIST.replace(
      ':crypto',
      encodeURIComponent(crypto),
    ).replace(':fiat', encodeURIComponent(fiat)),
  )

export { getRate, getOneDayAgoRate, getOneDayAgoHist, getThirtyDaysHist }
