import { renderHook, waitFor, act } from '@testing-library/react'

import useStyleClasses, {
  ensureClassesAreArray,
  formatClasses,
  mergeLists,
  removeItemsFromList,
} from './useStyleClasses'

test('UseStyleClasses hook > ensureClassesAreArray, with array', () => {
  const classList = ['testClass']
  expect(ensureClassesAreArray(classList)).toStrictEqual(classList)
})

test('UseStyleClasses hook > ensureClassesAreArray, with string', () => {
  const classList = 'testClass'
  expect(ensureClassesAreArray(classList)).toStrictEqual([classList])
})

test('UseStyleClasses hook > formatClasses, no params', () => {
  expect(formatClasses()).toBe('')
})

test('UseStyleClasses hook > formatClasses, empty array', () => {
  const classList = []
  expect(formatClasses(classList)).toBe('')
})

test('UseStyleClasses hook > formatClasses, with one item array', () => {
  const classList = ['testClass']
  expect(formatClasses(classList)).toBe('testClass')
})

test('UseStyleClasses hook > formatClasses, with multiple items array', () => {
  const classList = ['testClass', 'testClass2', 'testClass3']
  expect(formatClasses(classList)).toBe('testClass testClass2 testClass3')
})

test('UseStyleClasses hook > formatClasses, with multiple items array and repeated classes', () => {
  const classList = ['testClass', 'testClass2', 'testClass3', 'testClass2']
  expect(formatClasses(classList)).toBe('testClass testClass2 testClass3')
})

test('UseStyleClasses hook > mergeLists, no params', () => {
  expect(mergeLists()).toStrictEqual([])
})

test('UseStyleClasses hook > mergeLists, with string', () => {
  const oldList = 'item1 item2 item3'
  const newList = 'item4 item5'
  expect(mergeLists(oldList, newList)).toStrictEqual([
    ...oldList.split(' '),
    ...newList.split(' '),
  ])
})

test('UseStyleClasses hook > mergeLists, with string and already existent item', () => {
  const oldList = 'item1 item2 item3'
  const newList = 'item1'
  expect(mergeLists(oldList, newList)).toStrictEqual([
    ...oldList.split(' '),
    ...newList.split(' '),
  ])
})

test('UseStyleClasses hook > mergeLists, with empty string', () => {
  const oldList = 'item1 item2 item3'
  const newList = ''
  expect(mergeLists(oldList, newList)).toStrictEqual([...oldList.split(' ')])
})

test('UseStyleClasses hook > mergeLists, with array', () => {
  const oldList = 'item1 item2 item3'
  const newList = ['item4', 'item5']
  expect(mergeLists(oldList, newList)).toStrictEqual([
    ...oldList.split(' '),
    ...newList,
  ])
})

test('UseStyleClasses hook > mergeLists, with empty array', () => {
  const oldList = 'item1 item2 item3'
  const newList = []
  expect(mergeLists(oldList, newList)).toStrictEqual([...oldList.split(' ')])
})

test('UseStyleClasses hook > removeItemsFromList, no params', () => {
  expect(removeItemsFromList()).toStrictEqual([''])
})

test('UseStyleClasses hook > removeItemsFromList, with string', () => {
  const oldList = 'item1 item2 item3'
  const toRemoveList = 'item1 item2'
  expect(removeItemsFromList(oldList, toRemoveList)).toStrictEqual(['item3'])
})

test('UseStyleClasses hook > removeItemsFromList, with array', () => {
  const oldList = 'item1 item2 item3'
  const toRemoveList = ['item1', 'item2']
  expect(removeItemsFromList(oldList, toRemoveList)).toStrictEqual(['item3'])
})

test('UseStyleClasses hook > removeItemsFromList, empty string', () => {
  const oldList = 'item1 item2 item3'
  const toRemoveList = ''
  expect(removeItemsFromList(oldList, toRemoveList)).toStrictEqual([
    ...oldList.split(' '),
  ])
})

test('UseStyleClasses hook > removeItemsFromList, empty array', () => {
  const oldList = 'item1 item2 item3'
  const toRemoveList = []
  expect(removeItemsFromList(oldList, toRemoveList)).toStrictEqual([
    ...oldList.split(' '),
  ])
})

test('UseStyleClasses hook, no params', async () => {
  const { result } = renderHook(() => useStyleClasses())
  const { styleClasses } = result.current

  expect(styleClasses).toBe('')
})

test('UseStyleClasses hook, rerender (should not update classes)', async () => {
  const firstClassName = 'testClass'
  const secondClassName = 'anotherClass'

  const { result, rerender } = renderHook((classes = firstClassName) =>
    useStyleClasses(classes),
  )

  let { styleClasses } = result.current

  expect(styleClasses).toBe(firstClassName)

  rerender(secondClassName)

  await waitFor(() => {
    styleClasses = result.current[0]
  })

  // ! It should not change because the component should not be rendered again with new parameters
  expect(styleClasses).not.toBe(secondClassName)
})

