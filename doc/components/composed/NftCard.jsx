// NftCard — NFT tile with radial art placeholder and optional caption. Composes basic HTML only.
// From NftGrid (Home → NFTs tab) and NftScreenBE media block.
function NftCard({
  n,
  onClick,
  index = 0,
  aspect,
  radius,
  inset = 10,
  label,
  showCaption = false,
}) {
  const style = { animation: `slide-up 400ms ${index * 60}ms ease both` }
  if (aspect) {
    style.aspectRatio = aspect
    style.borderRadius = radius || 18
  } else if (radius) {
    style.borderRadius = radius
  }
  return (
    <div
      className="nft"
      style={style}
      onClick={onClick}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `radial-gradient(80% 80% at 30% 20%, oklch(0.6 0.14 ${n.hue} / 0.5), transparent 70%)`,
        }}
      ></div>
      <div
        className="ph"
        style={{
          position: 'absolute',
          inset,
          border: 'none',
          background: 'transparent',
        }}
      >
        {label || 'nft media'}
      </div>
      {showCaption && (
        <div className="cap">
          {n.name}
          <div
            className="hint"
            style={{ fontSize: 10 }}
          >
            {n.collection}
          </div>
        </div>
      )}
    </div>
  )
}

Object.assign(window, { NftCard })
