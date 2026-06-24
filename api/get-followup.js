export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { question, rubricMisses, transcript, interviewType } = req.body
  if (!question || !rubricMisses?.length) return res.status(400).json({ error: 'question and rubricMisses are required' })

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY' })

  const missedList = rubricMisses.map((r, i) => `${i + 1}. ${r}`).join('\n')
  const snippet = (transcript || '').slice(0, 600)

  const prompt = `You are a technical interviewer. The candidate just answered a question but missed some key points.

Interview type: ${interviewType}
Original question: "${question}"
What the candidate missed:
${missedList}
Candidate's answer (excerpt): "${snippet}"

Ask ONE focused follow-up question that naturally probes their understanding of the weakest gap.
Rules:
- Sound like a real interviewer continuing the conversation, not a teacher correcting them
- Do NOT reveal what they missed directly
- 1–2 sentences max
- Make it feel like a natural "tell me more about..." or "how would you handle..." probe

Return exactly this JSON:
{"followUpQuestion": "...", "whyAsked": "...one short sentence on what this probes..."}`

  const MODELS = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'openai/gpt-oss-120b:free',
    'google/gemma-4-31b-it:free',
    'qwen/qwen3-coder:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'openai/gpt-oss-20b:free',
    'google/gemma-4-26b-a4b-it:free',
    'qwen/qwen3-next-80b-a3b-instruct:free',
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
          temperature: 0.6,
          max_tokens: 300,
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
      lastError = 'Empty response from AI'
    }

    if (!content) return res.status(502).json({ error: lastError || 'All models returned empty responses' })

    const fenceStripped = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    let parsed = null
    try { parsed = JSON.parse(fenceStripped) } catch {}
    if (!parsed?.followUpQuestion) {
      const jsonMatch = content.match(/\{[\s\S]*?\}/)
      if (jsonMatch) try { parsed = JSON.parse(jsonMatch[0]) } catch {}
    }
    if (!parsed?.followUpQuestion) {
      const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 10)
      if (lines.length) parsed = { followUpQuestion: lines[0], whyAsked: lines[1] || '' }
    }

    if (!parsed?.followUpQuestion) {
      return res.status(502).json({ error: 'AI returned unreadable response. Please retry.' })
    }

    return res.status(200).json(parsed)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
