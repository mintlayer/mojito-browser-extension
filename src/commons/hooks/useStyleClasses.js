import { useEffect, useState, useCallback, useRef } from 'react'

const ensureClassesAreArray = classes => Array.isArray(classes) ? classes : classes.split(' ')

// * Makes sure there is no repeated classes before joining
const formatClasses = (classes = []) => [...new Set(classes)].join(' ')

// * Makes sure there is no empty strings
const mergeLists = (oldList = '', newList = []) => [...oldList.split(' '), ...ensureClassesAreArray(newList)].filter(item => item)

const removeItemsFromList = (oldList = '', newList = []) => {
  const oldStyleClasses = oldList.split(' ')
  const classesToRemove = ensureClassesAreArray(newList)
  return oldStyleClasses.filter(styleClass => !classesToRemove.includes(styleClass))
}


const useStyleClasses = (classesList = []) => {
  const effectCalled = useRef(false)
  const [styleClasses, _setStyleClasses] = useState([])

  const setStyleClasses = useCallback(
    (classes = []) => {
      _setStyleClasses(formatClasses(ensureClassesAreArray(classes)))
    }, [])

  const addStyleClass = useCallback(
    (classes = []) => {
      _setStyleClasses(prevClasses => formatClasses(mergeLists(prevClasses, classes)))
    }, [])

  const removeStyleClass = useCallback(
    (classes = []) =>
      _setStyleClasses(prevClasses => formatClasses(removeItemsFromList(prevClasses, classes)))
    , [])

  useEffect(() => {
    /*
      ! React version > 18 does mount, simulated unmount, and simulated mount
      ! (https://reactjs.org/blog/2022/03/08/react-18-upgrade-guide.html#updates-to-strict-mode)
      ! This if avoids the component the rest of the function to run more than once
      ! (https://github.com/reactwg/react-18/discussions/18)
    */
    if (effectCalled.current) return
    effectCalled.current = true

    setStyleClasses(classesList)
  }, [classesList, setStyleClasses])

  return { styleClasses, setStyleClasses, addStyleClass, removeStyleClass }
}

export default useStyleClasses
export { ensureClassesAreArray, formatClasses, mergeLists, removeItemsFromList }
