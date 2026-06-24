import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App.jsx'
import ResumeUpload from '../components/ResumeUpload.jsx'
import { extractTextFromPDF } from '../utils/pdfParser.js'
import { parseResume } from '../utils/resumeParser.js'

const TYPE_CONFIG = {
  'System Design':    { accent: 'border-accent-blue/40   bg-accent-blue/10   hover:bg-accent-blue/20',   active: 'border-accent-blue   bg-accent-blue/20   ring-2 ring-accent-blue/50',   label: 'text-accent-blue',   icon: '🏗️' },
  'Coding (DSA)':     { accent: 'border-accent-purple/40 bg-accent-purple/10 hover:bg-accent-purple/20', active: 'border-accent-purple bg-accent-purple/20 ring-2 ring-accent-purple/50', label: 'text-accent-purple', icon: '💻' },
  'Behavioral (STAR)':{ accent: 'border-accent-green/40  bg-accent-green/10  hover:bg-accent-green/20',  active: 'border-accent-green  bg-accent-green/20  ring-2 ring-accent-green/50',  label: 'text-accent-green',  icon: '🌟' },
  'Mixed':            { accent: 'border-accent-orange/40 bg-accent-orange/10 hover:bg-accent-orange/20', active: 'border-accent-orange bg-accent-orange/20 ring-2 ring-accent-orange/50', label: 'text-accent-orange', icon: '🎯' },
}

const DIFF_CONFIG = {
  easy:   { label: 'Easy',   desc: 'Core concepts, beginner-friendly',     color: 'border-accent-green/40 bg-accent-green/10 hover:bg-accent-green/20',   active: 'border-accent-green bg-accent-green/20 ring-2 ring-accent-green/50 text-accent-green' },
  medium: { label: 'Medium', desc: 'Mid-level depth & trade-offs',          color: 'border-accent-orange/40 bg-accent-orange/10 hover:bg-accent-orange/20', active: 'border-accent-orange bg-accent-orange/20 ring-2 ring-accent-orange/50 text-accent-orange' },
  hard:   { label: 'Hard',   desc: 'Senior-level, edge cases, deep dives',  color: 'border-red-400/40 bg-red-400/10 hover:bg-red-400/20',                   active: 'border-red-400 bg-red-400/20 ring-2 ring-red-400/50 text-red-400' },
}

const COMPANY_ICONS = {
  Google: '🔍', Meta: '👥', Amazon: '📦', Microsoft: '🪟',
  Apple: '🍎', Netflix: '🎬', Startup: '🚀', Any: '🎯',
}

