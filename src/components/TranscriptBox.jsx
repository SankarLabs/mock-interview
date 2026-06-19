import React, { useEffect, useRef } from 'react'

export default function TranscriptBox({ transcript, isListening }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [transcript])

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-white/60 text-sm font-medium">Live Transcript</span>
        {isListening && (
          <span className="flex items-center gap-1 text-accent-green text-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green animate-pulse" />
            listening
          </span>
        )}
      </div>
      <div className="min-h-[100px] max-h-[180px] overflow-y-auto rounded-xl bg-white/5 border border-white/10 p-3">
        {transcript ? (
          <p className="text-white/90 text-sm leading-relaxed whitespace-pre-wrap">
            {transcript}
          </p>
        ) : (
          <p className="text-white/30 text-sm italic">
            {isListening ? 'Start speaking — your words will appear here…' : 'Press "Start Answer" to begin speaking'}
          </p>
        )}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
