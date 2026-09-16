import React, { createContext, useEffect, useState, useContext } from 'react'
import { ExchangeRates, PriceFeed } from '@APIs'
import { AccountContext } from '../AccountProvider/AccountProvider'

const ExchangeRatesContext = createContext()

const REFRESH_INTERVAL = 1000 * 60 * 5 // 5 minutes

const fiat = 'usd'

const ExchangeRatesProvider = ({ value: propValue, children }) => {
  const [exchangeRate, setExchangeRate] = useState({})
  const [yesterdayExchangeRate, setYesterdayExchangeRate] = useState({})
  const [historyRates, setHistoryRates] = useState({})
  const [thirtyDaysHistoryRates, setThirtyDaysHistoryRates] = useState({})
  const [tokenPrices, setTokenPrices] = useState({})
  const [fetchError, setFetchError] = useState(null)
  const [fetching, setFetching] = useState(true)
  const { accountID } = useContext(AccountContext)

  useEffect(() => {
    if (!accountID) return
    const default_crypto = ['btc', 'ml']

    const fetchCoinRates = async (crypto) => {
      const [
        response_rates,
        response_yesterday,
        response_history,
        response_thirty_days,
      ] = await Promise.all([
        ExchangeRates.getRate(crypto, fiat),
        ExchangeRates.getOneDayAgoRate(crypto, fiat),
        ExchangeRates.getOneDayAgoHist(crypto, fiat),
        ExchangeRates.getThirtyDaysHist(crypto, fiat),
      ])

      return {
        rate: JSON.parse(response_rates)[`${crypto}-${fiat}`],
        yesterday: JSON.parse(response_yesterday)[`${crypto}-${fiat}`],
        history: JSON.parse(response_history)[`${crypto}-${fiat}`],
        thirtyDays: JSON.parse(response_thirty_days)[`${crypto}-${fiat}`],
      }
    }

    // Token prices come from the price feed (current USD only, no history),
    // fetched as one batched call. Kept independent from the coin rates so
    // a feed outage cannot take down btc/ml rates, and vice versa: each
    // keeps its last good snapshot on failure.
    const fetchTokenPrices = async () => {
      try {
        // Merge instead of replace: the feed validates values it returns but
        // cannot know the full covered set, so a partial 200 must not wipe
        // prices already on screen.
        const prices = await PriceFeed.getPrices()
        setTokenPrices((prev) => ({ ...prev, ...prices }))
      } catch (error) {
        console.error('Failed to fetch token prices:', error)
      }
    }

    const getData = async () => {
      setFetching(true)
      try {
        // Coins are independent: fetch in parallel instead of 8 sequential
        // round-trips.
        const results = await Promise.all(
          default_crypto.map((crypto) => fetchCoinRates(crypto)),
        )

        const rates = {}
        const yesterdayRates = {}
        const historyRates = {}
        const thirtyDaysRates = {}
        default_crypto.forEach((crypto, i) => {
          rates[`${crypto}-${fiat}`] = results[i].rate
          yesterdayRates[`${crypto}-${fiat}`] = results[i].yesterday
          historyRates[`${crypto}-${fiat}`] = results[i].history
          thirtyDaysRates[`${crypto}-${fiat}`] = results[i].thirtyDays
        })

        setExchangeRate(rates)
        setYesterdayExchangeRate(yesterdayRates)
        setHistoryRates(historyRates)
        setThirtyDaysHistoryRates(thirtyDaysRates)
        setFetchError(null)
      } catch (error) {
        // Keep the last good rates; expose the failure so consumers can
        // distinguish "stale" from "zero".
        console.error('Failed to fetch exchange rates:', error)
        setFetchError(error)
      } finally {
        setFetching(false)
      }
      fetchTokenPrices()
    }
    getData()

    const data = setInterval(getData, REFRESH_INTERVAL)
    return () => clearInterval(data)
  }, [accountID])

  const value = {
    exchangeRate,
    yesterdayExchangeRate,
    historyRates,
    thirtyDaysHistoryRates,
    tokenPrices,
    fetchError,
    fetching,
  }

  return (
    <ExchangeRatesContext.Provider value={propValue || value}>
      {children}
    </ExchangeRatesContext.Provider>
  )
}

export { ExchangeRatesContext, ExchangeRatesProvider }
