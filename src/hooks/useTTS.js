import { useState, useEffect, useCallback, useRef } from 'react'

let cachedVoices = []
function loadVoices() {
  cachedVoices = window.speechSynthesis.getVoices()
}

function pickBestVoice() {
  const voices = cachedVoices.length ? cachedVoices : window.speechSynthesis.getVoices()
  // Male voice priority — most natural on each platform
  const priority = [
    'Alex',                     // macOS — warm, natural male
    'Daniel',                   // macOS British male
    'Google UK English Male',   // Chrome neural male
    'Microsoft Guy',            // Windows male
    'Microsoft David',          // Windows male
    'Microsoft Mark',           // Windows male
    'Fred',                     // older macOS fallback
  ]
  for (const name of priority) {
    const match = voices.find(v => v.name.includes(name))
    if (match) return match
  }
  return voices.find(v => v.lang === 'en-US' && !v.name.toLowerCase().includes('compact'))
    || voices.find(v => v.lang?.startsWith('en'))
    || voices[0]
}

function splitSentences(text) {
  return text
    .replace(/([.!?])\s+/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(Boolean)
}

export function useTTS() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const cancelledRef = useRef(false)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (!isSupported) return
    loadVoices()
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices)
    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices)
      window.speechSynthesis.cancel()
      clearTimeout(timeoutRef.current)
    }
  }, [])

  const stop = useCallback(() => {
    if (!isSupported) return
    cancelledRef.current = true          // tells the sentence chain to halt
    clearTimeout(timeoutRef.current)
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [isSupported])

  const speak = useCallback((text) => {
    if (!isSupported) return
    cancelledRef.current = false         // reset cancel flag for new playback
    clearTimeout(timeoutRef.current)
    window.speechSynthesis.cancel()

    const sentences = splitSentences(text)
    const voice = pickBestVoice()
    let idx = 0

    setIsSpeaking(true)

    function speakNext() {
      if (cancelledRef.current || idx >= sentences.length) {
        if (!cancelledRef.current) setIsSpeaking(false)
        return
      }
      const utt = new SpeechSynthesisUtterance(sentences[idx])
      utt.lang = 'en-US'
      utt.rate = 0.9
      utt.pitch = 0.95       // slightly lower pitch = more natural male tone
      utt.volume = 1
      if (voice) utt.voice = voice

      utt.onend = () => {
        if (cancelledRef.current) return  // cancelled mid-chain — don't continue
        idx++
        timeoutRef.current = setTimeout(speakNext, 130)
      }
      utt.onerror = () => {
        if (cancelledRef.current) return
        idx++
        speakNext()
      }
      window.speechSynthesis.speak(utt)
    }

    speakNext()
  }, [isSupported])

  return { speak, stop, isSpeaking, isSupported }
}