test('UseStyleClasses hook, updating with setStyleClasses and no params', async () => {
  const firstClassName = 'testClass'

  const { result } = renderHook((classes = firstClassName) =>
    useStyleClasses(classes),
  )

  let { styleClasses, setStyleClasses } = result.current

  expect(styleClasses).toBe(firstClassName)

  act(() => {
    setStyleClasses()
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    setStyleClasses = result.current.setStyleClasses
  })

  expect(styleClasses).toBe('')
})

test('UseStyleClasses hook, 1 class as a string, updating with setStyleClasses', async () => {
  const firstClassName = 'testClass'
  const secondClassName = 'anotherClass'

  const { result } = renderHook((classes = firstClassName) =>
    useStyleClasses(classes),
  )

  let { styleClasses, setStyleClasses } = result.current

  expect(styleClasses).toBe(firstClassName)

  act(() => {
    setStyleClasses(secondClassName)
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    setStyleClasses = result.current.setStyleClasses
  })

  expect(styleClasses).toBe(secondClassName)
})

test('UseStyleClasses hook, 2 classes as a string, updating with setStyleClasses', async () => {
  const firstClassName = 'testClass1 testClass2'
  const secondClassName = 'anotherClass1 anotherClass2'

  const { result } = renderHook((classes = firstClassName) =>
    useStyleClasses(classes),
  )

  let { styleClasses, setStyleClasses } = result.current

  expect(styleClasses).toBe(firstClassName)

  act(() => {
    setStyleClasses(secondClassName)
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    setStyleClasses = result.current.setStyleClasses
  })

  expect(styleClasses).toBe(secondClassName)
})

test('UseStyleClasses hook, 1 classe as an array, updating with setStyleClasses', async () => {
  const firstClassesList = ['testClass']
  const secondClassesList = ['anotherClass']

  const { result } = renderHook((classes = firstClassesList) =>
    useStyleClasses(classes),
  )

  let { styleClasses, setStyleClasses } = result.current

  expect(styleClasses).toBe(firstClassesList.join(' '))

  act(() => {
    setStyleClasses(secondClassesList)
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    setStyleClasses = result.current.setStyleClasses
  })

  expect(styleClasses).toBe(secondClassesList.join(' '))
})

test('UseStyleClasses hook, 2 classes as an array, updating with setStyleClasses', async () => {
  const firstClassesList = ['testClass1', 'testClass2']
  const secondClassesList = ['anotherClass1', 'anotherClass2']

  const { result } = renderHook((classes = firstClassesList) =>
    useStyleClasses(classes),
  )

  let { styleClasses, setStyleClasses } = result.current

  expect(styleClasses).toBe(firstClassesList.join(' '))

  act(() => {
    setStyleClasses(secondClassesList)
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    setStyleClasses = result.current.setStyleClasses
  })

  expect(styleClasses).toBe(secondClassesList.join(' '))
})

test('UseStyleClasses hook, updatign with addStyleClass and no params', async () => {
  const firstClassesList = ['testClass1', 'testClass2']

  const { result } = renderHook((classes = firstClassesList) =>
    useStyleClasses(classes),
  )

  let { styleClasses, addStyleClass } = result.current

  expect(styleClasses).toBe(firstClassesList.join(' '))

  act(() => {
    addStyleClass()
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    addStyleClass = result.current.addStyleClass
  })

  expect(styleClasses).toBe(`${firstClassesList.join(' ')}`)
})

test('UseStyleClasses hook, adding 1 class as a string with addStyleClass', async () => {
  const firstClassesList = ['testClass1', 'testClass2']
  const addedClass = 'anotherClass'

  const { result } = renderHook((classes = firstClassesList) =>
    useStyleClasses(classes),
  )

  let { styleClasses, addStyleClass } = result.current

  expect(styleClasses).toBe(firstClassesList.join(' '))

  act(() => {
    addStyleClass(addedClass)
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    addStyleClass = result.current.addStyleClass
  })

  expect(styleClasses).toBe(`${firstClassesList.join(' ')} ${addedClass}`)
})

test('UseStyleClasses hook, adding 2 classes as a string with addStyleClass', async () => {
  const firstClassesList = ['testClass1', 'testClass2']
  const addedClasses = 'anotherClass1 anotherClass2'

  const { result } = renderHook((classes = firstClassesList) =>
    useStyleClasses(classes),
  )

  let { styleClasses, addStyleClass } = result.current

  expect(styleClasses).toBe(firstClassesList.join(' '))

  act(() => {
    addStyleClass(addedClasses)
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    addStyleClass = result.current.addStyleClass
  })

  expect(styleClasses).toBe(`${firstClassesList.join(' ')} ${addedClasses}`)
})

test('UseStyleClasses hook, adding 1 class as an array with addStyleClass', async () => {
  const firstClassesList = ['testClass1', 'testClass2']
  const addedClass = ['anotherClass']

  const { result } = renderHook((classes = firstClassesList) =>
    useStyleClasses(classes),
  )

  let { styleClasses, addStyleClass } = result.current

  expect(styleClasses).toBe(firstClassesList.join(' '))

  act(() => {
    addStyleClass(addedClass)
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    addStyleClass = result.current.addStyleClass
  })

  expect(styleClasses).toBe(`${firstClassesList.join(' ')} ${addedClass}`)
})

