// useBioScan — biometric scan phase machine (idle | scan | ok). Basic hook.
const { useState } = React

function useBioScan(onDone) {
  const [phase, setPhase] = useState('idle')
  const start = () => {
    if (phase !== 'idle') return
    setPhase('scan')
    setTimeout(() => {
      setPhase('ok')
      setTimeout(onDone, 500)
    }, 1400)
  }
  return { phase, start }
}

Object.assign(window, { useBioScan })
