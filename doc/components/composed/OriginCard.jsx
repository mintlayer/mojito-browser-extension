// OriginCard — dApp/site origin header. Composes: Favicon, Tag, Icon.
// From be-dapp.jsx; also matches the Settings → Connected sites rows.
function OriginCard({ req, s }) {
  const connected = s.sites.some((x) => x.origin === req.origin)
  return (
    <div className="origin">
      <Favicon
        name={req.name}
        hue={req.hue}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{req.name}</div>
        <div
          className="mono"
          style={{
            fontSize: 10,
            color: 'var(--text-3)',
            display: 'flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <Icon
            name="lock"
            size={9}
            color="var(--green)"
          />
          {req.origin}
        </div>
      </div>
      {connected ? (
        <Tag c="green">Connected</Tag>
      ) : (
        <Tag c="amber">New site</Tag>
      )}
    </div>
  )
}

Object.assign(window, { OriginCard })
