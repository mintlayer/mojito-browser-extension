import { useState, useEffect, useRef } from 'react'
import QRCode from 'react-qr-code'

import { Button } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'

import './ShowAddress.css'

const ShowAddress = ({ address }) => {
  const [toCopyLabel, afterCopyLabel] = ['Copy Address', 'Copied!']
  const copiedTimeoutInMs = 2000
  const [label, setLabel] = useState(toCopyLabel)
  const [disabled, setDisabled] = useState(false)
  const resetTimerRef = useRef(null)

  useEffect(
    () => () => {
      clearTimeout(resetTimerRef.current)
    },
    [],
  )

  const copyAddress = () => {
    setDisabled(true)
    Promise.resolve(navigator.clipboard.writeText(address))
      .then(() => {
        setLabel(afterCopyLabel)
      })
      .catch((error) => {
        console.error('Failed to copy the address.', error)
      })
      .finally(() => {
        resetTimerRef.current = setTimeout(() => {
          setLabel(toCopyLabel)
          setDisabled(false)
        }, copiedTimeoutInMs)
      })
  }

  return (
    <div>
      <CenteredLayout>
        <VerticalGroup>
          <div className="qrcode">
            <QRCode
              data-testid="svg-testid"
              value={address}
            />
          </div>
          <div className="address">
            <p>Address:</p>
            <p>
              <strong>{address}</strong>
            </p>
          </div>
          <CenteredLayout>
            <Button
              extraStyleClasses={['press']}
              onClickHandle={copyAddress}
              disabled={disabled}
            >
              {label}
            </Button>
          </CenteredLayout>
        </VerticalGroup>
      </CenteredLayout>
    </div>
  )
}

export default ShowAddress
