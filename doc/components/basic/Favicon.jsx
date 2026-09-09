// Favicon — colored letter circle for sites/dApps. Basic: no dependencies.
// Extracted from OriginCard and the settings "connected sites" rows.
function Favicon({ name, hue = 195, size = 36 }) {
  return (
    <div
      className="favicon"
      style={{
        background: `oklch(0.6 0.14 ${hue} / 0.25)`,
        color: `oklch(0.85 0.12 ${hue})`,
      }}
    >
      {name[0]}
    </div>
  )
}

Object.assign(window, { Favicon })
