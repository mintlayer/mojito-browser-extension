import { useEffect, useState, useRef, useCallback } from 'react'

import { ExchangeRates } from '@APIs'

const useExchangeRates = (crypto, fiat) => {
  const effectCalled = useRef(false)
  const [exchangeRate, setExchangeRate] = useState(0)

  const getRate = useCallback(async () => {
    try {
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
