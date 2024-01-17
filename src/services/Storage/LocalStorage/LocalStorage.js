// global localStorage
const setItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const removeItem = (key) => {
  localStorage.removeItem(key)
}

const getItem = (key) => {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) : null
  } else {
    console.log('localStorage is not available')
    return null
  }
}

export { getItem, setItem, removeItem }
