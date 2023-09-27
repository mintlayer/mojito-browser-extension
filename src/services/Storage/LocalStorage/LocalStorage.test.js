import { getItem, removeItem, setItem } from './LocalStorage'

describe('LocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('setItem and getItem should work correctly', () => {
    const key = 'testKey'
    const value = { foo: 'bar' }

    setItem(key, value)

    const result = getItem(key)

    expect(result).toEqual(value)
  })

  test('removeItem should work correctly', () => {
    const key = 'testKey'
    const value = { foo: 'bar' }

    setItem(key, value)

    removeItem(key)

    const result = getItem(key)

    expect(result).toBeNull()
  })

  test('getItem should return null if key does not exist', () => {
    const key = 'nonExistentKey'

    const result = getItem(key)

    expect(result).toBeNull()
  })
})
