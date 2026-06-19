export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { resumeText, resumeParsed, jobDescription, interviewType } = req.body

  if (!interviewType) {
    return res.status(400).json({ error: 'interviewType is required' })
  }

  const apiKey = process.env.OPENROUTER_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing OPENROUTER_API_KEY — add it to .env.local and restart the dev server.' })
  }

  const hasResume = resumeText && resumeText.trim().length > 50

  const profileHint = resumeParsed
    ? `Pre-extracted candidate profile (treat as ground truth):
- Name: ${resumeParsed.name || 'Unknown'}
- Years of experience: ${resumeParsed.yearsExp || 'unknown'}
- Detected skills: ${(resumeParsed.skills || []).join(', ') || 'none detected'}
- Job titles: ${(resumeParsed.jobTitles || []).join(', ') || 'unknown'}
- Companies: ${(resumeParsed.companies || []).join(', ') || 'unknown'}`
    : ''

  const jdSection = jobDescription?.trim()
    ? `\n\nTarget Job Description (tailor every question to this role):\n${jobDescription.slice(0, 1500)}`
    : ''

  const resumeSection = hasResume
    ? `${profileHint}\n\nFull Resume Text:\n${resumeText.slice(0, 3000)}${jdSection}`
    : `No resume provided. Generate general software engineering interview questions for a mid-level engineer.${jdSection}`

  const personalizationRule = hasResume
    ? `- Use the pre-extracted profile above as ground truth for the candidate's name, level, and skills
- Reference their actual technologies in each question
- Match difficulty to their seniority level
${jobDescription ? '- Prioritize skills and responsibilities mentioned in the job description above all else' : ''}`
    : `- Use general software engineering topics for a mid-level engineer
- Set candidateProfile.name to "Candidate" and level to "mid"
${jobDescription ? '- Prioritize the skills and requirements from the job description' : ''}`

  const prompt = `You are an expert technical interviewer. Generate exactly 4 interview questions.

${resumeSection}

Interview Type: ${interviewType}

Rules:
${personalizationRule}
- For "System Design": ask architecture/scalability questions referencing their tech stack
- For "Coding (DSA)": ask algorithm problems relevant to their domain
- For "Behavioral (STAR)": ask situation-based questions about their past experiences
- For "Mixed": mix all types

Return ONLY valid JSON, no markdown, no explanation, exactly this structure:
{
  "questions": [
    {
      "question": "string",
      "rubric": ["rubric point 1", "rubric point 2", "rubric point 3", "rubric point 4", "rubric point 5"],
      "difficulty": "easy|medium|hard",
      "topic": "string"
    }
  ],
  "candidateProfile": {
    "name": "string",
    "level": "junior|mid|senior|staff",
    "topSkills": ["skill1", "skill2", "skill3"],
    "yearsExperience": 0
  }
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
        temperature: 0.7,
        max_tokens: 2000,
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

    // Strip markdown code fences if present
    const cleaned = content.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim()
    const parsed = JSON.parse(cleaned)

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('generate-questions error:', err)
    if (err instanceof SyntaxError) {
      return res.status(502).json({ error: `AI returned invalid JSON: ${err.message}` })
    }
    return res.status(500).json({ error: `Internal error: ${err.message}` })
  }
}
