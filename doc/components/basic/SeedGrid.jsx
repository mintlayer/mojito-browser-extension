// SeedGrid — numbered recovery-phrase word grid, optional blur. Basic: no dependencies.
// Extracted from the onboarding Seed screen and Settings "reveal recovery phrase".
function SeedGrid({ words, hidden = false }) {
  return (
    <div className="seedgrid">
      {words.map((w, i) => (
        <div
          key={i}
          className={'seedw' + (hidden ? ' blur' : '')}
        >
          <span className="n">{i + 1}</span>
          {w}
        </div>
      ))}
    </div>
  )
}

Object.assign(window, { SeedGrid })
