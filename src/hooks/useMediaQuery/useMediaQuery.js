import { useState, useEffect } from 'react'

const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query)
    const documentChangeHandler = () => setMatches(mediaQueryList.matches)

    // Set the initial state
    setMatches(mediaQueryList.matches)

    // Listen for changes
    mediaQueryList.addEventListener('change', documentChangeHandler)

    // Cleanup event listener on component unmount
    return () => {
      mediaQueryList.removeEventListener('change', documentChangeHandler)
    }
  }, [query])

  return matches
}

export default useMediaQuery

// Example of usage
// const isSmallScreen = useMediaQuery('(max-width: 767px)')
