import { useContext } from 'react'
import { ExchangeRatesContext } from '@Contexts'
import exchangeRateKey from '../etc/exchangeRateKey'

const useExchangeRates = (crypto, fiat) => {
  const { exchangeRate } = useContext(ExchangeRatesContext)

  return {
    exchangeRate: exchangeRate[exchangeRateKey(crypto, fiat)],
  }
}

export default useExchangeRates
