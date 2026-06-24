export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  let { url } = req.body
  if (!url) return res.status(400).json({ error: 'url is required' })

  // Normalize — accept bare "linkedin.com/in/..." or full URL
  if (!url.startsWith('http')) url = 'https://' + url
  if (!url.includes('linkedin.com/in/')) {
    return res.status(400).json({ error: 'Please provide a valid LinkedIn profile URL (e.g. linkedin.com/in/yourname)' })
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
    })

    // LinkedIn returns 999 or redirects to authwall for bots
    if (response.status === 999 || response.status === 403 || response.status === 429) {
      return res.status(422).json({ blocked: true, error: 'LinkedIn blocked the request. Use the PDF export method instead.' })
    }

    if (!response.ok) {
      return res.status(422).json({ blocked: true, error: `LinkedIn returned ${response.status}. Try the PDF export method.` })
    }

    const html = await response.text()

    // Check for auth wall redirect
    if (html.includes('/authwall') || (html.includes('Sign in') && html.includes('Join now') && !html.includes('"name"'))) {
      return res.status(422).json({ blocked: true, error: 'LinkedIn requires sign-in to view this profile. Use the PDF export method instead.' })
    }

    // ── Extract JSON-LD structured data ──
    let name = '', headline = '', company = '', skills = [], summary = ''

    const jsonLdRegex = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
    let match
    while ((match = jsonLdRegex.exec(html)) !== null) {
      try {
        const data = JSON.parse(match[1])
        const nodes = Array.isArray(data['@graph']) ? data['@graph'] : [data]
        for (const node of nodes) {
          if (node['@type'] === 'Person' || node.name) {
            if (node.name) name = node.name
            if (node.jobTitle) headline = node.jobTitle
            if (node.worksFor?.name) company = node.worksFor.name
            if (node.description) summary = node.description
            if (Array.isArray(node.knowsAbout)) skills = node.knowsAbout.map(s => (typeof s === 'string' ? s : s.name)).filter(Boolean)
          }
        }
      } catch {}
    }

    // ── Fallback: Open Graph / meta tags ──
    if (!name) {
      const ogTitle = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)?.[1]
        || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:title"/i)?.[1]
        || ''
      name = ogTitle.split(' - ')[0].trim()
      headline = ogTitle.split(' - ')[1]?.trim() || ''
    }
    if (!summary) {
      summary = html.match(/<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i)?.[1]
        || html.match(/<meta[^>]+name="description"[^>]+content="([^"]+)"/i)?.[1]
        || ''
    }

    if (!name && !summary) {
      return res.status(422).json({ blocked: true, error: 'Could not extract profile data. The profile may be private. Use the PDF export method.' })
    }

    // ── Build a resume-like text blob ──
    const lines = [
      name,
      headline,
      company ? `Current company: ${company}` : '',
      summary,
      skills.length ? `Skills: ${skills.join(', ')}` : '',
    ].filter(Boolean)

    return res.status(200).json({ text: lines.join('\n'), name, headline, company, skills })
  } catch (err) {
    return res.status(500).json({ error: `Failed to fetch LinkedIn profile: ${err.message}` })
  }
}
