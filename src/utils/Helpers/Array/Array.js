const getNRandomElementsFromArray = (array, n) => {
  const len = array.length

  if (n > len) {
    throw new RangeError('More elements requested than available')
  }

  // Partial Fisher-Yates: samples distinct elements (no replacement).
  const pool = [...array]
  for (let i = 0; i < n; i++) {
    const randomIndex = i + Math.floor(Math.random() * (len - i))
    ;[pool[i], pool[randomIndex]] = [pool[randomIndex], pool[i]]
  }

  return pool.slice(0, n)
}

const removeDuplicates = (arr, getKey = (item) => item) => {
  const seen = new Set()
  return arr.filter((item) => {
    const k = getKey(item)
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

const stringToBytes = (string) => {
  const encoder = new TextEncoder()
  return encoder.encode(string)
}

export {
  getNRandomElementsFromArray,
  removeDuplicates,
  uint8ArrayToString,
  stringToUint8Array,
  stringToBytes,
}
