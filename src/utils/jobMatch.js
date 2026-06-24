function extractYearsRequirement(text) {
  const match = (text || '').match(/(\d{1,2})\+?\s*(?:to\s*\d{1,2}\s*)?years?/i)
  return match ? Number(match[1]) : null
}

export function scoreJobMatch(resumeParsed, job) {
  const skills = resumeParsed?.skills || []
  const titles = resumeParsed?.jobTitles || []
  const haystack = `${job.title} ${job.description}`.toLowerCase()

  const matchedSkills = skills.filter(s => haystack.includes(s.toLowerCase()))
  const missingSkills = skills.filter(s => !matchedSkills.includes(s))

  const titleMatch = titles.some(t => job.title.toLowerCase().includes(t.toLowerCase()))
  const skillScore = skills.length ? matchedSkills.length / skills.length : 0.5
  const titleScore = titleMatch ? 1 : (titles.length ? 0.3 : 0.5)

  let seniorityScore = 0.5
  const yearsReq = extractYearsRequirement(job.description)
  if (yearsReq != null && resumeParsed?.yearsExp) {
    seniorityScore = resumeParsed.yearsExp >= yearsReq ? 1 : Math.max(0.2, resumeParsed.yearsExp / yearsReq)
  }

  const raw = skillScore * 0.6 + titleScore * 0.25 + seniorityScore * 0.15
  const matchPercent = Math.min(98, Math.max(8, Math.round(raw * 100)))

  return {
    matchPercent,
    matchedSkills: matchedSkills.slice(0, 8),
    missingSkills: missingSkills.slice(0, 5),
  }
}
