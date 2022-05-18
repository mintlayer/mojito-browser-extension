import { useEffect, useState } from 'react'

const useStyleClasses = (styleClasses) => {
  const [formattedStyleClasses, setFormattedStyleClasses] = useState([])

  useEffect(() => {
    setFormattedStyleClasses(styleClasses.join(' '))
  }, [styleClasses])

  return formattedStyleClasses
}

export default useStyleClasses
