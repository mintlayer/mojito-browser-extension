import QRCode from 'react-qr-code'
import styles from './QrCode.module.css'

interface QrCodeProps {
  value: string
  size?: number
}

// Real QR code on a white padded tile so scanners can read the payload
// against the dark UI.
const QrCode = ({ value, size = 168 }: QrCodeProps) => {
  return (
    <div
      className={styles.tile}
      style={{ padding: size * 0.06 }}
      data-testid="qr-code"
    >
      <QRCode
        value={value}
        size={size}
        bgColor="#ffffff"
        fgColor="#0b0a09"
      />
    </div>
  )
}

export default QrCode
