import { useContext } from 'react'
import { ExchangeRatesContext } from '@Contexts'

const useExchangeRates = (crypto, fiat) => {
  const { exchangeRate } = useContext(ExchangeRatesContext)

  return {
    exchangeRate: exchangeRate[`${crypto.toLowerCase()}-${fiat.toLowerCase()}`],
  }
}

export default useExchangeRates
