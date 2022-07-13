import QRCode from 'react-qr-code'

import { Button } from '@BasicComponents'
import { CenteredLayout, VerticalGroup } from '@LayoutComponents'

import './ShowAddress.css'

const ShowAddress = ({ address, onCopy }) => {
  const copyAddress = () => {
    navigator.clipboard.writeText(address)
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
          >
            Copy Address
          </Button>
        </VerticalGroup>
      </CenteredLayout>
    </div>
  )
}

export default ShowAddress
