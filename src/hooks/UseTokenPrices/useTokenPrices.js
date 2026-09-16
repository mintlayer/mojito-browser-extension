import { useContext } from 'react'
import { ExchangeRatesContext } from '@Contexts'

const useTokenPrices = () => {
  const { tokenPrices } = useContext(ExchangeRatesContext)

  return { tokenPrices }
}

export default useTokenPrices
