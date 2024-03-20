import React, { useEffect, useState } from 'react'

const Timer = ({ onTimerEnd, repeat, duration }) => {
  const [timer, setTimer] = useState(null)

  const stopTimer = () => {
    if (timer) {
      clearTimeout(timer)
      setTimer(null)
    }
  }

  const startTimer = () => {
    stopTimer() // Ensure no timer is already running
    const newTimer = setTimeout(() => {
      onTimerEnd() // Call the function provided via props
      if (repeat) {
        startTimer() // Restart the timer if `repeat` is true
      }
    }, duration)
    setTimer(newTimer)
  }

  useEffect(() => {
    startTimer()
    return () => stopTimer() // Cleanup on component unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [repeat, duration, onTimerEnd])

  return <div></div>
}

export default Timer
