export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { question, rubric, interviewType } = req.body
  if (!question || !rubric) return res.status(400).json({ error: 'question and rubric are required' })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY' })

  const rubricList = rubric.map((r, i) => `${i + 1}. ${r}`).join('\n')

  const prompt = `You are a helpful interview coach giving a candidate a nudge before they answer.

Interview type: ${interviewType}
Question: "${question}"
Grading rubric:
${rubricList}

Give exactly 3 short hints to help the candidate structure a strong answer.
Rules:
- Do NOT give the answer away or provide example code/architecture
- Each hint is 1 sentence max
- Nudge toward the rubric points without naming them directly
- Use plain language, no jargon

Return exactly 3 hints as a numbered list:
1. [hint one]
2. [hint two]
3. [hint three]`

  const MODELS = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'qwen/qwen3-coder:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'openai/gpt-oss-20b:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
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
          temperature: 0.5,
          max_tokens: 400,
        }),
      })

      if (!response.ok) {
        const errText = await response.text()
        let detail = errText
        try { detail = JSON.parse(errText)?.error?.message || errText } catch {}
        console.warn(`[${MODELS[i]}] ${response.status}: ${detail}`)
        lastError = `OpenRouter ${response.status}: ${detail}`
        if (response.status !== 429 && response.status !== 404) break
        continue
      }

      const data = await response.json()
      const candidate = data.choices?.[0]?.message?.content?.trim()
      if (candidate) { content = candidate; break }
      console.warn(`[${MODELS[i]}] returned empty content, trying next model`)
      lastError = 'Empty response from AI'
    }

    if (!content) return res.status(502).json({ error: lastError || 'All models returned empty responses' })

    // Try JSON first (strip markdown fences)
    let parsed = null
    const fenceStripped = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    try { parsed = JSON.parse(fenceStripped) } catch {}
    if (!parsed?.hints?.length) {
      const jsonMatch = content.match(/\{[\s\S]*?\}/)
      if (jsonMatch) try { parsed = JSON.parse(jsonMatch[0]) } catch {}
    }

    // Fall back: extract numbered/bulleted lines, skip intro/filler lines
    if (!parsed?.hints?.length) {
      const introPattern = /^(here are|below are|sure|of course|certainly|i'll|these hints|hint)/i
      const lines = content
        .split('\n')
        .map(l => l.replace(/^[\s\-\*\•\d\.\)\:]+/, '').trim())
        .filter(l => l.length >= 8 && !introPattern.test(l))
      if (lines.length >= 1) {
        parsed = { hints: lines.slice(0, 3) }
      }
    }

    // Last resort: treat entire response as one hint split by punctuation
    if (!parsed?.hints?.length) {
      const chunks = content
        .split(/[.\n]/)
        .map(s => s.trim())
        .filter(s => s.length >= 8)
        .slice(0, 3)
      if (chunks.length) parsed = { hints: chunks }
    }

    if (!parsed?.hints?.length) {
      console.error('Could not parse hints from:', content)
      return res.status(502).json({ error: 'AI returned unreadable response. Please retry.' })
    }

    return res.status(200).json(parsed)
  } catch (err) {
    if (err instanceof SyntaxError) return res.status(502).json({ error: 'AI returned invalid JSON' })
    return res.status(500).json({ error: err.message })
  }
}
