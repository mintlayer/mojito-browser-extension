// QrPlaceholder — striped labelled placeholder (real QR is rendered by the extension). Basic: no dependencies.
function QrPlaceholder({ size = 168, label = 'QR code' }) {
  return (
    <div
      className="ph"
      style={{ width: size, height: size, margin: '0 auto', borderRadius: 18 }}
    >
      {label}
    </div>
  )
}

Object.assign(window, { QrPlaceholder })
