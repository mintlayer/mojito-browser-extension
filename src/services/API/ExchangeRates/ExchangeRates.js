const EXCHANGE_RATES_SERVER_URL = 'https://rates-api.mintlayer.org'

const EXCHANGE_RATES_SERVER_ENDPOINTS = {
  GET_RATE: '/getCurrentRate/:crypto/:fiat',
  GET_OLD_RATE: '/getOneDayAgoRate/:crypto/:fiat',
  GET_HIST: '/getOneDayAgoHist/:crypto/:fiat',
}

const requestExchangeRates = async (endpoint, request = fetch) => {
  try {
    const result = await request(EXCHANGE_RATES_SERVER_URL + endpoint)
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
    EXCHANGE_RATES_SERVER_ENDPOINTS.GET_RATE.replace(':crypto', crypto).replace(
      ':fiat',
      fiat,
    ),
  )

const getOneDayAgoRate = (crypto, fiat) =>
  requestExchangeRates(
    EXCHANGE_RATES_SERVER_ENDPOINTS.GET_OLD_RATE.replace(
      ':crypto',
      crypto,
    ).replace(':fiat', fiat),
  )

const getOneDayAgoHist = (crypto, fiat) =>
  requestExchangeRates(
    EXCHANGE_RATES_SERVER_ENDPOINTS.GET_HIST.replace(':crypto', crypto).replace(
      ':fiat',
      fiat,
    ),
  )

export { getRate, getOneDayAgoRate, getOneDayAgoHist }
