import { useEffect, useState, useRef, useCallback } from 'react'

import { ExchangeRates } from '@APIs'

// TODO: Remove this mock
const ML_EXCHANGE_RATE_MOCK = 0.055

const useExchangeRates = (crypto, fiat) => {
  const effectCalled = useRef(false)
  const [exchangeRate, setExchangeRate] = useState(0)

  const getRate = useCallback(async () => {
    try {
      // TODO: Remove this mock
      if (crypto === 'ML' || crypto === 'ml') {
        setExchangeRate(ML_EXCHANGE_RATE_MOCK)
        return
      }
      const response = await ExchangeRates.getRate(crypto, fiat)
      const rates = JSON.parse(response)[`${crypto}-${fiat}`]
      setExchangeRate(rates)
    } catch (error) {
      console.error(error)
    }
  }, [crypto, fiat])

  useEffect(() => {
    /* istanbul ignore next */
    if (effectCalled.current) return
    effectCalled.current = true

    getRate()
  }, [getRate])

  return { exchangeRate }
}

export default useExchangeRates
