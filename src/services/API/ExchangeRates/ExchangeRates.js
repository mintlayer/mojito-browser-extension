const EXCHANGE_RATES_SERVER_URL = 'http://51.158.172.176:3000'

const EXCHANGE_RATES_SERVER_ENDPOINTS = {
  GET_RATE: '/:crypto/:fiat',
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

export { getRate }
