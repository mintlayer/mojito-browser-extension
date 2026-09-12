// Hdr — screen header with back / title / close / right slot. Basic: no component dependencies.
function Hdr({ title, onBack, onClose, right }) {
  return (
    <div className="hdr">
      {onBack ? (
        <div
          className="ib"
          onClick={onBack}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M15 18l-6-6 6-6"></path>
          </svg>
        </div>
      ) : (
        <div className="ib ghost"></div>
      )}
      <h1>{title}</h1>
      {right ? (
        right
      ) : onClose ? (
        <div
          className="ib"
          onClick={onClose}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M6 6l12 12M18 6L6 18"></path>
          </svg>
        </div>
      ) : (
        <div className="ib ghost"></div>
      )}
    </div>
  )
}

Object.assign(window, { Hdr })
