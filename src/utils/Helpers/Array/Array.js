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

const uint8ArrayToString = (uint8Array) => {
  let binaryString = ''
  for (let i = 0; i < uint8Array.length; i++) {
    binaryString += String.fromCharCode(uint8Array[i])
  }
  return btoa(binaryString)
}

const stringToUint8Array = (string) => {
  const binaryString = atob(string)
  const len = binaryString.length
  const uint8Array = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    uint8Array[i] = binaryString.charCodeAt(i)
  }
  return uint8Array
}

export {
  getNRandomElementsFromArray,
  removeDublicates,
  uint8ArrayToString,
  stringToUint8Array,
}
