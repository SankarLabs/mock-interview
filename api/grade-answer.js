export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { question, transcript, rubric, interviewType } = req.body

  if (!question || !transcript || !rubric) {
    return res.status(400).json({ error: 'question, transcript, and rubric are required' })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Server configuration error: missing API key' })
  }

  const rubricList = rubric.map((r, i) => `${i + 1}. ${r}`).join('\n')

  const prompt = `You are a senior engineering interviewer grading a candidate's spoken answer.

Interview Type: ${interviewType}

Question asked:
"${question}"

Grading rubric (5 points):
${rubricList}

Candidate's answer (speech-to-text transcript):
"${transcript}"

Grade this answer strictly but fairly. A score of 100 means all rubric points were clearly addressed. Deduct points for missing rubric items, vagueness, or incorrect statements.

Then write an ideal model answer that:
- Covers every rubric point clearly
- Uses a real-world analogy or mental model to make it memorable (e.g. "think of it like a post office sorting facility…")
- Is written in plain, conversational English as if explaining to a smart colleague
- Is 4-8 sentences long

Return ONLY valid JSON, no markdown, no explanation, exactly this structure:
{
  "score": 0,
  "grade": "A|B|C|D|F",
  "rubricHits": ["rubric points that were addressed, copy exact text from the rubric"],
  "rubricMisses": ["rubric points that were missed or inadequate, copy exact text from the rubric"],
  "feedback": "2-3 sentence coaching note",
  "strongPoints": "1 sentence about what the candidate did well",
  "improvementTip": "1 concrete tip to improve next time",
  "idealAnswer": "The full model answer with analogy here"
}`

  const MODELS = [
    'meta-llama/llama-3.3-70b-instruct:free',
    'openai/gpt-oss-20b:free',
    'qwen/qwen3-coder:free',
    'nvidia/nemotron-3-super-120b-a12b:free',
    'meta-llama/llama-3.2-3b-instruct:free',
    'nousresearch/hermes-3-llama-3.1-405b:free',
  ]

  const delay = (ms) => new Promise(r => setTimeout(r, ms))

  async function callOpenRouter(model) {
    return fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://mock-interview.vercel.app',
        'X-Title': 'MockMate Interview Coach',
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 800,
      }),
    })
  }

  try {
    let response
    let lastError = ''

    for (let i = 0; i < MODELS.length; i++) {
      if (i > 0) await delay(600)
      response = await callOpenRouter(MODELS[i])
      if (response.ok) break
      const errText = await response.text()
      let detail = errText
      try { detail = JSON.parse(errText)?.error?.message || errText } catch {}
      console.warn(`[${MODELS[i]}] ${response.status}: ${detail}`)
      lastError = `OpenRouter ${response.status}: ${detail}`
      if (response.status !== 429 && response.status !== 404) break
    }

    if (!response.ok) {
      return res.status(502).json({ error: lastError })
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content

    if (!content) {
      return res.status(502).json({ error: 'Empty response from AI. Please try again.' })
    }

    const cleaned = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    if (!parsed.grade) {
      const s = parsed.score
      parsed.grade = s >= 90 ? 'A' : s >= 80 ? 'B' : s >= 70 ? 'C' : s >= 60 ? 'D' : 'F'
    }

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('grade-answer error:', err)
    if (err instanceof SyntaxError) {
      return res.status(502).json({ error: `AI returned invalid JSON: ${err.message}` })
    }
    return res.status(500).json({ error: `Internal error: ${err.message}` })
  }
}
