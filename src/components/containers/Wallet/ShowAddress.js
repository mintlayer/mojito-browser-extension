import { useState } from 'react'
import QRCode from 'react-qr-code'

import { Button } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'

import './ShowAddress.css'

const ShowAddress = ({ address, onCopy }) => {
  const [toCopyLabel, afterCopyLabel] = ['Copy Address', 'Copied!']
  const copiedTimeoutInMs = 2 * 1_000
  const [label, setLabel] = useState(toCopyLabel)
  const [disabled, setDisabled] = useState(false)

  const copyAddress = () => {
    setDisabled(true)
    navigator.clipboard.writeText(address)
    setLabel(afterCopyLabel)
    setTimeout(() => {
      setLabel(toCopyLabel)
      setDisabled(false)
    }, copiedTimeoutInMs)
    onCopy && onCopy(address)
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
          <Button
            extraStyleClasses={['press']}
            onClickHandle={copyAddress}
            disabled={disabled}
          >
            {label}
          </Button>
        </VerticalGroup>
      </CenteredLayout>
    </div>
  )
}

export default ShowAddress
