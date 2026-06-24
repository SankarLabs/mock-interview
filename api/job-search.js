export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { query, location } = req.body
  if (!query || !query.trim()) return res.status(400).json({ error: 'query is required' })

  const apiKey = process.env.RAPIDAPI_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing RAPIDAPI_KEY' })

  const searchText = location ? `${query} in ${location}` : query

  try {
    const url = `https://jsearch.p.rapidapi.com/search-v2?query=${encodeURIComponent(searchText)}&num_pages=3&date_posted=month`
    const response = await fetch(url, {
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com',
      },
    })

    if (!response.ok) {
      const errText = await response.text()
      let detail = errText
      try { detail = JSON.parse(errText)?.message || errText } catch {}
      return res.status(response.status === 429 ? 429 : 502).json({ error: `Job search failed: ${detail}` })
    }

    const data = await response.json()
    const raw = Array.isArray(data?.data?.jobs) ? data.data.jobs : []

    const jobs = raw.slice(0, 25).map((j, i) => ({
      id: j.job_id || `${i}-${j.job_title}`,
      title: j.job_title || 'Untitled role',
      company: j.employer_name || 'Unknown company',
      logo: j.employer_logo || null,
      location: [j.job_city, j.job_state, j.job_country].filter(Boolean).join(', ') || (j.job_is_remote ? 'Remote' : ''),
      isRemote: Boolean(j.job_is_remote),
      employmentType: j.job_employment_type || '',
      description: j.job_description || '',
      applyLink: j.job_apply_link || j.job_google_link || '',
      postedAt: j.job_posted_at_datetime_utc || '',
      salaryDisplay: j.job_salary_string || null,
      salaryMin: j.job_min_salary || null,
      salaryMax: j.job_max_salary || null,
    }))

    return res.status(200).json({ jobs, total: jobs.length })
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
