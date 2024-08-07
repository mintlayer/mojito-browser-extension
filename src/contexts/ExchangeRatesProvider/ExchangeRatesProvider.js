import React, { createContext, useEffect, useState, useContext } from 'react'
import { ExchangeRates } from '@APIs'
import { AccountContext } from '../AccountProvider/AccountProvider'

const ExchangeRatesContext = createContext()

const REFRESH_INTERVAL = 1000 * 60 * 5 // 5 minutes

const fiat = 'usd'

const ExchangeRatesProvider = ({ value: propValue, children }) => {
  const [exchangeRate, setExchangeRate] = useState({})
  const [yesterdayExchangeRate, setYesterdayExchangeRate] = useState({})
  const [historyRates, setHistoryRates] = useState({})
  const { accountID } = useContext(AccountContext)

  useEffect(() => {
    if (!accountID) return
    const default_crypto = ['btc', 'ml']
    const getData = async () => {
      const rates = {}
      const yesterdayRates = {}
      const historyRates = {}
      for (let i = 0; i < default_crypto.length; i++) {
        const response_rates = await ExchangeRates.getRate(
          default_crypto[i],
          fiat,
        )
        rates[`${default_crypto[i]}-${fiat}`] =
          JSON.parse(response_rates)[`${default_crypto[i]}-${fiat}`]

        const response_yesterday = await ExchangeRates.getOneDayAgoRate(
          default_crypto[i],
          fiat,
        )
        yesterdayRates[`${default_crypto[i]}-${fiat}`] =
          JSON.parse(response_yesterday)[`${default_crypto[i]}-${fiat}`]

        const response_history = await ExchangeRates.getOneDayAgoHist(
          default_crypto[i],
          fiat,
        )
        historyRates[`${default_crypto[i]}-${fiat}`] =
          JSON.parse(response_history)[`${default_crypto[i]}-${fiat}`]
      }

      setExchangeRate(rates)
      setYesterdayExchangeRate(yesterdayRates)
      setHistoryRates(historyRates)
    }
    getData()

    const data = setInterval(getData, REFRESH_INTERVAL)
    return () => clearInterval(data)
  }, [accountID])

  const value = {
    exchangeRate,
    yesterdayExchangeRate,
    historyRates,
  }

  return (
    <ExchangeRatesContext.Provider value={propValue || value}>
      {children}
    </ExchangeRatesContext.Provider>
  )
}

export { ExchangeRatesContext, ExchangeRatesProvider }
