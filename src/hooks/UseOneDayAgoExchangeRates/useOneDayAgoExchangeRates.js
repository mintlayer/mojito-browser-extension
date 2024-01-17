import { useEffect, useState, useRef, useCallback } from 'react'

import { ExchangeRates } from '@APIs'

// TODO: Remove this mock
const ML_YESTERDAY_EXCHANGE_RATE_MOCK = 0.055

const useOneDayAgoExchangeRates = (crypto, fiat) => {
  const effectCalled = useRef(false)
  const [yesterdayExchangeRate, setYesterdayExchangeRate] = useState(0)

  const getRate = useCallback(async () => {
    try {
      // TODO: Remove this mock
      if (crypto === 'ML' || crypto === 'ml') {
        setYesterdayExchangeRate(ML_YESTERDAY_EXCHANGE_RATE_MOCK)
        return
      }
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
