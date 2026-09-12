// BeSheet — titled, scrollable bottom sheet. Composes: Sheet.
function BeSheet({ open, onClose, title, children, label }) {
  if (!open) return null
  return (
    <Sheet
      open={open}
      onClose={onClose}
      label={label || title || 'Sheet'}
    >
      {title && (
        <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 12 }}>
          {title}
        </div>
      )}
      <div className="scroll">{children}</div>
    </Sheet>
  )
}

Object.assign(window, { BeSheet })
