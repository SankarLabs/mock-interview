export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { resumeText, resumeParsed, jobDescription, interviewType, difficulty = 'medium', company = 'Any' } = req.body

  if (!interviewType) {
    return res.status(400).json({ error: 'interviewType is required' })
  }

  const COMPANY_STYLES = {
    Google:    'Google values elegant solutions, clean code, and deep scalability. Expect system design and algorithm depth.',
    Meta:      'Meta focuses on impact at scale, data-heavy systems, and execution speed. Measurable outcomes matter.',
    Amazon:    'Amazon uses Leadership Principles (Customer Obsession, Ownership, Bias for Action). Behavioral answers should follow STAR format.',
    Microsoft: 'Microsoft values growth mindset, collaboration, and practical problem-solving. Mix of coding and design.',
    Apple:     'Apple values quality, attention to detail, and user experience. Questions focus on craftsmanship and reliability.',
    Netflix:   'Netflix hires senior talent with strong judgment. Questions test context-over-process and freedom with responsibility.',
    Startup:   'Startup interviews value pragmatic thinking, full-stack awareness, and shipping quality product fast.',
  }

  const DIFFICULTY_RULES = {
    easy:   'Generate straightforward questions for a junior/entry-level candidate. Focus on core concepts, no complex edge cases.',
    medium: 'Generate moderately challenging questions for a mid-level candidate. Include depth and trade-off reasoning.',
    hard:   'Generate challenging senior-level questions. Expect deep expertise, edge cases, architectural trade-offs, and real-world complexity.',
  }

  const companySection = company && company !== 'Any'
    ? `\nCompany context: This is a ${company} interview. ${COMPANY_STYLES[company] || ''}`
    : ''

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
Difficulty: ${difficulty} — ${DIFFICULTY_RULES[difficulty] || DIFFICULTY_RULES.medium}${companySection}

Rules:
${personalizationRule}
- For "System Design": ask architecture/scalability questions referencing their tech stack
- For "Coding (DSA)": ask algorithm problems relevant to their domain
- For "Behavioral (STAR)": ask situation-based questions about their past experiences
- For "Mixed": mix all types
- All questions must match the "${difficulty}" difficulty level above

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
