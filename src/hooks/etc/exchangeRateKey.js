const exchangeRateKey = (crypto = '', fiat = '') =>
  `${crypto.toLowerCase()}-${fiat.toLowerCase()}`

export default exchangeRateKey
