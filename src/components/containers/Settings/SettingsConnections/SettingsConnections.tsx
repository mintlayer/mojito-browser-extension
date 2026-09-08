import { useCallback, useEffect, useState } from 'react'

import { Button, SiteBadge } from '@BasicComponents'
import { Browser } from '@Browser'

import styles from './SettingsConnections.module.css'

const { storage, runtime } = Browser

interface ConnectedSite {
  origin: string
  timestamp?: number
}

const formatDate = (timestamp?: number) =>
  timestamp ? new Date(timestamp).toLocaleString() : 'unknown date'

const SettingsConnections = () => {
  const [sites, setSites] = useState<ConnectedSite[]>([])

  const readSites = useCallback(() => {
    if (!storage) return

    storage.local.get(['connectedSites'], (data: any) => {
      if (runtime?.lastError) {
        console.error('[Mojito] Storage get error:', runtime.lastError)
        return
      }

      const connectedSites = data?.connectedSites || {}
      const list = Object.keys(connectedSites).map((origin) => ({
        origin,
        timestamp: connectedSites[origin]?.timestamp,
      }))

      list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      setSites(list)
    })
  }, [])

  useEffect(() => {
    readSites()

    if (!storage?.onChanged) return

    const onStorageChanged = (changes: any, area: string) => {
      if (area === 'local' && changes.connectedSites) readSites()
    }

    storage.onChanged.addListener(onStorageChanged)
    return () => storage.onChanged.removeListener(onStorageChanged)
  }, [readSites])

  // SECURITY: revoking a connection is a permission revocation — it must
  // immediately delete the grant (storage + the service worker's session
  // map) and propagate to the site's open tabs. Never leave a half-removed
  // grant behind.
  const disconnectHandler = (origin: string) => {
    if (!runtime) return

    runtime.sendMessage({ action: 'disconnectSite', origin }, () => {
      if (runtime.lastError) {
        console.error('[Mojito] Disconnect error:', runtime.lastError)
      }
      readSites()
    })
  }

  if (sites.length === 0) {
    return (
      <p className={styles.empty}>
        No websites are connected to your wallet yet.
      </p>
    )
  }

  return (
    <ul className={styles.list}>
      {sites.map((site) => (
        <li
          className={styles.row}
          key={site.origin}
        >
          <div className={styles.info}>
            <SiteBadge origin={site.origin} />
            <span className={styles.date}>
              Connected {formatDate(site.timestamp)}
            </span>
          </div>
          <Button
            onClickHandle={() => disconnectHandler(site.origin)}
            extraStyleClasses={[styles.disconnectButton]}
          >
            Disconnect
          </Button>
        </li>
      ))}
    </ul>
  )
}

export default SettingsConnections
