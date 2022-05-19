import { useEffect, useState } from 'react'

const useStyleClasses = (classesList) => {
  const [styleClasses, setStyleClasses] = useState([])

  useEffect(() => {
    setStyleClasses(classesList.join(' '))
  }, [classesList])

  return styleClasses
}

export default useStyleClasses
