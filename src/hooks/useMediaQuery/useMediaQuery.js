import { useState, useEffect } from 'react'

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)
  const [prevQuery, setPrevQuery] = useState(query)

  if (query !== prevQuery) {
    setPrevQuery(query)
    setMatches(window.matchMedia(query).matches)
  }

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    const documentChangeHandler = () => setMatches(mediaQueryList.matches)

    mediaQueryList.addEventListener('change', documentChangeHandler)

    return () => {
      mediaQueryList.removeEventListener('change', documentChangeHandler)
    }
  }, [query])

  return matches
}

export default useMediaQuery

// Example of usage
// const isSmallScreen = useMediaQuery('(max-width: 767px)')
