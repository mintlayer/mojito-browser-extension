import React, { useEffect, useRef } from 'react'

const Timer = ({ onTimerEnd, repeat, duration }) => {
  const timerIdRef = useRef(null)
  const onTimerEndRef = useRef(onTimerEnd)
  onTimerEndRef.current = onTimerEnd

  const clearTimer = () => {
    clearTimeout(timerIdRef.current)
    timerIdRef.current = null
  }

  const startTimer = () => {
    clearTimer()
    timerIdRef.current = setTimeout(() => {
      onTimerEndRef.current()
      if (repeat) {
        startTimer()
      }
    }, duration)
  }

  useEffect(() => {
    startTimer()
    return () => clearTimer()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeat, duration])

  return <div></div>
}

export default Timer
