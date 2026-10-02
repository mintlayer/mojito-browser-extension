// Tag — colored label pill. Basic: no dependencies.
function Tag({ c = 'grey', children }) {
  return <span className={'tag ' + c}>{children}</span>
}

Object.assign(window, { Tag })
