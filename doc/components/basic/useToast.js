// Toast — transient message element + useToast hook. Basic: no dependencies.
const { useState, useRef } = React

function useToast() {
  const [msg, setMsg] = useState(null)
  const t = useRef(null)
  const show = (m) => {
    setMsg(m)
    clearTimeout(t.current)
    t.current = setTimeout(() => setMsg(null), 1800)
  }
  const el = msg ? <div className="toast">{msg}</div> : null
  return [show, el]
}

Object.assign(window, { useToast })
