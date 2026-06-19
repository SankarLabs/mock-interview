import { useState, useRef, useCallback } from 'react'

export function useTimer() {
  const [seconds, setSeconds] = useState(0)
  const intervalRef = useRef(null)

  const start = useCallback(() => {
    setSeconds(0)
    intervalRef.current = setInterval(() => {
      setSeconds(s => s + 1)
    }, 1000)
  }, [])

  const stop = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
  }, [])

  const reset = useCallback(() => {
    clearInterval(intervalRef.current)
    intervalRef.current = null
    setSeconds(0)
  }, [])

  const formatted = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`

  return { seconds, formatted, start, stop, reset }
}
