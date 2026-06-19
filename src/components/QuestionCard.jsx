import React from 'react'

const ACCENT_COLORS = {
  'System Design': 'text-accent-blue border-accent-blue/30 bg-accent-blue/10',
  'Coding (DSA)': 'text-accent-purple border-accent-purple/30 bg-accent-purple/10',
  'Behavioral (STAR)': 'text-accent-green border-accent-green/30 bg-accent-green/10',
  'Mixed': 'text-accent-orange border-accent-orange/30 bg-accent-orange/10',
}

const DIFF_COLORS = {
  easy: 'text-accent-green bg-accent-green/10',
  medium: 'text-accent-orange bg-accent-orange/10',
  hard: 'text-red-400 bg-red-400/10',
}

export default function QuestionCard({ question, index, total, interviewType, showRubric = false }) {
  if (!question) return null

  const accentClass = ACCENT_COLORS[interviewType] || ACCENT_COLORS['Mixed']

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4 animate-slide-up">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <span className="text-white/50 text-sm font-medium">
          Question {index + 1} of {total}
        </span>
        <div className="flex items-center gap-2">
          {question.difficulty && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${DIFF_COLORS[question.difficulty] || DIFF_COLORS.medium}`}>
              {question.difficulty}
            </span>
          )}
          {question.topic && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${accentClass}`}>
              {question.topic}
            </span>
          )}
        </div>
      </div>

      <p className="text-white text-lg font-semibold leading-snug">{question.question}</p>

      {showRubric && question.rubric && (
        <div>
          <p className="text-white/50 text-xs font-medium uppercase tracking-wider mb-2">Graded on</p>
          <ul className="space-y-1">
            {question.rubric.map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                <span className="text-white/30 shrink-0 mt-0.5">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
