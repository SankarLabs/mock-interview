import { useRef, useState, useCallback } from 'react'

export function useCamera() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [isActive, setIsActive] = useState(false)
  const [error, setError] = useState(null)

  const start = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.style.transform = 'scaleX(-1)'
      }
      setIsActive(true)
    } catch (err) {
      if (err.name === 'NotAllowedError') {
        setError('Camera and microphone access was denied. Please allow permissions in your browser settings.')
      } else if (err.name === 'NotFoundError') {
        setError('No camera or microphone found. Please connect a device and try again.')
      } else {
        setError(`Could not access camera: ${err.message}`)
      }
    }
  }, [])

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    setIsActive(false)
  }, [])

  return { videoRef, start, stop, error, isActive }
}
