import React, { useState } from 'react'

const GRADE_STYLES = {
  A: 'text-accent-green',
  B: 'text-accent-blue',
  C: 'text-yellow-400',
  D: 'text-accent-orange',
  F: 'text-red-400',
}

export default function ScoreCard({ result, question, transcript }) {
  const [showTranscript, setShowTranscript] = useState(false)

  if (!result) return null

  const gradeClass = GRADE_STYLES[result.grade] || 'text-white'

  return (
    <div className="w-full space-y-4 animate-slide-up">
      {/* Score header */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center gap-5">
        <div className={`text-7xl font-extrabold leading-none ${gradeClass}`}>{result.grade}</div>
        <div>
          <div className="text-3xl font-bold text-white">{result.score}<span className="text-white/40 text-lg">/100</span></div>
          <div className="text-white/50 text-sm mt-0.5">Overall score</div>
        </div>
      </div>

      {/* Rubric breakdown */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider mb-3">Rubric Breakdown</h3>
        <ul className="space-y-2">
          {result.rubricHits?.map((point, i) => (
            <li key={`hit-${i}`} className="flex items-start gap-2 text-sm">
              <span className="text-accent-green shrink-0 mt-0.5">✅</span>
              <span className="text-white/80">{point}</span>
            </li>
          ))}
          {result.rubricMisses?.map((point, i) => (
            <li key={`miss-${i}`} className="flex items-start gap-2 text-sm">
              <span className="text-red-400 shrink-0 mt-0.5">❌</span>
              <span className="text-white/60">{point}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Feedback */}
      {result.feedback && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
          <h3 className="text-white/60 text-xs font-medium uppercase tracking-wider">Coach's Feedback</h3>
          <p className="text-white/90 text-sm leading-relaxed">{result.feedback}</p>
          {result.strongPoints && (
            <div className="border-l-2 border-accent-green pl-3">
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Strong point</p>
              <p className="text-accent-green text-sm">{result.strongPoints}</p>
            </div>
          )}
          {result.improvementTip && (
            <div className="border-l-2 border-accent-orange pl-3">
              <p className="text-white/60 text-xs font-medium uppercase tracking-wider mb-1">Improvement tip</p>
              <p className="text-accent-orange text-sm">{result.improvementTip}</p>
            </div>
          )}
        </div>
      )}

      {/* Ideal answer */}
      {result.idealAnswer && (
        <div className="rounded-2xl border border-accent-blue/30 bg-accent-blue/5 p-5 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-accent-blue text-base">💡</span>
            <h3 className="text-accent-blue text-xs font-semibold uppercase tracking-wider">Model Answer</h3>
          </div>
          <p className="text-white/90 text-sm leading-relaxed">{result.idealAnswer}</p>
        </div>
      )}

      {/* Transcript collapsible */}
      {transcript && (
        <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
          <button
            onClick={() => setShowTranscript(v => !v)}
            className="w-full flex items-center justify-between px-5 py-3 text-white/60 text-sm hover:text-white transition-colors"
          >
            <span className="font-medium">Your Answer (Transcript)</span>
            <span>{showTranscript ? '▲' : '▼'}</span>
          </button>
          {showTranscript && (
            <div className="px-5 pb-4 border-t border-white/10">
              <p className="text-white/70 text-sm leading-relaxed mt-3 whitespace-pre-wrap">{transcript}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
