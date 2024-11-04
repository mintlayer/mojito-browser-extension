import { useState } from 'react'
import QRCode from 'react-qr-code'

import { Button } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'

import './ShowAddress.css'

const ShowAddress = ({
  address: defaultAddress,
  onCopy,
  unusedAddress,
  transactions,
}) => {
  const [toCopyLabel, afterCopyLabel] = ['Copy Address', 'Copied!']
  const copiedTimeoutInMs = 2 * 1_000
  const [label, setLabel] = useState(toCopyLabel)
  const [disabled, setDisabled] = useState(false)
  const [showUnused, setShowUnused] = useState(false)

  const address = showUnused ? unusedAddress : defaultAddress

  const addressLabel = showUnused
    ? 'Show first address'
    : 'Generate new address'

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

  const toggleUnused = () => {
    setShowUnused(!showUnused)
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
              {unusedAddress && (
                <>
                  {(showUnused || transactions.length === 0) && (
                    <span className="unused-address"> (new)</span>
                  )}
                  {!showUnused && transactions.length > 0 && (
                    <span className="used-address"> (used)</span>
                  )}
                </>
              )}
            </p>

            {unusedAddress ? (
              <button
                className="show-unused"
                onClick={toggleUnused}
              >
                {addressLabel}
              </button>
            ) : (
              <></>
            )}
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
