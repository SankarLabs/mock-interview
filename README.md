# MockMate — AI-Powered Mock Interview Coach

A web app that gives you a real interview experience: upload your resume, paste a job description, get AI-generated personalized questions, answer them live via voice or text, and receive instant graded feedback with a model answer and analogy to help you remember.

---

## Live Demo

> Deploy your own in minutes — see [Deployment](#deployment) below.

---

## Features

- **Resume-aware questions** — Upload your PDF resume and get 4 questions tailored to your actual stack (React, AWS, PostgreSQL, etc.)
- **Job description targeting** — Paste a JD to get questions specific to that role and company
- **Live job matches** — Dedicated page pulling real, current postings (via JSearch/Google for Jobs) ranked by % match against your resume's skills, title, and experience
- **4 interview types** — System Design · Coding (DSA) · Behavioral (STAR) · Mixed
- **Voice or text answers** — Speak via Web Speech API or type your answer
- **Live transcript** — Real-time speech-to-text as you speak
- **AI grading** — Each answer is scored 0–100 with a letter grade (A–F) and rubric breakdown (✅ hit / ❌ missed)
- **Model answer with analogy** — After each answer, see exactly what a great response looks like, with a memorable real-world analogy
- **Hint system** — Stuck? Get 3 nudge hints before answering without giving the answer away
- **Text-to-speech** — 🔈 Read any question or model answer aloud in a natural male voice
- **Per-question + final summary** — Coach feedback, improvement tips, weakest area highlighted
- **Regenerate questions** — Fresh AI-generated set every session, regenerate anytime
- **Camera support** — Optional webcam feed (mirrors your face like a real interview)
- **Mobile-first** — Works on iPhone (390px) and scales to desktop two-column layout

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite 5 + Tailwind CSS 3 |
| Backend | Vercel Serverless Functions (`/api`) |
| AI | OpenRouter API — `meta-llama/llama-3.3-70b-instruct:free` (with 5 fallback models) |
| PDF Parsing | `pdfjs-dist` v4 — 100% client-side, no upload needed |
| Speech-to-Text | Web Speech API (built into Chrome/Safari) |
| Text-to-Speech | Web Speech Synthesis API (built into all browsers) |
| Deployment | Vercel free tier |

---

## Project Structure

```
mock-interview/
├── api/
│   ├── generate-questions.js   # Serverless — generates 4 personalized questions
│   ├── grade-answer.js         # Serverless — grades spoken/typed answer
│   └── get-hint.js             # Serverless — returns 3 pre-answer nudge hints
├── src/
│   ├── App.jsx                 # Root router + shared AppContext (state)
│   ├── main.jsx
│   ├── index.css               # Tailwind base + custom animations
│   ├── pages/
│   │   ├── Home.jsx            # Resume upload + JD input + interview type picker
│   │   ├── Setup.jsx           # AI question generation + candidate profile preview
│   │   ├── Interview.jsx       # Live question + camera + voice/text answer
│   │   └── Results.jsx         # Per-question results + final summary
│   ├── components/
│   │   ├── ResumeUpload.jsx    # Drag & drop PDF uploader
│   │   ├── CameraView.jsx      # Webcam feed (mirrored)
│   │   ├── TranscriptBox.jsx   # Live speech-to-text display
│   │   ├── ScoreCard.jsx       # Grade + rubric + feedback + model answer
│   │   └── QuestionCard.jsx    # Question display with difficulty/topic tags
│   ├── hooks/
│   │   ├── useCamera.js        # Camera start/stop + permission error handling
│   │   ├── useSpeech.js        # Web Speech API — continuous recognition
│   │   ├── useTimer.js         # Interview countdown timer (warns at 3 min)
│   │   └── useTTS.js           # Text-to-speech — sentence-paced, male voice
│   └── utils/
│       ├── pdfParser.js        # Extract text from PDF using pdfjs-dist
│       └── resumeParser.js     # Pull name, skills, titles, companies, years exp
├── .env.example
├── vite.config.js              # Includes apiDevPlugin for local /api/* handling
├── tailwind.config.js
├── vercel.json
└── package.json
```

---

## Getting Started Locally

### Prerequisites
- Node.js 18+
- A free [OpenRouter](https://openrouter.ai) API key

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/SankarLabs/mock-interview.git
cd mock-interview

# 2. Install dependencies
npm install

# 3. Add your OpenRouter API key
cp .env.example .env.local
# Edit .env.local and add:
# OPENROUTER_API_KEY=sk-or-xxxxxxxxxxxxxxxx

# 4. Start dev server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) — the `/api` routes work automatically via the built-in Vite dev plugin (no Vercel CLI needed).

> **Get a free OpenRouter key:** openrouter.ai → Sign up → API Keys

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENROUTER_API_KEY` | Your OpenRouter API key (`sk-or-...`) |
| `RAPIDAPI_KEY` | RapidAPI key subscribed to the [JSearch API](https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch) (free Basic plan, 200 req/mo) — powers the live Job Matches page |

Create `.env.local` locally. On Vercel, add it under **Project → Settings → Environment Variables**.

---

## Deployment

### Deploy to Vercel (recommended)

1. Push to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. Framework preset auto-detects as **Vite** ✓
4. Add environment variable: `OPENROUTER_API_KEY` → your key
5. Click **Deploy**

Vercel automatically serves the `api/` folder as serverless functions. The `vercel.json` sets a 30-second timeout for AI calls.

### Manual build

```bash
npm run build    # outputs to dist/
npm run preview  # preview the production build locally
```

---

## App Flow

```
Home → Setup → Interview → Results (×4) → Final Summary
```

1. **Home** — Upload resume (optional) + paste job description (optional) + choose interview type
2. **Setup** — AI generates 4 personalized questions; shows candidate profile with detected skills
3. **Interview** — One question at a time; answer by speaking or typing; 🔈 read question aloud; 💡 get hints; timer warns at 3 min, stops at 5 min
4. **Results** — Score, rubric ✅/❌, coach feedback, improvement tip, 💡 model answer with analogy; 🔈 read model answer aloud
5. **Final Summary** — Average grade, all scores, weakest area highlighted

---

## AI Models (Free Tier)

All three API routes (`generate-questions`, `grade-answer`, `get-hint`) try these models in order, falling back on rate limits (429) or unavailability (404):

1. `meta-llama/llama-3.3-70b-instruct:free`
2. `openai/gpt-oss-20b:free`
3. `qwen/qwen3-coder:free`
4. `nvidia/nemotron-3-super-120b-a12b:free`
5. `meta-llama/llama-3.2-3b-instruct:free`
6. `nousresearch/hermes-3-llama-3.1-405b:free`

> Free tier has rate limits. Adding $1 of credits to your OpenRouter account removes them entirely.

### How the Multi-Model Fallback Works

OpenRouter exposes all models through a single API endpoint — switching models is just changing one field (`model`) in the request body. No different SDKs or credentials needed.

**Loop logic (same in all three API files):**

```
for each model in the list:
  → Call OpenRouter with that model
  → 429 (rate limited)   → wait 600ms, try next model
  → 404 (unavailable)    → try next model immediately
  → any other HTTP error → stop, don't retry
  → empty response       → try next model
  → valid response       → use it, break out of loop
```

**Why 6 models?**
Free-tier models have per-minute rate limits and occasionally go offline. With 6 fallbacks at least one is almost always available, so users rarely see an error. The 600ms delay between retries avoids hammering the API when a model is rate-limited.

---

## Browser Support

| Feature | Chrome | Safari | Firefox | Edge |
|---------|--------|--------|---------|------|
| Speech-to-text | ✅ | ✅ | ❌ | ✅ |
| Text-to-speech | ✅ | ✅ | ✅ | ✅ |
| Camera/mic | ✅ | ✅ | ✅ | ✅ |
| PDF parsing | ✅ | ✅ | ✅ | ✅ |

> **Speech-to-text requires Chrome, Safari, or Edge.** Firefox users can switch to Type mode.

---

## Roadmap

- [ ] Session history (localStorage — last 5 sessions)
- [ ] Progress chart (scores over time)
- [ ] Follow-up questions after each answer
- [ ] Company-specific mode (Google L5, Meta E5, etc.)
- [ ] Filler word detector (um, uh, like counter)
- [ ] Export session as PDF report
- [ ] User accounts + persistent history

---

## Contributing

PRs welcome. Please open an issue first for large changes.

```bash
git checkout -b feature/your-feature
git commit -m "Add your feature"
git push origin feature/your-feature
# Open a PR on GitHub
```

---

## License

MIT
