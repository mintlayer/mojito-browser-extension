import { useContext } from 'react'

import { ExchangeRatesContext } from '@Contexts'
import exchangeRateKey from '../etc/exchangeRateKey'

const useOneDayAgoHist = (crypto, fiat) => {
  const { historyRates } = useContext(ExchangeRatesContext)

  return { historyRates: historyRates[exchangeRateKey(crypto, fiat)] }
}

export default useOneDayAgoHist
