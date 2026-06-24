import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../App.jsx'
import { scoreJobMatch } from '../utils/jobMatch.js'

function matchColor(pct) {
  if (pct >= 70) return { text: 'text-accent-green', bar: 'bg-accent-green', ring: 'border-accent-green/30 bg-accent-green/5' }
  if (pct >= 40) return { text: 'text-accent-orange', bar: 'bg-accent-orange', ring: 'border-accent-orange/30 bg-accent-orange/5' }
  return { text: 'text-red-400', bar: 'bg-red-400', ring: 'border-red-400/30 bg-red-400/5' }
}

function timeAgo(iso) {
  if (!iso) return ''
  const diffMs = Date.now() - new Date(iso).getTime()
  const days = Math.floor(diffMs / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  return `${Math.floor(days / 30)} mo ago`
}

export default function JobMatches() {
  const navigate = useNavigate()
  const { resumeParsed } = useApp()

  const [query, setQuery] = useState('')
  const [location, setLocation] = useState('')
  const [keywords, setKeywords] = useState([])
  const [suggestSummary, setSuggestSummary] = useState('')
  const [jobs, setJobs] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasSearched, setHasSearched] = useState(false)
  const autoRanRef = useRef(false)

  function fallbackQuery() {
    if (resumeParsed?.jobTitles?.[0]) return resumeParsed.jobTitles[0]
    if (resumeParsed?.skills?.length) return `${resumeParsed.skills.slice(0, 2).join(' ')} Engineer`
    return ''
  }

  // On first load with a resume already on file, fire the real job search immediately
  // using the locally-parsed skills/title — no waiting on an AI call for this.
  useEffect(() => {
    if (!resumeParsed || autoRanRef.current) return
    autoRanRef.current = true
    const initialQuery = fallbackQuery()
    if (initialQuery) {
      setQuery(initialQuery)
      runSearch(initialQuery)
    }

    // Nicer AI-suggested role + keyword chips load in parallel — purely additive,
    // never blocks or delays the search above (OpenRouter free models can be slow/rate-limited).
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/match-jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeParsed }),
        })
        const data = await res.json()
        if (cancelled || !res.ok) return
        setKeywords(data.keywords || [])
        setSuggestSummary(data.summary || '')
      } catch {
        // Silent — keyword chips are a nice-to-have, not required for the search itself
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumeParsed])

  async function runSearch(q = query) {
    if (!q.trim()) return
    setLoading(true)
    setError(null)
    setHasSearched(true)
    try {
      const res = await fetch('/api/job-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, location }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Search failed')
      setJobs(data.jobs || [])
    } catch (err) {
      setError(err.message)
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  const ranked = useMemo(() => {
    if (!jobs) return []
    return jobs
      .map(job => ({ job, match: scoreJobMatch(resumeParsed, job) }))
      .sort((a, b) => b.match.matchPercent - a.match.matchPercent)
  }, [jobs, resumeParsed])

  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <div className="px-4 pt-5 pb-3 max-w-4xl mx-auto w-full">
        <button onClick={() => navigate('/')} className="text-white/40 hover:text-white/70 text-sm transition-colors mb-3">
          ← Back
        </button>
        <h1 className="text-2xl font-extrabold tracking-tight">Job Matches</h1>
        <p className="text-white/40 text-xs mt-0.5">
          {resumeParsed ? 'Real listings ranked against your resume' : 'Upload a resume on Home for personalized ranking'}
        </p>
      </div>

      <div className="flex-1 px-4 pb-10 max-w-4xl mx-auto w-full space-y-5">
        {/* Search controls */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          {suggestSummary && <p className="text-white/50 text-xs">{suggestSummary}</p>}
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runSearch()}
              placeholder="Role or title (e.g. Senior Backend Engineer)"
              className="flex-1 rounded-xl bg-white/5 border border-white/10 text-white/90 text-sm px-3 py-2.5 placeholder:text-white/25 focus:outline-none focus:border-accent-blue/50 transition-colors"
            />
            <input
              value={location}
              onChange={e => setLocation(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && runSearch()}
              placeholder="Location (optional, e.g. Remote)"
              className="sm:w-48 rounded-xl bg-white/5 border border-white/10 text-white/90 text-sm px-3 py-2.5 placeholder:text-white/25 focus:outline-none focus:border-accent-blue/50 transition-colors"
            />
            <button
              onClick={() => runSearch()}
              disabled={loading || !query.trim()}
              className="px-5 py-2.5 rounded-xl bg-accent-blue text-white text-sm font-semibold hover:bg-accent-blue/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {loading ? 'Searching…' : '🔍 Search'}
            </button>
          </div>

          {keywords.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {keywords.map((kw, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(kw); runSearch(kw) }}
                  className="px-2.5 py-0.5 rounded-full text-xs border border-white/15 text-white/50 hover:border-accent-blue/50 hover:text-accent-blue transition-colors"
                >
                  {kw}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="rounded-xl border border-red-400/30 bg-red-400/5 p-4 text-red-400 text-sm">{error}</div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 text-white/40 text-sm py-10">
            <span className="w-4 h-4 border-2 border-accent-blue border-t-transparent rounded-full animate-spin" />
            Searching live job postings…
          </div>
        )}

        {!loading && hasSearched && ranked.length === 0 && !error && (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/30 text-sm">
            No listings found. Try a broader title or different location.
          </div>
        )}

        {!loading && !hasSearched && (
          <div className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-white/30 text-sm">
            Enter a role and hit Search to pull live listings and see your match score for each.
          </div>
        )}

        {/* Results */}
        {ranked.length > 0 && (
          <div className="space-y-3">
            <p className="text-white/40 text-xs">{ranked.length} results, ranked by match to your resume</p>
            {ranked.map(({ job, match }) => {
              const colors = matchColor(match.matchPercent)
              return (
                <div key={job.id} className={`rounded-2xl border p-4 space-y-3 animate-slide-up ${colors.ring}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {job.logo
                        ? <img src={job.logo} alt="" className="w-10 h-10 rounded-lg object-contain bg-white/10 shrink-0" />
                        : <div className="w-10 h-10 rounded-lg bg-white/10 shrink-0 flex items-center justify-center text-white/30 text-xs">🏢</div>}
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{job.title}</p>
                        <p className="text-white/50 text-xs mt-0.5">
                          {job.company}{job.location ? ` · ${job.location}` : ''}{job.isRemote ? ' · Remote' : ''}
                        </p>
                        <div className="flex items-center gap-2 mt-1 text-white/30 text-xs">
                          {job.employmentType && <span>{job.employmentType.replace(/_/g, ' ')}</span>}
                          {job.postedAt && <span>· {timeAgo(job.postedAt)}</span>}
                          {job.salaryDisplay && <span>· {job.salaryDisplay}</span>}
                          {!job.salaryDisplay && job.salaryMin && (
                            <span>· ${Math.round(job.salaryMin / 1000)}k–${Math.round(job.salaryMax / 1000)}k</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className={`text-2xl font-extrabold leading-none ${colors.text}`}>{match.matchPercent}%</div>
                      <div className="text-white/30 text-[10px] uppercase tracking-wider mt-0.5">match</div>
                    </div>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div className={`h-full ${colors.bar}`} style={{ width: `${match.matchPercent}%` }} />
                  </div>

                  {(match.matchedSkills.length > 0 || match.missingSkills.length > 0) && (
                    <div className="flex flex-wrap gap-1.5">
                      {match.matchedSkills.map(s => (
                        <span key={`hit-${s}`} className="px-2 py-0.5 rounded-full text-[11px] bg-accent-green/15 text-accent-green border border-accent-green/20">✅ {s}</span>
                      ))}
                      {match.missingSkills.map(s => (
                        <span key={`miss-${s}`} className="px-2 py-0.5 rounded-full text-[11px] bg-white/5 text-white/35 border border-white/10">missing {s}</span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end pt-1">
                    <a
                      href={job.applyLink || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-1.5 rounded-lg bg-accent-blue/90 hover:bg-accent-blue text-white text-xs font-semibold transition-colors"
                    >
                      Apply →
                    </a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
