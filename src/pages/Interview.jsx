import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App.jsx'
import CameraView from '../components/CameraView.jsx'
import TranscriptBox from '../components/TranscriptBox.jsx'
import { useCamera } from '../hooks/useCamera.js'
import { useSpeech } from '../hooks/useSpeech.js'
import { useTimer } from '../hooks/useTimer.js'
import { useTTS } from '../hooks/useTTS.js'

const DIFF_COLORS = {
  easy: 'text-accent-green bg-accent-green/10',
  medium: 'text-accent-orange bg-accent-orange/10',
  hard: 'text-red-400 bg-red-400/10',
}

export default function Interview() {
  const navigate = useNavigate()
  const { questions, interviewType, currentQuestionIndex, addAnswer } = useApp()

  const { videoRef, start: startCamera, stop: stopCamera, error: cameraError, isActive: cameraActive } = useCamera()
  const { speak, stop: stopTTS, isSpeaking } = useTTS()
  const { transcript, isListening, start: startSpeech, stop: stopSpeech, isSupported: speechSupported } = useSpeech()
  const { seconds, formatted: timerFormatted, start: startTimer, stop: stopTimer } = useTimer()

  const [isRecording, setIsRecording] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [gradeError, setGradeError] = useState(null)
  const [typedAnswer, setTypedAnswer] = useState('')
  const [answerMode, setAnswerMode] = useState('voice')
  const [showRubric, setShowRubric] = useState(false)
  const [hints, setHints] = useState(null)
  const [hintLoading, setHintLoading] = useState(false)
  const [hintError, setHintError] = useState(null)

  const currentQuestion = questions[currentQuestionIndex]

  useEffect(() => {
    if (questions.length === 0) navigate('/')
  }, [])

  useEffect(() => {
    if (seconds >= 300 && isRecording) handleStopAndGrade()
  }, [seconds, isRecording])

  async function handleGetHint() {
    setHintError(null)
    setHintLoading(true)
    try {
      const response = await fetch('/api/get-hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          rubric: currentQuestion.rubric,
          interviewType,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to get hint')
      setHints(data.hints || [])
    } catch (err) {
      setHintError(err.message)
    } finally {
      setHintLoading(false)
    }
  }

  function handleBack() {
    stopCamera(); stopSpeech(); stopTimer()
    navigate('/setup')
  }

  async function handleStartAnswer() {
    setGradeError(null)
    setTypedAnswer('')
    stopTTS()
    startCamera()
    if (answerMode === 'voice') startSpeech()
    startTimer()
    setIsRecording(true)
  }

  async function handleStopAndGrade() {
    if (!isRecording) return
    setIsRecording(false)
    stopTimer(); stopCamera()
    const spokenText = stopSpeech()
    const answerText = answerMode === 'text'
      ? typedAnswer.trim() || '(No answer provided)'
      : spokenText || transcript || '(No answer recorded)'

    setIsGrading(true)
    setGradeError(null)

    try {
      const response = await fetch('/api/grade-answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion.question,
          transcript: answerText,
          rubric: currentQuestion.rubric,
          interviewType,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to grade answer')
      addAnswer({ ...data, transcript: answerText, questionIndex: currentQuestionIndex })
      navigate('/results')
    } catch (err) {
      setGradeError(err.message || 'Grading failed. Please try again.')
      setIsGrading(false)
    }
  }

  if (!currentQuestion) return null

  const isOverTime = seconds > 180
  const isMaxTime = seconds >= 300

  return (
    <div className="min-h-screen flex flex-col bg-bg">

      {/* ── Top nav bar ── */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 max-w-6xl mx-auto w-full">
        <button onClick={handleBack} className="text-white/40 hover:text-white text-sm transition-colors">
          ← Back
        </button>
        <span className="text-white/50 text-sm font-medium">
          Question {currentQuestionIndex + 1} / {questions.length}
        </span>
        <span className={`font-mono text-sm font-bold px-3 py-1 rounded-full ${
          isMaxTime ? 'bg-red-500/20 text-red-400' :
          isOverTime ? 'bg-accent-orange/20 text-accent-orange' :
          'bg-white/10 text-white/60'
        }`}>
          {timerFormatted}
        </span>
      </div>

      {isOverTime && (
        <div className={`mx-4 mb-2 rounded-xl px-4 py-2 text-sm text-center max-w-6xl mx-auto w-full ${
          isMaxTime ? 'bg-red-500/20 text-red-400' : 'bg-accent-orange/20 text-accent-orange'
        }`}>
          {isMaxTime ? 'Max time reached — stopping now' : '⚠️ Approaching 5-minute limit'}
        </div>
      )}

      {/* ── Main two-column layout ── */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 px-4 pb-36 max-w-6xl mx-auto w-full">

        {/* LEFT — Question panel */}
        <div className="lg:w-1/2 space-y-4">
          {/* Question card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              {currentQuestion.difficulty && (
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${DIFF_COLORS[currentQuestion.difficulty] || DIFF_COLORS.medium}`}>
                  {currentQuestion.difficulty}
                </span>
              )}
              {currentQuestion.topic && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full border border-accent-blue/30 bg-accent-blue/10 text-accent-blue">
                  {currentQuestion.topic}
                </span>
              )}
            </div>
            <div className="flex items-start gap-3">
              <p className="text-white text-xl font-semibold leading-snug flex-1">{currentQuestion.question}</p>
              <button
                onClick={() => isSpeaking ? stopTTS() : speak(currentQuestion.question)}
                title={isSpeaking ? 'Stop reading' : 'Read question aloud'}
                className={`shrink-0 mt-0.5 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  isSpeaking
                    ? 'bg-accent-blue/30 text-accent-blue animate-pulse'
                    : 'bg-white/8 text-white/40 hover:bg-white/15 hover:text-white'
                }`}
              >
                {isSpeaking ? '🔊' : '🔈'}
              </button>
            </div>

            {/* Rubric toggle */}
            <button
              onClick={() => setShowRubric(v => !v)}
              className="text-white/40 hover:text-white/70 text-xs transition-colors flex items-center gap-1"
            >
              {showRubric ? '▲ Hide rubric' : '▼ Show what you\'ll be graded on'}
            </button>
            {showRubric && currentQuestion.rubric && (
              <ul className="space-y-1 pt-1 border-t border-white/10">
                {currentQuestion.rubric.map((point, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                    <span className="text-white/25 shrink-0 mt-0.5">•</span>{point}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Hint */}
          {!isRecording && !isGrading && (
            <div>
              {!hints && (
                <button
                  onClick={handleGetHint}
                  disabled={hintLoading}
                  className="flex items-center gap-2 text-sm text-accent-orange/80 hover:text-accent-orange transition-colors disabled:opacity-50"
                >
                  {hintLoading
                    ? <><span className="w-3.5 h-3.5 border border-accent-orange border-t-transparent rounded-full animate-spin" /> Getting hint…</>
                    : <>💡 Give me a hint</>}
                </button>
              )}
              {hintError && <p className="text-red-400 text-xs mt-1">{hintError}</p>}
              {hints && (
                <div className="rounded-xl border border-accent-orange/20 bg-accent-orange/5 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-accent-orange text-xs font-semibold uppercase tracking-wider">💡 Hints</span>
                    <button onClick={() => setHints(null)} className="text-white/30 hover:text-white/60 text-xs transition-colors">✕ hide</button>
                  </div>
                  <ul className="space-y-1.5">
                    {hints.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-white/75">
                        <span className="text-accent-orange/60 shrink-0 mt-0.5">•</span>{h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Tip */}
          {!isRecording && !isGrading && !hints && (
            <p className="text-white/25 text-xs px-1">
              Take a moment to think, then hit Start when ready. You have up to 5 minutes.
            </p>
          )}
        </div>

        {/* RIGHT — Camera + answer panel */}
        <div className="lg:w-1/2 space-y-4">
          {/* Camera */}
          {cameraError ? (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/35 text-xs">
              <span>📷</span><span>Camera unavailable — audio-only mode</span>
            </div>
          ) : (
            <CameraView videoRef={videoRef} isActive={cameraActive} error={null} />
          )}

          {/* Answer mode toggle */}
          {!isRecording && !isGrading && (
            <div className="flex rounded-xl overflow-hidden border border-white/10 text-sm font-medium">
              <button
                onClick={() => setAnswerMode('voice')}
                className={`flex-1 py-2.5 transition-colors ${answerMode === 'voice' ? 'bg-accent-blue/20 text-accent-blue' : 'bg-white/5 text-white/40 hover:text-white/70'}`}
              >
                🎙️ Speak
              </button>
              <button
                onClick={() => setAnswerMode('text')}
                className={`flex-1 py-2.5 transition-colors ${answerMode === 'text' ? 'bg-accent-blue/20 text-accent-blue' : 'bg-white/5 text-white/40 hover:text-white/70'}`}
              >
                ⌨️ Type
              </button>
            </div>
          )}

          {/* Voice transcript — only shown once recording has started */}
          {answerMode === 'voice' && (
            <>
              {!speechSupported && (
                <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-3 text-yellow-400 text-sm text-center">
                  Speech recognition requires Chrome or Safari. Switch to Type mode.
                </div>
              )}
              {isRecording && <TranscriptBox transcript={transcript} isListening={isListening} />}
            </>
          )}

          {/* Text input — only shown once recording has started */}
          {answerMode === 'text' && isRecording && (
            <textarea
              value={typedAnswer}
              onChange={e => setTypedAnswer(e.target.value)}
              placeholder="Type your answer here…"
              rows={6}
              className="w-full rounded-xl bg-white/5 border border-white/10 text-white/90 text-sm p-3 resize-none placeholder:text-white/30 focus:outline-none focus:border-accent-blue/50 transition-colors"
            />
          )}

          {gradeError && (
            <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-red-400 text-sm">
              {gradeError}
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky bottom action bar ── */}
      <div className="fixed bottom-0 left-0 right-0 bg-bg/90 backdrop-blur border-t border-white/8 px-4 py-4">
        <div className="max-w-6xl mx-auto">
          {isGrading ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
              <span className="text-white/60 text-sm">Grading your answer…</span>
            </div>
          ) : !isRecording ? (
            <button
              onClick={handleStartAnswer}
              disabled={answerMode === 'voice' && !speechSupported}
              className="w-full py-4 rounded-2xl font-bold text-base bg-accent-green text-white hover:bg-accent-green/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {answerMode === 'voice' ? '🎙️ Start Speaking' : '⌨️ Start Typing'}
            </button>
          ) : (
            <button
              onClick={handleStopAndGrade}
              className="w-full py-4 rounded-2xl font-bold text-base bg-red-500 text-white hover:bg-red-500/90 active:scale-[0.98] transition-all duration-200"
            >
              ⏹ Stop &amp; Grade
            </button>
          )}
        </div>
      </div>

    </div>
  )
}
