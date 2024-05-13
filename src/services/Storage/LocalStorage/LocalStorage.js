// global localStorage
import { AppInfo } from '@Constants'

const setItem = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value))
}

const removeItem = (key) => {
  localStorage.removeItem(key)
}

const getItem = (key) => {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key)
    const result = item ? JSON.parse(item) : null

    // fallback for unconfirmed transactions that are not stored in an array
    if (
      result !== null &&
      key.startsWith(AppInfo.UNCONFIRMED_TRANSACTION_NAME) &&
      !Array.isArray(result)
    ) {
      return [result]
    }

    return result
  } else {
    console.log('localStorage is not available')
    return null
  }
}

export { getItem, setItem, removeItem }
