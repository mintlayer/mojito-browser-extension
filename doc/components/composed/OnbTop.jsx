// OnbTop — onboarding header: back button + Progress + step counter. Composes: Progress.
// From be-onboarding.jsx OnbTop (equivalent of onb-core OnbHeader).
function OnbTop({ api, step, total = 4 }) {
  return (
    <div className="hdr">
      <div
        className="ib"
        onClick={api.back}
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
      <Progress
        step={step}
        total={total}
      />
      <span
        className="mono"
        style={{ fontSize: 11, color: 'var(--text-3)' }}
      >
        {step}/{total}
      </span>
    </div>
  )
}

Object.assign(window, { OnbTop })
