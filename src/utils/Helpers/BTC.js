const AVERAGE_MIN_PER_BLOCK = 15

const parseFeesEstimates = (allEstimates) => {
  const blockLevels = {
    25: 'LOW',
    4: 'MEDIUM',
    1: 'HIGH',
  }
  const blockValues = Object.keys(blockLevels)

  return Object.keys(allEstimates)
    .filter((blocksAmount) => blockValues.includes(blocksAmount))
    .map((blocksAmount) => ({
      [blockLevels[blocksAmount]]: allEstimates[blocksAmount],
    }))
    .reduce((acc, item) => {
      const levelName = Object.keys(item)[0]
      acc[levelName] = item[levelName]
      return acc
    }, {})
}

export {
  parseFeesEstimates,
  AVERAGE_MIN_PER_BLOCK,
}
