import { renderHook, waitFor } from '@testing-library/react'

import useStyleClasses from './useStyleClasses'

test('UseStyleClasses hook', async () => {
  const firstClassName = 'testClass'
  const secondClassName = 'anotherClass'

  const {result, rerender } =  renderHook((classes = []) => useStyleClasses(classes))

  expect(result.current).toBe('')

  rerender([firstClassName])
  await waitFor(() => expect(result.current).toBe(`${firstClassName}`))

  rerender([firstClassName, secondClassName])
  await waitFor(() => expect(result.current).toBe(`${firstClassName} ${secondClassName}`))
})
