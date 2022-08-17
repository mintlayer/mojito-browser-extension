import { useEffect, useState, useRef, useCallback } from 'react'

import { ExchangeRates } from '@APIs'

const useOneDayAgoHist = (crypto, fiat) => {
  const effectCalled = useRef(false)
  const [historyRates, setHistoryRates] = useState(0)

  const getRate = useCallback(async () => {
    try {
      const response = await ExchangeRates.getOneDayAgoHist(crypto, fiat)
      const hist = JSON.parse(response)[`${crypto}-${fiat}`]
      setHistoryRates(hist)
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

  return { historyRates }
}

export default useOneDayAgoHist
