import styles from './QrPlaceholder.module.css'

interface QrPlaceholderProps {
  size?: number
  label?: string
}

// Striped labelled placeholder — the real QR is rendered by the extension
// (see doc/server-requirements.md).
const QrPlaceholder = ({
  size = 168,
  label = 'QR code',
}: QrPlaceholderProps) => {
  return (
    <div
      className={styles.qr}
      style={{ width: size, height: size }}
      data-testid="qr-placeholder"
    >
      {label}
    </div>
  )
}

export default QrPlaceholder
