// AccountRow — account picker/settings row. Composes: Avatar, Row.
// From AccountsSheet, Settings → Accounts and the dApp connect account list.
function AccountRow({ acct, sub, right, onClick, active = false }) {
  return (
    <Row
      left={<Avatar acct={acct} />}
      title={
        <React.Fragment>
          {acct.name}
          {active && <span className="hint"> · active</span>}
        </React.Fragment>
      }
      sub={sub}
      right={right}
      onClick={onClick}
    />
  )
}

Object.assign(window, { AccountRow })
