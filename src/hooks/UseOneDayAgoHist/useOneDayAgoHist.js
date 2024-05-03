import { useContext } from 'react'

import { ExchangeRatesContext } from '@Contexts'

const useOneDayAgoHist = (crypto, fiat) => {
  const { historyRates } = useContext(ExchangeRatesContext)

  return { historyRates: historyRates[`${crypto}-${fiat}`] }
}

export default useOneDayAgoHist
