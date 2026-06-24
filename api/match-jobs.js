export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { resumeParsed, resumeText } = req.body
  if (!resumeParsed && !resumeText) return res.status(400).json({ error: 'resumeParsed or resumeText is required' })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY' })

  const skills = resumeParsed?.skills?.join(', ') || ''
  const titles = resumeParsed?.jobTitles?.join(', ') || ''
  const companies = resumeParsed?.companies?.join(', ') || ''
  const yearsExp = resumeParsed?.yearsExp || 0
  const snippet = (resumeText || '').slice(0, 1500)

  const prompt = `You are a senior technical recruiter. Based on this candidate profile, suggest the best matching job roles they should apply for right now.

Candidate profile:
- Skills: ${skills || 'not specified'}
- Job titles held: ${titles || 'not specified'}
- Companies worked at: ${companies || 'not specified'}
- Years of experience: ${yearsExp}
${snippet ? `\nResume excerpt:\n${snippet}` : ''}

Return exactly this JSON (no markdown, no explanation):
{
  "roles": ["role1", "role2", "role3", "role4", "role5"],
  "keywords": ["keyword1", "keyword2", "keyword3"],
  "level": "Junior|Mid|Senior|Staff|Principal",
  "summary": "One sentence describing this candidate's market positioning"
}`

  const MODELS = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'openai/gpt-oss-120b:free',
    'google/gemma-4-31b-it:free',
    'qwen/qwen3-coder:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'openai/gpt-oss-20b:free',
    'google/gemma-4-26b-a4b-it:free',
    'nvidia/nemotron-3-nano-30b-a3b:free',
    'meta-llama/llama-3.2-3b-instruct:free',
  ]

  const delay = (ms) => new Promise(r => setTimeout(r, ms))

  try {
    let content = null
    let lastError = ''

    for (let i = 0; i < MODELS.length; i++) {
      if (i > 0) await delay(600)
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://mock-interview.vercel.app',
          'X-Title': 'MockMate Interview Coach',
        },
        body: JSON.stringify({
          model: MODELS[i],
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.4,
          max_tokens: 400,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        let detail = errText
        try { detail = JSON.parse(errText)?.error?.message || errText } catch {}
        lastError = `OpenRouter ${response.status}: ${detail}`
        if (response.status !== 429 && response.status !== 404) break
        continue
      }

      const data = await response.json()
      const candidate = data.choices?.[0]?.message?.content?.trim()
      if (candidate) { content = candidate; break }
      lastError = 'Empty response from AI'
    }

    if (!content) return res.status(502).json({ error: lastError || 'All models returned empty responses' })

    const cleaned = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    let parsed = null
    try { parsed = JSON.parse(cleaned) } catch {}
    if (!parsed?.roles) {
      const jsonMatch = content.match(/\{[\s\S]*?\}/)
      if (jsonMatch) try { parsed = JSON.parse(jsonMatch[0]) } catch {}
    }

    if (!parsed?.roles?.length) {
      return res.status(502).json({ error: 'Could not parse job matches. Please retry.' })
    }

    return res.status(200).json(parsed)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
