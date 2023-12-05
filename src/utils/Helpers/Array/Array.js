const getNRandomElementsFromArray = (array, n) => {
  const result = []
  const len = array.length

  if (n > len) {
    throw new RangeError('More elements requested than available')
  }

  for (let i = 0; i < n; i++) {
    const randomIndex = Math.floor(Math.random() * len)
    result.push(array[randomIndex])
  }

  return result
}

const removeDublicates = (arr) => {
  const seen = new Set()
  return arr.filter((item) => {
    const k = JSON.stringify(item)
    return seen.has(k) ? false : seen.add(k)
  })
}

export { getNRandomElementsFromArray, removeDublicates }
