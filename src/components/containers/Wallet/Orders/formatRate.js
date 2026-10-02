import Decimal from 'decimal.js'

const formatRate = (rate) => new Decimal(rate).toDecimalPlaces(10).toString()

export default formatRate
