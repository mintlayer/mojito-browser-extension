// pwScore — password strength scoring 0..4. Pure helper, no dependencies.
function pwScore(p) {
  let s = 0
  if (p.length >= 8) s++
  if (p.length >= 12) s++
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++
  if (/\d/.test(p)) s++
  if (/[^\w]/.test(p)) s++
  return Math.min(4, s)
}

Object.assign(window, { pwScore })
