// KV — key/value list inside a Card. Composes: Card.
function KV({ rows }) {
  return (
    <Card style={{ padding: '2px 14px' }}>
      {rows.map(([k, v]) => (
        <div
          className="kv"
          key={k}
        >
          <span className="k">{k}</span>
          <span className="v">{v}</span>
        </div>
      ))}
    </Card>
  )
}

Object.assign(window, { KV })
