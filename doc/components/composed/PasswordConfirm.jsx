// PasswordConfirm — shared "confirm with password" step. Composes: IconTile, PwField.
// Extracted from SendScreenBE step 2, DappWindow password phase and UnlockScreenBE.
function PasswordConfirm({
  title,
  sub,
  icon = 'lock',
  pw,
  onPw,
  bad,
  onEnter,
  cta = 'Confirm',
  onConfirm,
  children,
}) {
  return (
    <React.Fragment>
      <div
        className="scroll pad"
        style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        {children}
        <div style={{ textAlign: 'center' }}>
          <div style={{ display: 'inline-block' }}>
            <IconTile
              icon={icon}
              color="var(--amber)"
              size={64}
              radius="50%"
              bg="var(--amber-soft)"
            />
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, marginTop: 16 }}>
            {title}
          </div>
          {sub && (
            <div
              className="hint"
              style={{ marginTop: 4 }}
            >
              {sub}
            </div>
          )}
        </div>
        <div
          className={bad ? 'shake' : ''}
          style={{ marginTop: 22 }}
        >
          <PwField
            value={pw}
            onChange={onPw}
            autoFocus
            bad={bad}
            onEnter={onEnter}
          />
        </div>
        {bad && (
          <span
            className="hint bad"
            style={{ marginTop: 8 }}
          >
            Incorrect password
          </span>
        )}
      </div>
      <div
        className="pad"
        style={{ paddingBottom: 22 }}
      >
        <button
          className="btn primary"
          style={{ width: '100%' }}
          onClick={onConfirm}
        >
          {cta}
        </button>
      </div>
    </React.Fragment>
  )
}

Object.assign(window, { PasswordConfirm })
