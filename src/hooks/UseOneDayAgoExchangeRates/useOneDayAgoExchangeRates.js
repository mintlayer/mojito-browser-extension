import { useContext } from 'react'

import { ExchangeRatesContext } from '@Contexts'
import exchangeRateKey from '../etc/exchangeRateKey'

const useOneDayAgoExchangeRates = (crypto, fiat) => {
  const { yesterdayExchangeRate } = useContext(ExchangeRatesContext)

  return {
    yesterdayExchangeRate: yesterdayExchangeRate[exchangeRateKey(crypto, fiat)],
  }
}

export default useOneDayAgoExchangeRates
