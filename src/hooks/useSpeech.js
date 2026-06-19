import { useState, useRef, useCallback } from 'react'

const SpeechRecognition =
  typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null

export function useSpeech() {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const finalTranscriptRef = useRef('')

  const isSupported = Boolean(SpeechRecognition)

  const start = useCallback(() => {
    if (!SpeechRecognition) return
    finalTranscriptRef.current = ''
    setTranscript('')

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event) => {
      let interim = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript + ' '
        } else {
          interim += result[0].transcript
        }
      }
      setTranscript(finalTranscriptRef.current + interim)
    }

    recognition.onerror = (event) => {
      if (event.error !== 'no-speech') {
        console.error('Speech recognition error:', event.error)
      }
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognitionRef.current = recognition
    recognition.start()
    setIsListening(true)
  }, [])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsListening(false)
    return finalTranscriptRef.current.trim()
  }, [])

  return { transcript, isListening, start, stop, isSupported }
}
