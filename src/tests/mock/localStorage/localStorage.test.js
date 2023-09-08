import { localStorageMock, setLocalStorage } from './localStorage'

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

test('data is added into local storage', () => {
  const mockId = '1'
  const mockJson = 'test'
  setLocalStorage(mockId, mockJson)
  expect(localStorage.getItem(mockId)).toEqual(mockJson)
})
