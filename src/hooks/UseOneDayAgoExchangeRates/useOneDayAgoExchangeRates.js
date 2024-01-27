import { useEffect, useState, useRef, useCallback } from 'react'

import { ExchangeRates } from '@APIs'

const useOneDayAgoExchangeRates = (crypto, fiat) => {
  const effectCalled = useRef(false)
  const [yesterdayExchangeRate, setYesterdayExchangeRate] = useState(0)

  const getRate = useCallback(async () => {
    try {
      const response = await ExchangeRates.getOneDayAgoRate(crypto, fiat)
      const rates = JSON.parse(response)[`${crypto}-${fiat}`]
      setYesterdayExchangeRate(rates)
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

  return { yesterdayExchangeRate }
}

export default useOneDayAgoExchangeRates
