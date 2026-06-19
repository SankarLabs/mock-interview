import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App.jsx'
import { useTTS } from '../hooks/useTTS.js'

const GRADE_STYLES = {
  A: 'text-accent-green',
  B: 'text-accent-blue',
  C: 'text-yellow-400',
  D: 'text-accent-orange',
  F: 'text-red-400',
}

const GRADE_BG = {
  A: 'border-accent-green/20 bg-accent-green/5',
  B: 'border-accent-blue/20 bg-accent-blue/5',
  C: 'border-yellow-400/20 bg-yellow-400/5',
  D: 'border-accent-orange/20 bg-accent-orange/5',
  F: 'border-red-400/20 bg-red-400/5',
}

function scoreToGrade(score) {
  return score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F'
}

export default function Results() {
  const navigate = useNavigate()
  const {
    questions, answers, interviewType,
    currentQuestionIndex, setCurrentQuestionIndex,
    resetSession,
  } = useApp()

  const [showTranscript, setShowTranscript] = useState(false)
  const { speak, stop: stopTTS, isSpeaking } = useTTS()

  const isLastQuestion = currentQuestionIndex === questions.length - 1
  const currentAnswer = answers[currentQuestionIndex]
  const currentQuestion = questions[currentQuestionIndex]

  function handleNext() {
    setCurrentQuestionIndex(currentQuestionIndex + 1)
    navigate('/interview')
  }

  function handleRestart() {
    resetSession()
    navigate('/')
  }

  // ── Final summary ──
  if (isLastQuestion && answers.length === questions.length) {
    const totalScore = answers.reduce((sum, a) => sum + (a.score || 0), 0)
    const avgScore = Math.round(totalScore / answers.length)
    const avgGrade = scoreToGrade(avgScore)
    const gradeClass = GRADE_STYLES[avgGrade] || 'text-white'
    const gradeBg = GRADE_BG[avgGrade] || 'border-white/10 bg-white/5'
    const weakest = answers.reduce((min, a, i) =>
      (a.score || 0) < (answers[min].score || 0) ? i : min, 0)

    return (
      <div className="min-h-screen flex flex-col bg-bg pb-32">
        {/* Nav */}
        <div className="flex items-center justify-between px-4 pt-5 pb-3 max-w-6xl mx-auto w-full">
          <button onClick={handleRestart} className="text-white/40 hover:text-white text-sm transition-colors">← Home</button>
          <span className="text-white/50 text-sm">{interviewType}</span>
          <span />
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-6 px-4 max-w-6xl mx-auto w-full">
          {/* LEFT — overall grade */}
          <div className="lg:w-2/5 space-y-4">
            <h1 className="text-2xl font-bold">Interview Complete 🎉</h1>
            <div className={`rounded-2xl border p-6 flex items-center gap-5 ${gradeBg}`}>
              <div className={`text-8xl font-extrabold leading-none ${gradeClass}`}>{avgGrade}</div>
              <div>
                <p className="text-4xl font-bold text-white">{avgScore}<span className="text-white/40 text-xl">/100</span></p>
                <p className="text-white/50 text-sm mt-1">avg across {questions.length} questions</p>
              </div>
            </div>
            <button
              onClick={handleRestart}
              className="w-full py-4 rounded-2xl font-bold text-base bg-accent-blue text-white hover:bg-accent-blue/90 active:scale-[0.98] transition-all"
            >
              Start New Session →
            </button>
          </div>

          {/* RIGHT — all questions */}
          <div className="lg:w-3/5 space-y-3">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">All Questions</p>
            {questions.map((q, i) => {
              const ans = answers[i]
              const g = ans?.grade || '—'
              const s = ans?.score || 0
              const gc = GRADE_STYLES[g] || 'text-white/40'
              const bg = GRADE_BG[g] || 'border-white/10 bg-white/5'
              return (
                <div key={i} className={`rounded-2xl border ${i === weakest ? 'border-red-500/40 bg-red-500/5' : bg} p-4 flex items-start gap-4`}>
                  <div className={`text-3xl font-extrabold leading-none shrink-0 mt-0.5 ${gc}`}>{g}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white/80 text-sm font-medium line-clamp-2">{q.question}</p>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="text-white/40 text-xs">{s}/100</span>
                      {i === weakest && <span className="text-red-400 text-xs">⚠️ weakest area</span>}
                      {ans?.improvementTip && (
                        <span className="text-white/30 text-xs truncate max-w-[200px]">{ans.improvementTip}</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ── Per-question results ──
  if (!currentAnswer) return (
    <div className="min-h-screen flex items-center justify-center text-white/40">No result found.</div>
  )

  const gradeClass = GRADE_STYLES[currentAnswer.grade] || 'text-white'
  const gradeBg = GRADE_BG[currentAnswer.grade] || 'border-white/10 bg-white/5'

  return (
    <div className="min-h-screen flex flex-col bg-bg pb-32">

      {/* Nav */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 max-w-6xl mx-auto w-full">
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white text-sm transition-colors">← Home</button>
        <span className="text-white/50 text-sm font-medium">
          Question {currentQuestionIndex + 1} / {questions.length} — Results
        </span>
        <span />
      </div>

      {/* Two-column body */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 px-4 max-w-6xl mx-auto w-full">

        {/* LEFT — question + grade */}
        <div className="lg:w-2/5 space-y-4">
          {/* Question */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Question</p>
            <p className="text-white text-base font-medium leading-snug">{currentQuestion?.question}</p>
          </div>

          {/* Grade */}
          <div className={`rounded-2xl border p-5 flex items-center gap-5 ${gradeBg}`}>
            <div className={`text-7xl font-extrabold leading-none ${gradeClass}`}>{currentAnswer.grade}</div>
            <div>
              <p className="text-3xl font-bold text-white">{currentAnswer.score}<span className="text-white/40 text-lg">/100</span></p>
              <p className="text-white/50 text-sm mt-0.5">Overall score</p>
            </div>
          </div>

          {/* Strong point */}
          {currentAnswer.strongPoints && (
            <div className="rounded-2xl border border-accent-green/20 bg-accent-green/5 p-4">
              <p className="text-accent-green text-xs font-semibold uppercase tracking-wider mb-1">Strong point</p>
              <p className="text-white/80 text-sm leading-relaxed">{currentAnswer.strongPoints}</p>
            </div>
          )}

          {/* Improvement tip */}
          {currentAnswer.improvementTip && (
            <div className="rounded-2xl border border-accent-orange/20 bg-accent-orange/5 p-4">
              <p className="text-accent-orange text-xs font-semibold uppercase tracking-wider mb-1">Improvement tip</p>
              <p className="text-white/80 text-sm leading-relaxed">{currentAnswer.improvementTip}</p>
            </div>
          )}
        </div>

        {/* RIGHT — rubric + feedback + model answer */}
        <div className="lg:w-3/5 space-y-4">
          {/* Rubric */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-3">Rubric Breakdown</p>
            <ul className="space-y-2">
              {currentAnswer.rubricHits?.map((point, i) => (
                <li key={`hit-${i}`} className="flex items-start gap-2 text-sm">
                  <span className="text-accent-green shrink-0 mt-0.5">✅</span>
                  <span className="text-white/80">{point}</span>
                </li>
              ))}
              {currentAnswer.rubricMisses?.map((point, i) => (
                <li key={`miss-${i}`} className="flex items-start gap-2 text-sm">
                  <span className="text-red-400 shrink-0 mt-0.5">❌</span>
                  <span className="text-white/60">{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Coach feedback */}
          {currentAnswer.feedback && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider mb-2">Coach's Feedback</p>
              <p className="text-white/90 text-sm leading-relaxed">{currentAnswer.feedback}</p>
            </div>
          )}

          {/* Model answer */}
          {currentAnswer.idealAnswer && (
            <div className="rounded-2xl border border-accent-blue/30 bg-accent-blue/5 p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-accent-blue">💡</span>
                  <p className="text-accent-blue text-xs font-semibold uppercase tracking-wider">Model Answer</p>
                </div>
                <button
                  onClick={() => isSpeaking ? stopTTS() : speak(currentAnswer.idealAnswer)}
                  title={isSpeaking ? 'Stop' : 'Read aloud'}
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-all ${
                    isSpeaking
                      ? 'bg-accent-blue/30 text-accent-blue animate-pulse'
                      : 'bg-white/8 text-white/40 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  {isSpeaking ? '🔊' : '🔈'}
                </button>
              </div>
              <p className="text-white/90 text-sm leading-relaxed">{currentAnswer.idealAnswer}</p>
            </div>
          )}

          {/* Transcript collapsible */}
          {currentAnswer.transcript && (
            <div className="rounded-2xl border border-white/10 bg-white/5 overflow-hidden">
              <button
                onClick={() => setShowTranscript(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-white/50 text-sm hover:text-white transition-colors"
              >
                <span className="font-medium">Your Answer (Transcript)</span>
                <span>{showTranscript ? '▲' : '▼'}</span>
              </button>
              {showTranscript && (
                <div className="px-4 pb-4 border-t border-white/10">
                  <p className="text-white/70 text-sm leading-relaxed mt-3 whitespace-pre-wrap">{currentAnswer.transcript}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg/90 backdrop-blur border-t border-white/8 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          {!isLastQuestion ? (
            <button
              onClick={handleNext}
              className="w-full py-4 rounded-2xl font-bold text-base bg-accent-blue text-white hover:bg-accent-blue/90 active:scale-[0.98] transition-all"
            >
              Next Question →
            </button>
          ) : (
            <button
              onClick={() => { setCurrentQuestionIndex(questions.length - 1); navigate('/results') }}
              className="w-full py-4 rounded-2xl font-bold text-base bg-accent-green text-white hover:bg-accent-green/90 active:scale-[0.98] transition-all"
            >
              View Final Summary →
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