test('UseStyleClasses hook, adding 2 classes as a array with addStyleClass', async () => {
  const firstClassesList = ['testClass1', 'testClass2']
  const addedClasses = ['anotherClass1', 'anotherClass2']

  const { result } = renderHook((classes = firstClassesList) =>
    useStyleClasses(classes),
  )

  let { styleClasses, addStyleClass } = result.current

  expect(styleClasses).toBe(firstClassesList.join(' '))

  act(() => {
    addStyleClass(addedClasses)
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    addStyleClass = result.current.addStyleClass
  })

  expect(styleClasses).toBe(
    `${firstClassesList.join(' ')} ${addedClasses.join(' ')}`,
  )
})

test('UseStyleClasses hook, adding 2 same named classes with addStyleClass', async () => {
  const firstClassesList = ['testClass1', 'testClass2']
  const addedClasses = ['anotherClass1', 'anotherClass1']

  const { result } = renderHook((classes = firstClassesList) =>
    useStyleClasses(classes),
  )

  let { styleClasses, addStyleClass } = result.current

  expect(styleClasses).toBe(firstClassesList.join(' '))

  act(() => {
    addStyleClass(addedClasses)
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    addStyleClass = result.current.addStyleClass
  })

  expect(styleClasses).toBe(`${firstClassesList.join(' ')} ${addedClasses[0]}`)
})

test('UseStyleClasses hook, updating with removeStyleClass and no param', async () => {
  const firstClassesList = ['testClass1', 'testClass2']
  const { result } = renderHook((classes = firstClassesList) =>
    useStyleClasses(classes),
  )

  let { styleClasses, removeStyleClass } = result.current

  expect(styleClasses).toBe(firstClassesList.join(' '))

  act(() => {
    removeStyleClass()
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    removeStyleClass = result.current.removeStyleClass
  })

  expect(styleClasses).toBe(firstClassesList.join(' '))
})

test('UseStyleClasses hook, removing 1 class as a string with removeStyleClass', async () => {
  const firstClassesList = ['testClass1', 'testClass2']
  const toBeRemovedClass = 'testClass1'

  const { result } = renderHook((classes = firstClassesList) =>
    useStyleClasses(classes),
  )

  let { styleClasses, removeStyleClass } = result.current

  expect(styleClasses).toBe(firstClassesList.join(' '))

  act(() => {
    removeStyleClass(toBeRemovedClass)
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    removeStyleClass = result.current.removeStyleClass
  })

  expect(styleClasses).toBe(firstClassesList[1])
})

test('UseStyleClasses hook, removing 1 class as an array with removeStyleClass', async () => {
  const firstClassesList = ['testClass1', 'testClass2']
  const toBeRemovedClass = ['testClass1']

  const { result } = renderHook((classes = firstClassesList) =>
    useStyleClasses(classes),
  )

  let { styleClasses, removeStyleClass } = result.current

  expect(styleClasses).toBe(firstClassesList.join(' '))

  act(() => {
    removeStyleClass(toBeRemovedClass)
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    removeStyleClass = result.current.removeStyleClass
  })

  expect(styleClasses).toBe(firstClassesList[1])
})

test('UseStyleClasses hook, removing 2 classes as a string with removeStyleClass', async () => {
  const firstClassesList = ['testClass1', 'testClass2']
  const toBeRemovedClasses = 'testClass1 testClass2'

  const { result } = renderHook((classes = firstClassesList) =>
    useStyleClasses(classes),
  )

  let { styleClasses, removeStyleClass } = result.current

  expect(styleClasses).toBe(firstClassesList.join(' '))

  act(() => {
    removeStyleClass(toBeRemovedClasses)
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    removeStyleClass = result.current.removeStyleClass
  })

  expect(styleClasses).toBe('')
})

test('UseStyleClasses hook, removing 2 classes as an Array with removeStyleClass', async () => {
  const firstClassesList = ['testClass1', 'testClass2']
  const toBeRemovedClasses = ['testClass1', 'testClass2']

  const { result } = renderHook((classes = firstClassesList) =>
    useStyleClasses(classes),
  )

  let { styleClasses, removeStyleClass } = result.current

  expect(styleClasses).toBe(firstClassesList.join(' '))

  act(() => {
    removeStyleClass(toBeRemovedClasses)
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    removeStyleClass = result.current.removeStyleClass
  })

  expect(styleClasses).toBe('')
})

test('UseStyleClasses hook, removing 2 classes with same name with removeStyleClass', async () => {
  const firstClassesList = ['testClass1', 'testClass2']
  const toBeRemovedClasses = ['testClass1', 'testClass1']

  const { result } = renderHook((classes = firstClassesList) =>
    useStyleClasses(classes),
  )

  let { styleClasses, removeStyleClass } = result.current

  expect(styleClasses).toBe(firstClassesList.join(' '))

  act(() => {
    removeStyleClass(toBeRemovedClasses)
  })

  await waitFor(() => {
    styleClasses = result.current.styleClasses
    removeStyleClass = result.current.removeStyleClass
  })

  expect(styleClasses).toBe(firstClassesList[1])
})
