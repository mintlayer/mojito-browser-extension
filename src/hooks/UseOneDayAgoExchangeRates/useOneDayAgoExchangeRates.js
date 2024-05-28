import { useContext } from 'react'

import { ExchangeRatesContext } from '@Contexts'

const useOneDayAgoExchangeRates = (crypto, fiat) => {
  const { yesterdayExchangeRate } = useContext(ExchangeRatesContext)

  return { yesterdayExchangeRate: yesterdayExchangeRate[`${crypto}-${fiat}`] }
}

export default useOneDayAgoExchangeRates
