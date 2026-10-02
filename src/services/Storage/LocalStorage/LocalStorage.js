// global localStorage

const setItem = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    // Quota/circular-structure failures must not surface as unhandled
    // rejections from arbitrary callers.
    console.error(`Failed to write "${key}" to localStorage:`, error)
    return false
  }
}

const removeItem = (key) => {
  localStorage.removeItem(key)
}

const getItem = (key) => {
  if (typeof localStorage === 'undefined') {
    console.warn('localStorage is not available')
    return null
  }

  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } catch (error) {
    // One corrupt stored value must not throw on every read.
    console.warn(`Failed to read "${key}" from localStorage:`, error)
    return null
  }
}

export { getItem, setItem, removeItem }