export default function Home() {
  const navigate = useNavigate()
  const {
    setResumeText, setResumeParsed, jobDescription, setJobDescription,
    interviewType, setInterviewType, INTERVIEW_TYPES, resumeParsed,
    difficulty, setDifficulty, DIFFICULTIES,
    company, setCompany, COMPANIES,
  } = useApp()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [resumeTab, setResumeTab] = useState('pdf')
  const [pastedText, setPastedText] = useState('')

  async function handleUpload(file) {
    setIsLoading(true)
    setError(null)
    try {
      const text = await extractTextFromPDF(file)
      setResumeText(text)
      setResumeParsed(parseResume(text))
    } catch (err) {
      console.error('PDF parse error:', err)
      setError(`PDF error: ${err?.message || err}`)
    } finally {
      setIsLoading(false)
    }
  }

  function handlePastedText() {
    const text = pastedText.trim()
    if (!text) return
    setResumeText(text)
    setResumeParsed(parseResume(text))
  }

  return (
    <div className="min-h-screen flex flex-col bg-bg">

      {/* Top bar */}
      <div className="flex items-center px-4 pt-5 pb-3 max-w-6xl mx-auto w-full">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">MockMate</h1>
          <p className="text-white/40 text-xs mt-0.5">AI-powered mock interviews</p>
        </div>
      </div>

      {/* Two-column body */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 px-4 pb-10 pt-2 max-w-6xl mx-auto w-full">

        {/* LEFT — resume upload + detected profile */}
        <div className="lg:w-1/2 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">1. Upload Resume</p>
              <span className="text-white/30 text-xs">(optional)</span>
            </div>

            {/* PDF / Paste tab toggle */}
            <div className="flex rounded-xl overflow-hidden border border-white/10 text-sm font-medium mb-3">
              <button
                onClick={() => setResumeTab('pdf')}
                className={`flex-1 py-2 transition-colors ${resumeTab === 'pdf' ? 'bg-accent-blue/20 text-accent-blue' : 'bg-white/5 text-white/40 hover:text-white/70'}`}
              >
                📄 PDF Upload
              </button>
              <button
                onClick={() => setResumeTab('paste')}
                className={`flex-1 py-2 transition-colors ${resumeTab === 'paste' ? 'bg-accent-blue/20 text-accent-blue' : 'bg-white/5 text-white/40 hover:text-white/70'}`}
              >
                🔗 LinkedIn / Text
              </button>
            </div>

            {resumeTab === 'pdf' && (
              <>
                <ResumeUpload onUpload={handleUpload} isLoading={isLoading} />
                {error && <p className="mt-2 text-red-400 text-sm">{error}</p>}
              </>
            )}

            {resumeTab === 'paste' && (
              <div className="space-y-2">
                <p className="text-white/35 text-xs leading-relaxed">
                  Open your LinkedIn profile → select all text (Ctrl+A / ⌘A) → copy → paste below.
                  Also works with any resume text.
                </p>
                <textarea
                  value={pastedText}
                  onChange={e => setPastedText(e.target.value)}
                  placeholder="Paste your LinkedIn profile or resume text here…"
                  rows={6}
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white/90 text-sm p-3 resize-none placeholder:text-white/25 focus:outline-none focus:border-accent-blue/50 transition-colors"
                />
                <button
                  onClick={handlePastedText}
                  disabled={!pastedText.trim()}
                  className="w-full py-2.5 rounded-xl bg-accent-blue text-white text-sm font-medium hover:bg-accent-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Use This Text →
                </button>
              </div>
            )}
          </div>

          {/* Detected profile */}
          {resumeParsed && (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3 animate-slide-up">
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Detected from Resume</p>

              <div className="flex items-center justify-between flex-wrap gap-2">
                {resumeParsed.name && resumeParsed.name !== 'Candidate' && (
                  <p className="text-white font-semibold text-lg">{resumeParsed.name}</p>
                )}
                {resumeParsed.yearsExp > 0 && (
                  <p className="text-white/50 text-sm">{resumeParsed.yearsExp} years exp</p>
                )}
              </div>

              {resumeParsed.jobTitles?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {resumeParsed.jobTitles.map(t => (
                    <span key={t} className="px-2.5 py-0.5 rounded-full text-xs bg-white/10 text-white/70">{t}</span>
                  ))}
                </div>
              )}

              {resumeParsed.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {resumeParsed.skills.map(s => (
                    <span key={s} className="px-2.5 py-0.5 rounded-full text-xs bg-accent-blue/15 text-accent-blue border border-accent-blue/20">{s}</span>
                  ))}
                </div>
              )}

              {/* Find matching jobs — opens dedicated page */}
              <button
                onClick={() => navigate('/jobs')}
                className="flex items-center gap-2 text-sm text-accent-green/80 hover:text-accent-green transition-colors pt-1"
              >
                🔍 Find matching job opportunities →
              </button>
            </div>
          )}

          {!resumeParsed && !isLoading && (
            <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-white/25 text-sm">
              Upload a resume to get personalized questions.<br />Or skip to get general engineering questions.
            </div>
          )}

          {/* Job Description */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">Job Description</p>
              <span className="text-white/30 text-xs">(optional)</span>
            </div>
            <textarea
              value={jobDescription}
              onChange={e => setJobDescription(e.target.value)}
              placeholder="Paste the job description here to get questions tailored to this specific role and company…"
              rows={5}
              className="w-full rounded-2xl bg-white/5 border border-white/10 text-white/90 text-sm p-4 resize-none placeholder:text-white/25 focus:outline-none focus:border-accent-blue/50 transition-colors"
            />
            {jobDescription && (
              <p className="mt-1.5 text-accent-green text-xs">✓ Questions will be tailored to this role</p>
            )}
          </div>
        </div>

        {/* RIGHT — interview type + difficulty + company + CTA */}
        <div className="lg:w-1/2 space-y-5">
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">2. Choose Interview Type</p>
            <div className="grid grid-cols-2 gap-3">
              {INTERVIEW_TYPES.map(type => {
                const cfg = TYPE_CONFIG[type]
                const isActive = interviewType === type
                return (
                  <button
                    key={type}
                    onClick={() => setInterviewType(type)}
                    className={`rounded-2xl border p-4 text-left transition-all duration-150 ${isActive ? cfg.active : cfg.accent}`}
                  >
                    <div className="text-2xl mb-1">{cfg.icon}</div>
                    <p className={`font-semibold text-sm ${isActive ? cfg.label : 'text-white/80'}`}>{type}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Difficulty */}
          <div>
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">3. Difficulty</p>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTIES.map(d => {
                const cfg = DIFF_CONFIG[d]
                const isActive = difficulty === d
                return (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`rounded-xl border p-3 text-left transition-all duration-150 ${isActive ? cfg.active : cfg.color}`}
                  >
                    <p className={`font-semibold text-sm capitalize ${isActive ? '' : 'text-white/80'}`}>{cfg.label}</p>
                    <p className="text-white/40 text-xs mt-0.5 leading-tight">{cfg.desc}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Company */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <p className="text-white/60 text-xs font-semibold uppercase tracking-wider">4. Target Company</p>
              <span className="text-white/30 text-xs">(optional)</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {COMPANIES.map(c => (
                <button
                  key={c}
                  onClick={() => setCompany(c)}
                  className={`rounded-xl border px-2 py-2.5 text-center text-xs font-medium transition-all duration-150 ${
                    company === c
                      ? 'border-accent-blue bg-accent-blue/20 text-accent-blue ring-1 ring-accent-blue/40'
                      : 'border-white/10 bg-white/5 text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="text-base mb-0.5">{COMPANY_ICONS[c]}</div>
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Summary card */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-2">
            <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">Your Session</p>
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-medium">{interviewType}</span>
              <span className="text-white/40 text-xs">4 questions · ~15 min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-sm capitalize">{difficulty} difficulty</span>
              <span className={`text-xs ${company !== 'Any' ? 'text-accent-blue' : 'text-white/30'}`}>
                {company !== 'Any' ? `${COMPANY_ICONS[company]} ${company} style` : 'any company'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-sm">
                {resumeParsed?.name && resumeParsed.name !== 'Candidate' ? resumeParsed.name : resumeParsed ? 'Resume uploaded' : 'No resume'}
              </span>
              <span className="text-white/40 text-xs">
                {resumeParsed?.skills?.length ? `${resumeParsed.skills.length} skills detected` : 'generic questions'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white/50 text-sm">
                {jobDescription ? '📋 Job description added' : 'No job description'}
              </span>
              <span className={`text-xs ${jobDescription ? 'text-accent-green' : 'text-white/30'}`}>
                {jobDescription ? 'role-targeted' : 'general'}
              </span>
            </div>
          </div>

          <button
            onClick={() => navigate('/setup')}
            disabled={isLoading}
            className="w-full py-4 rounded-2xl font-bold text-base bg-accent-blue text-white hover:bg-accent-blue/90 active:scale-[0.98] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Start Interview →
          </button>
        </div>

      </div>
    </div>
  )
}
