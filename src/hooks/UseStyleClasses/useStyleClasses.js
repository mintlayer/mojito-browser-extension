import { useState, useCallback } from 'react'

const ensureClassesAreArray = (classes) =>
  Array.isArray(classes) ? classes : classes.split(' ')

// * Makes sure there is no repeated classes before joining
const formatClasses = (classes = []) => [...new Set(classes)].join(' ')

// * Makes sure there is no empty strings
const mergeLists = (oldList = '', newList = []) =>
  [...oldList.split(' '), ...ensureClassesAreArray(newList)].filter(
    (item) => item,
  )

const removeItemsFromList = (oldList = '', newList = []) => {
  const oldStyleClasses = oldList.split(' ')
  const classesToRemove = ensureClassesAreArray(newList)
  return oldStyleClasses.filter(
    (styleClass) => !classesToRemove.includes(styleClass),
  )
}

const useStyleClasses = (classesList = []) => {
  const [styleClasses, _setStyleClasses] = useState(
    formatClasses(ensureClassesAreArray(classesList)),
  )

  const setStyleClasses = useCallback((classes = []) => {
    _setStyleClasses(formatClasses(ensureClassesAreArray(classes)))
  }, [])

  const addStyleClass = useCallback((classes = []) => {
    _setStyleClasses((prevClasses) =>
      formatClasses(mergeLists(prevClasses, classes)),
    )
  }, [])

  const removeStyleClass = useCallback(
    (classes = []) =>
      _setStyleClasses((prevClasses) =>
        formatClasses(removeItemsFromList(prevClasses, classes)),
      ),
    [],
  )

  return { styleClasses, setStyleClasses, addStyleClass, removeStyleClass }
}

export default useStyleClasses
export { ensureClassesAreArray, formatClasses, mergeLists, removeItemsFromList }
