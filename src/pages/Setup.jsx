import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App.jsx'

const LEVEL_LABELS = { junior: '🌱 Junior', mid: '⚡ Mid-level', senior: '🚀 Senior', staff: '🏆 Staff' }

const DIFF_COLORS = {
  easy:   'text-accent-green  bg-accent-green/10',
  medium: 'text-accent-orange bg-accent-orange/10',
  hard:   'text-red-400       bg-red-400/10',
}

export default function Setup() {
  const navigate = useNavigate()
  const {
    resumeText, resumeParsed, jobDescription, interviewType,
    questions, setQuestions,
    candidateProfile, setCandidateProfile,
    setCurrentQuestionIndex, clearAnswers,
  } = useApp()

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (questions.length === 0) generateQuestions()
  }, [])

  async function generateQuestions() {
    setIsLoading(true)
    setError(null)
    setQuestions([])
    setCandidateProfile(null)
    try {
      const response = await fetch('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText, resumeParsed, jobDescription, interviewType }),
      })
      let data
      try { data = await response.json() }
      catch { throw new Error('API did not return valid JSON. Check OPENROUTER_API_KEY in .env.local.') }
      if (!response.ok) throw new Error(data.error || 'Failed to generate questions')

      setQuestions(data.questions || [])
      const apiProfile = data.candidateProfile || {}
      setCandidateProfile({
        name: resumeParsed?.name || apiProfile.name || 'Candidate',
        level: apiProfile.level || 'mid',
        topSkills: resumeParsed?.skills?.length ? resumeParsed.skills : (apiProfile.topSkills || []),
        yearsExperience: resumeParsed?.yearsExp || apiProfile.yearsExperience || 0,
      })
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  function handleBegin() {
    setCurrentQuestionIndex(0)
    clearAnswers()
    navigate('/interview')
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg pb-32">

      {/* Top bar */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 max-w-6xl mx-auto w-full">
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white text-sm transition-colors">← Back</button>
        <span className="text-white/50 text-sm">{interviewType} · 4 questions</span>
        <button
          onClick={generateQuestions}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-xl text-xs font-medium bg-white/8 text-white/50 hover:bg-white/15 hover:text-white transition-all border border-white/10 disabled:opacity-40"
        >
          🔄 Regenerate
        </button>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <div className="w-10 h-10 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-white/60">Generating personalized questions…</p>
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="mx-4 mt-4 max-w-6xl mx-auto rounded-2xl border border-red-500/30 bg-red-500/10 p-4 space-y-3">
          <p className="text-red-400 text-sm">{error}</p>
          <button onClick={generateQuestions} className="px-4 py-2 rounded-xl bg-red-500/20 text-red-400 text-sm hover:bg-red-500/30 transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* Two-column body */}
      {!isLoading && !error && questions.length > 0 && (
        <div className="flex-1 flex flex-col lg:flex-row gap-6 px-4 pt-2 max-w-6xl mx-auto w-full">

          {/* LEFT — candidate profile */}
          <div className="lg:w-2/5 space-y-4">
            <h1 className="text-2xl font-bold">Ready to interview?</h1>

            {candidateProfile && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
                <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Candidate Profile</p>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <p className="text-white font-semibold text-lg">{candidateProfile.name}</p>
                  <span className="text-sm text-white/70">{LEVEL_LABELS[candidateProfile.level] || candidateProfile.level}</span>
                </div>
                {candidateProfile.yearsExperience > 0 && (
                  <p className="text-white/50 text-sm">{candidateProfile.yearsExperience} years experience</p>
                )}
                {candidateProfile.topSkills?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {candidateProfile.topSkills.map(s => (
                      <span key={s} className="px-2.5 py-0.5 rounded-full text-xs bg-accent-blue/15 text-accent-blue border border-accent-blue/20">{s}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            <p className="text-white/25 text-xs px-1">
              Questions are hidden until you answer them — fresh AI set every session.
            </p>
          </div>

          {/* RIGHT — question topic previews */}
          <div className="lg:w-3/5 space-y-3">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">
              What's coming — answer each live, then get graded + model answer
            </p>
            {questions.map((q, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                <span className="text-white/30 text-sm w-5 shrink-0">{i + 1}</span>
                <span className="text-white/70 text-sm font-medium flex-1">{q.topic || interviewType}</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize shrink-0 ${DIFF_COLORS[q.difficulty] || DIFF_COLORS.medium}`}>
                  {q.difficulty || 'medium'}
                </span>
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Sticky bottom CTA */}
      {!isLoading && questions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-bg/90 backdrop-blur border-t border-white/8 px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <button
              onClick={handleBegin}
              className="w-full py-4 rounded-2xl font-bold text-base bg-accent-blue text-white hover:bg-accent-blue/90 active:scale-[0.98] transition-all"
            >
              Start Interview →
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
