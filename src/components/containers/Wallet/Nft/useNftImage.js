import { useContext, useEffect, useState } from 'react'

import { Mintlayer } from '@APIs'
import { SettingsContext } from '@Contexts'

/**
 * Resolves an NFT's ipfs:// image uri to a renderable in-memory blob: url
 * through the wallet's gateway resolver (explorer proxy first, public
 * gateway race as fallback). Results are cached inside the resolver, so
 * remounts and refreshes don't refetch. Returns null while loading or when
 * the image is unreachable — callers render their fallback tile.
 */
const useNftImage = (ipfsUri) => {
  const { networkType } = useContext(SettingsContext)
  const [resolved, setResolved] = useState({ uri: null, src: null })

  useEffect(() => {
    let active = true
    if (!ipfsUri) return undefined
    Mintlayer.resolveNftImage(ipfsUri, networkType).then((url) => {
      if (active) setResolved({ uri: ipfsUri, src: url })
    })
    return () => {
      active = false
    }
  }, [ipfsUri, networkType])

  // Only return a src that belongs to the current uri: on uri change the
  // stale image is never shown, the fallback tile renders until resolved.
  return resolved.uri === ipfsUri ? resolved.src : null
}

export default useNftImage
