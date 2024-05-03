import { useContext } from 'react'
import { ExchangeRatesContext } from '@Contexts'

const useExchangeRates = (crypto, fiat) => {
  const { exchangeRate } = useContext(ExchangeRatesContext)

  return { exchangeRate: exchangeRate[`${crypto}-${fiat}`] }
}

export default useExchangeRates
