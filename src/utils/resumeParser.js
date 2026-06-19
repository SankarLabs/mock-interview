const TECH_KEYWORDS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'Go', 'Golang', 'Rust', 'C++', 'C#', 'Ruby',
  'React', 'Vue', 'Angular', 'Next.js', 'Nuxt', 'Svelte', 'Node.js', 'Express', 'FastAPI',
  'Django', 'Flask', 'Spring', 'Rails', 'Laravel',
  'PostgreSQL', 'Postgres', 'MySQL', 'MongoDB', 'Redis', 'Elasticsearch', 'DynamoDB', 'SQLite',
  'AWS', 'GCP', 'Azure', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Jenkins', 'GitHub Actions',
  'GraphQL', 'REST', 'gRPC', 'Kafka', 'RabbitMQ', 'Celery',
  'TensorFlow', 'PyTorch', 'scikit-learn', 'pandas', 'NumPy',
  'Git', 'Linux', 'Bash', 'Shell',
  'HTML', 'CSS', 'SASS', 'Tailwind', 'Webpack', 'Vite',
]

const JOB_TITLE_KEYWORDS = [
  'Software Engineer', 'Software Developer', 'Frontend Engineer', 'Backend Engineer',
  'Full Stack Engineer', 'Full-Stack Engineer', 'Senior Engineer', 'Staff Engineer',
  'Principal Engineer', 'Engineering Manager', 'Tech Lead', 'Lead Engineer',
  'Data Engineer', 'Data Scientist', 'ML Engineer', 'DevOps Engineer', 'SRE',
  'Platform Engineer', 'Infrastructure Engineer', 'Mobile Engineer', 'iOS Engineer',
  'Android Engineer', 'Web Developer', 'Intern', 'Associate Engineer',
]

function extractName(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean)
  const nameMatch = text.match(/(?:Name\s*[:\-]\s*)([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i)
  if (nameMatch) return nameMatch[1].trim()
  // First non-email, non-URL line that looks like a name
  for (const line of lines.slice(0, 5)) {
    if (/^[A-Z][a-z]+(\s+[A-Z][a-z]+){1,3}$/.test(line)) return line
  }
  return 'Candidate'
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractSkills(text) {
  const found = new Set()
  for (const kw of TECH_KEYWORDS) {
    const regex = new RegExp(`(?<![\\w])${escapeRegex(kw)}(?![\\w])`, 'i')
    if (regex.test(text)) found.add(kw)
  }
  // Also look for skills section
  const skillsMatch = text.match(/(?:skills|technologies|tech stack)[^\n]*\n([^\n]+(?:\n[^\n]+){0,5})/i)
  if (skillsMatch) {
    const raw = skillsMatch[1].replace(/[•·▪◦]/g, ',').split(/[,|\/\n]/)
    raw.forEach(s => {
      const trimmed = s.trim()
      if (trimmed.length > 1 && trimmed.length < 30) found.add(trimmed)
    })
  }
  return [...found].slice(0, 15)
}

function extractJobTitles(text) {
  const found = []
  for (const title of JOB_TITLE_KEYWORDS) {
    if (new RegExp(title, 'i').test(text)) found.push(title)
  }
  return [...new Set(found)].slice(0, 4)
}

function extractCompanies(text) {
  const companies = []
  const lines = text.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    if (JOB_TITLE_KEYWORDS.some(t => new RegExp(t, 'i').test(line))) {
      // Look at surrounding lines for company name
      const nearby = [lines[i - 1], lines[i + 1]].filter(Boolean).map(l => l.trim())
      for (const nearby_line of nearby) {
        if (
          nearby_line.length > 2 &&
          nearby_line.length < 60 &&
          !/http|@|skills|experience/i.test(nearby_line) &&
          /^[A-Z]/.test(nearby_line)
        ) {
          companies.push(nearby_line)
        }
      }
    }
  }
  return [...new Set(companies)].slice(0, 4)
}

function extractYearsExperience(text) {
  const yearMatches = text.match(/\b(19|20)\d{2}\b/g)
  if (!yearMatches || yearMatches.length < 2) return 0
  const years = yearMatches.map(Number).sort((a, b) => a - b)
  const earliest = years[0]
  const latest = Math.min(years[years.length - 1], new Date().getFullYear())
  return Math.max(0, latest - earliest)
}

export function parseResume(text) {
  return {
    name: extractName(text),
    skills: extractSkills(text),
    jobTitles: extractJobTitles(text),
    companies: extractCompanies(text),
    yearsExp: extractYearsExperience(text),
  }
}
