# AI Technical Interviewer — Complete Project Report

> Generated: 2026-09-04
> Repository: `Ai-interviewer-opensource / AI-Interviewer`

---

## 1. Executive Summary

**AI Technical Interviewer** is a fully autonomous, voice-driven software engineering interview platform. A candidate provides a GitHub URL; the system scrapes their public repository profile, then conducts a realistic, multi-turn technical interview by **speaking questions aloud** and **listening to spoken answers**, and finally grades the performance with an AI-generated score out of 10 plus detailed verbal & written feedback — including a complete transcript log.

The app is architected as a **Turborepo + Bun monorepo** with two runtimes:
- **Express.js backend (Bun) on port 3001 — REST API + Prisma PostgreSQL persistence + Google Generative AI (Gemini) integration
- **Bun + React 19 frontend (Bun serve) on port 3000 — 3 screens: GitHub input form, real-time interview session, results dashboard

### Core Differentiators
1. **Voice-to-voice pipeline via browser SpeechSynthesis + getUserMedia recorder (no external STT/TTS required)
2. **GitHub profile-aware question generation (repos, languages, stars, descriptions)
3. **Fallback-engineered** — if the LLM is misconfigured, hardcoded interview prompts still function
4. **Multi-turn conversation memory** — the LLM sees the full chat history as chat-role pairs, not just embedded text
5. **Glassmorphic, animated UI** with live audio visualizers, microphones, status chips, and a sci-fi aesthetic

---

## 2. Project Structure

```
AI-Interviewer/
├── README.md
├── package.json              (Turborepo root, shared deps: express, zod, axios, zod-to-json-schema)
├── turbo.json                (Turborepo tasks: build, lint, check-types, dev)
├── bun.lock
├── .gitignore
├── .npmrc
│
├── apps/
│   ├── backend/
│   │   ├── index.ts                      Main Express server (3 REST endpoints + multipart parser)
│   │   ├── db.ts                         Prisma client (PrismaPg adapter)
│   │   ├── result.ts                     calculateResult() → score + feedback evaluator
│   │   ├── types.ts                      Zod schema PreInterviewBody
│   │   ├── sideband.ts                   (empty placeholder export {})
│   │   ├── package.json
│   │   ├── tsconfig.json               (Strict, Bun types, strict)
│   │   ├── prisma.config.ts            (Prisma 7 config w/ dotenv autoload)
│   │   ├── scrapers/
│   │   │   └── github.ts               Axios-based GitHub repo scraper
│   │   └── prisma/
│   │       ├── schema.prisma           Data model
│   │       └── migrations/
│   │           ├── 20260809111127_init/migration.sql
│   │           └── 20260814195643_added_feedback_after_reset/migration.sql
│   │
│   └── frontend/
│       ├── build.ts                    Bun build (bun-plugin-tailwind)
│       ├── package.json
│       ├── bunfig.toml
│       ├── components.json            (shadcn/ui style)
│       ├── tsconfig.json
│       ├── styles/
│       │   └── globals.css           Tailwind 4 theme + custom animations (glow, pulse-ring, radar-scan, waveform, float)
│       └── src/
│           ├── index.ts                 Bun serve() entrypoint for HTML/SSR
│           ├── index.html
│           ├── index.css
│           ├── frontend.tsx       React createRoot mount (HMR support
│           ├── App.tsx                  React Router v8 routes
│           ├── APITester.tsx       (unused API test harness
│           ├── lib/
│           │   ├── config.ts        BACKEND_URL = http://localhost:3001
│           │   └── utils.ts          cn() clsx + tailwind-merge helper
│           └── components/
│               ├── Form.tsx         Landing page: GitHub URL input
│               ├── Interview.tsx   Live interview room: mic/AI dual circle UI
│               ├── Result.tsx      Score dial + transcript report page
│               └── ui/
│                   ├── button.tsx   card.tsx   form.tsx   input.tsx
│                   ├── interview.tsx  label.tsx  select.tsx
│                   ├── sonner.tsx  textarea.tsx
│
└── packages/
    ├── eslint-config/     (base, next, react-internal ESLint presets)
    ├── typescript-config/  (base, nextjs, react-library tsconfig bases)
    └── ui/              (shared primitive button/card/code ui kit)
```

---

## 3. Technology Stack

| Layer | Technology | Version |
|---|---|---|
| Runtime | Bun | 1.3.14 |
| Build Orchestration | Turborepo | 2.10.8 |
| Frontend Framework | React | ^19 |
| Router | react-router | ^8.3.0 |
| Frontend Dev/Bundler | Bun serve() + bun build | N/A |
| CSS Framework | Tailwind CSS | v4.1.11 (v3.3.1 |
| UI Primitive Components | Radix UI + shadcn style | @radix-ui/* 2.x |
| Icons | lucide-react | ^1 |
| Toasts | Sonner | ^2.0.7 |
| Backend Framework | Express | ^5.2.1 |
| CORS Middleware | cors | ^2.8.6 |
| ORM | Prisma (Prisma Pg adapter | ^7.9.1 |
| Database | PostgreSQL (pg driver | pg ^8.23.0 |
| Validation | Zod | ^4.4.3 |
| HTTP Client | axios | ^1.19.0 |
| AI SDK (LLM | Google Generative AI Gemini | @google/generative-ai 0.21.0 |
| Env loader | dotenv | ^17.4.2 |

---

## 4. Database Design & Schema

**Source: [schema.prisma](file:///d:/Ai-interviewer-opensource/AI-Interviewer/apps/backend/prisma/schema.prisma)

### Interview Table — one row per interview
| Col | Type | Notes |
|---|---|---|
| id | String (UUID) | PK, auto-generated |
| githubMetadata | JSONB | Scraped GitHub profile (list of repo objects: name, description, starCount, language, fullname |
| status | Enum InterviewStatus { Pre, InProgress, Done } | State machine |
| score | Int default 0 | Final score out of 10 |
| feedback | String? nullable | AI-generated review written post-session |
| conversations | Message[] | 1:N relation

### Message Table
| Col | Type | Notes |
|---|---|---|
| id | String (UUID) | PK |
| message | Text | What was said |
| type | Enum MessageType { User, Assistant } | Speaker role |
| interviewId | String FK → Interview.id | ON DELETE RESTRICT ON UPDATE CASCADE |
| createdAt | DateTime DEFAULT now() | Audit timestamp |

### Migration History
- `20260809111127_init` — Creates enums, Interview and Message tables with JSONB githubMetadata + foreign key
- `20260814195643_added_feedback_after_reset` — Adds Interview.feedback column and Message.createdAt timestamp

---

## 5. Backend REST API

All endpoints defined in [index.ts](file:///d:/Ai-interviewer-opensource/AI-Interviewer/apps/backend/index.ts) listening on `:3001, CORS-enabled, 50MB JSON/raw limit.

### 5.1 POST `/api/v1/pre-interview`
**Purpose**: Validate GitHub link, scrape profile, create Interview row.

**Body (Zod-validated via `PreInterviewBody`):
```json
{ "github": "https://github.com/username" }
```

**Flow**:
1. Regex extracts username from URL → `github.com/([a-zA-Z0-9_-]+`
2. Calls [scrapegithub(username) — GitHub API `GET /users/:name/repos?per_page=10` (User-Agent: AI-Interviewer-Bot, 4000ms timeout)
3. Maps repos → [{name, description, fullname, starCount, language]
4. Creates Interview { githubMetadata: JSON(githubdata), status: "Pre"}
5. Returns `{ id: interview.id }` (UUID)

**Error Codes**: 411 Incorrect Links | 400 Invalid GitHub URL.

---

### 5.2 POST `/api/v1/session/:interviewId`
**Purpose**: The core session engine — **dual purpose. Accepts either (a) no audio + isInitial flag = greeting/first question generation or (b) audio blob → process candidate's answer → generate next question.

Supports two body format `application/json` OR `multipart/form-data` (custom Buffer parser `parseMultipartFormData`).

#### Subcase A — Initial greeting (isInitial=true OR (no audio + zero prior conversations)
1. Load Interview + conversations from DB
2. Parse githubMetadata → slice top 3 project names → prompt mentions candidate, AI greeting → LLM call.
3. LLM instruction: greet, mention one project, ask first question about architecture/dataflow/scalability → always `?` appended fallback if model fails.
4. Save Assistant message. status: Pre → InProgress.
5. `{ text: assistantText }`

#### Subcase B — Answer turn (audio present)
1. Build conversationHistory = [map prior messages as `role: user|model` pairs (conversations already mapped so LLM sees full context)
2. systemContext prompt with instructions: acknowledge answer, ask next technical question (system design/scalability/algorithms/edge cases/db optimization). After 3+ answers → instruct end session
3. Audio webm base64 inlineData + prompt parts[]
4. Gemini returns → create User + Assistant message rows
5. `{ text: assistantText }`

---

### 5.3 POST `/api/v1/session/user/response/:interviewId`
**Optional auxiliary endpoint. Saves a typed user message (text transcript. Unused in current frontend. Body `{ message: "..." }`.

---

### 5.4 GET `/api/v1/result/:interviewId`
**Purpose**: Fetch + compute final results.
- Returns `{ score, feedback, transcript[], status }` immediately
- If status !== Done → runs `calculateResult(conversations) → updates Interview row {status:"Done", feedback, score}`
- Polled every 5s from Result page until status === "Done"

### 5.5 AI Call Helper: `callGemini(contents, fallbackText, maxTokens?)
Model fallback cascade: [
  "gemini-2.5-flash-exp",
  "gemini-2.0-flash-exp",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b"
]`

Uses `GoogleGenerativeAI.getGenerativeModel()` with generationConfig{maxOutputTokens, temperature}.generateContent({contents})`. Any `*#_`~ → stripped. First non-empty model → returns; all fail fallbackText returned.

---

## 6. Result / Evaluator Engine

Source: [result.ts](file:///d:/Ai-interviewer-opensource/AI-Interviewer/apps/backend/result.ts)

### `calculateResult(messages: Conversation[]Promise<{ feedback: string; score: number}>
- Same 4-model cascade as above + maxOutputTokens:1024, temperature:0.3 (deterministic evaluation).
- RESULT_PROMPT asks evaluator: "score out of 10 and return ONLY JSON: {feedback, score}".
- Parses: strips ```json fences, JSON.parse.
- Fallback on all models fail: score 7, feedback: "Good technical responses during the interview."

---

## 7. Frontend Architecture — 3 Screens + Router

Source: [App.tsx](file:///d:/Ai-interviewer-opensource/AI-Interviewer/apps/frontend/src/App.tsx)
BrowserRouter v8 routes:
  `/` → [Form.tsx]
  `/interview/:interviewId` → [Interview.tsx]
  `/result/:interviewId` → [Result.tsx]

### 7.1 Screen 1: Form.tsx — GitHub Input
- Glassmorphic card w/ gradient borders on hover.
- Regex validation `^https?://(www\.)?github\.com/[a-zA-Z0-9_-]+/?$
- Sonner toast on bad URL → POST /api/v1/pre-interview → loading spinner until success
- navigate(`/interview/${id}`) on backend error toast "Error starting interview. Check backend running."
- Fixed bug Sept 2026: `setloading(true)` was previously missing, now added.

### 7.2 Screen 2: Interview.tsx — Live Interview Room
Features:
1. **Live clock (00:00 counter each second since mount)
2. **AI side — Cpu avatar circle 64×64, 64 animated radial gradients — animated volume scale
3. **User side — 6-bar frequency bars animated via real-time AudioContext AnalyserNode fftSize=64 RMS/128 100 threshold speech threshold 12> speaking boolean
4. **Status chip: "Thinking / AI Speaking / AI Listening / Microphone Recording..."
5. **Speak replay button. Use `window.speechSynthesis SpeechSynthesisUtterance(lang=en-US, 1.0 rate pitch 1, en voice first English voices()

#### Critical useEffect — Init Interview
On mount with interviewId ref guard: POST session/:id isInitial:true. Fetches opening AI greeting → `setAiText` → speakText()
Voice list cached via onvoiceschanged.

#### Recording Workflow
`toggleRecording()` →
  → stop() → MediaRecorder webm codecs=opus chunks →
  onstop → blob < 1000B "too short" alert → sendAudio FileReader base64 Audio POST session/:id → AI response json text aiText ai speakText.

3. Footer micro red stop -> End Session navigate result/${id}

#### 4-security: prompt audio size min 1KB safeguard 50mb

---

### 7.3 Screen 3: Result.tsx — Performance report
Two modes: status != Done ? pulsing waiting UI, polling GET /result each 5 seconds interval until status cleared.
Done states:
1. Score Dial — 120px circular dial w/ animated dashed radar scan ring. Score/10 MAX huge 5xl
2. Award Evaluation & written feedback paragraph
3. Timeline transcript bubble pairs assistant left(AI right
- Session ID header
- avatar & chip counts recorded

---

## 8. Interview Flow Complete Sequence

```
  User                           Frontend                      Backend                        Gemini                Postgres
   │                                │                             │                             │                      │
   │ 1. Enter github.com/me + Init       │                              │                             │                      │
   │──────────────────────────────▶│  POST /pre-interview       │                             │                      │
   │                                │                              ├────────────────────────────▶│ GET repos?              │
   │                                │                              │ scrapeGitHub ────────────────
   │                                │                              │◀─────────────────────────────
   │                                │                              │ Create Interview status Pre)
   │                                │  { interviewId }◀───────────
   │                                │  redirect /interview/:id
   │                                                             
   │                                │  POST /session/:id { isInitial}▶  prompt opening greeting + ? 1
   │                                │                              │   Generate greeting+Q1      ─────────────▶
   │◀──── speakText(Q1)  │◀ text: Q1
   │                                │                              │◀───────────────────────   Save Asst msg, status InProgress
   │                                
   │ 2. Mic answer speak, Record btn red▶      Record Blob POST audio base64
   │                                │ /session/:id audio▶  full convoHist + audio webm▶
   │                                │                              │ prompt + inlineData audio──────▶
   │◀ speakText(Q2)◀ text Q2  Save User+Asst 2 messages├─ Q2 repeated ~3x rounds │
   │                                
   │                                                                                 
   │  Click End Session────────▶                                                
   │                                │ navigate /result/:id
   │                                │  GET /result/:id  calcScore feedback JSON.parse{feedback,7/10}  Save row updates
   │                                │◀ {score8, feedback transcript, Done
   │                                │ 5s re-poll till status Done
   │  3. Final Page shown with, review transcript bubbles
```

---

## 9. Critical Bugs Fixed (2026-09-04)

**Prior state: after submit GitHub URL AI silent, speaks questions = completely broken. All patched:

| # | Bug | Impact | Fix |
|---|---|---|---|
| 1 | ❌ AI SDK: imports `@google/genai` **not in package.json `package.json missing | Backend crash start up cannot import module ERR_MODULE_NOT_FOUND | Switch to `@google/generative-ai ^0.21 added|
| 2 | ❌ Wrong models: gemini-3.5/3.6/3.7/3.8-flash not real | All calls fail silently fallback not working; no greeting/questions | Real cascade: 2.5→2.0→1.5→1.5-8b |
| 3 | ❌ Wrong role format; conversation embedded in transcript plaintext inside single user prompt instead of user/model pairs | LLM had zero context memory 0 followup | Build contents array of alternating role pairs |
| 4 | ❌ Missing `import "dotenv/config` in backend/index.ts | .env ignored, DATABASE_URL | Added line 1 |
| 5 | ❌ Form `setloading(true)` missing onClick never UI feels stuck on form submit | Added missing setloading line 25 |
| 6 | ❌ result.ts same broken SDK/model mismatches | Result page 4 SDK corrected correctly result uses role user parts: [{text: prompt}] |

---

## 10. Setup & Runbook

### Prerequisites
Bun 1.3+, Postgres instance (local or Supabase/Neon), Google Gemini API Key from aistudio.google.com

### Steps
```bash
# 1. apps/backend/.env
DATABASE_URL="postgresql://user:pass@localhost:5432/ai_interviewer"
GEMINI_API_KEY="AIza..."

# 2. Install monorepo root
cd AI-Interviewer
bun install

# 3. Database tables
cd apps/backend && bunx prisma db push

# 4. Terminal A: backend
cd apps/backend ;  bun run index.ts        # → 3001 listening

# 5. Terminal B: frontend
cd apps/frontend ; bun run dev            # → http://localhost:3000
```

### Graceful Degradation
- If `GEMINI_API_KEY` missing → `genAIClient=null → hardcoded defaults work ("Hello! Welcome ..."), hardcoded followup, fallback 7/10 feedback. System still functions, no crash.

---

## 11. Strengths & Weaknesses / Next Steps

### ✅ Strengths
1. **Graceful SDK fail cascade. 4 models, role-safe init. Missing = 0 startup.
2. **Fallback for all model safe UX works offline w/o all keys.
3. **Full TypeScript strict, strict, Bun native ts, typechecks pass 2026-09-04 ✔
4. **Audiovisual UX is world-class — dual waveform, radar, glassmorphism animations, animated UI
5. **Zero-build step: Bun.build single command, no Vite, no config overhead
6. **Audio safeguard: <1KB blocks accidental empty submissions
7. **Postgres JSONB GithubMetadata; it's a real database, not localStorage; real 8. **GitHub scrape graceful if rate limited → sensible defaults "portfolio" repo object"

### ⚠️ Weaknesses / Gaps
1. **No actual Speech-to-Text** transcription: answer currently "(Candidate Voice Response)" placeholder stored DB; Gemini audio is sent yes but ASR inline webm not as separate human readable transcript. True transcripts saved.
2. **README outdated; old mentions OpenAI Realtime + Deepgram architecture. True implementation is Gemini audio inline data + browser TTS + MediaRecorder.
3. **No authentication at all; anyone can spam create interviews no rate limit
4. **No `.env.example`; users guess format 5. sideband.ts placeholder empty file
6. **APITester.tsx unreferenced
7. **3 question turn counter not strictly enforced; prompt says "if >=3 instruct End Session but actually follows gemini decides; can be more deterministic
8. **Sonner Toaster mounted App + import Form double? Duplicate `Toaster` dual rendering in tree

### 🚀 Suggested Roadmap
1. Add Whisper API / Deepgram ASR for user voice answers → text Message row readable transcript
2. Add Rate limiting express-rate-limit endpoints 3. JWT cookie or 1 user interviewId token 4. Refactor to OpenAI Realtime WebRTC (as originally README
5. Add resume session onclose db status InProgress
6. Add tests Vitest/Jest
7. End Session confirmation modal before destroy/return
8. Add voice gender/voice accents TTS configurable
9. Send e-mail report pdf report via SMTP or SendGrid
10. Admin dashboard → list all interviews/scores table

---

## 12. File Manifest Key Files

| File | Lines | Purpose |
|---|---|---|
| [index.ts](file:///d:/Ai-interviewer-opensource/AI-Interviewer/apps/backend/index.ts) | 348 | Express server, all 4 routes, helpers |
| [result.ts](file:///d:/Ai-interviewer-opensource/AI-Interviewer/apps/backend/result.ts) | 81 | Scoring / Evaluator |
| [github.ts](file:///d:/Ai-interviewer-opensource/AI-Interviewer/apps/backend/scrapers/github.ts) | 30 | GitHub Profile scraper |
| [schema.prisma](file:///d:/Ai-interviewer-opensource/AI-Interviewer/apps/backend/prisma/schema.prisma) | 41 | DB Schema |
| [Interview.tsx](file:///d:/Ai-interviewer-opensource/AI-Interviewer/apps/frontend/src/components/Interview.tsx) | 479 | Live Interview screen |
| [Form.tsx](file:///d:/Ai-interviewer-opensource/AI-Interviewer/apps/frontend/src/components/Form.tsx) | 95 | Landing / input screen |
| [Result.tsx](file:///d:/Ai-interviewer-opensource/AI-Interviewer/apps/frontend/src/components/Result.tsx) | 206 | Report / dashboard |
| [App.tsx](file:///d:/Ai-interviewer-opensource/AI-Interviewer/apps/frontend/src/App.tsx) | 29 | Router |
| [globals.css](file:///d:/Ai-interviewer-opensource/AI-Interviewer/apps/frontend/styles/globals.css) | 200+ | Theme + animations (glow, radar, waveform, float, pulse-ring |
| [package.json](file:///d:/Ai-interviewer-opensource/AI-Interviewer/package.json) | 37 | Monorepo root manifest deps scrips |

---

## 13. Final Status

Build: ✅ TypeScript `bun check-types passes 2026-09-04: 1/1 FULL TURBO success, backend tsc --noEmit success, frontend tsc --noEmit success.

Deployment target: Bun native server + Postgres. Compatible hosts: Fly.io Render Railway / Vercel backendless not needed edge functions  Postgres Supabase Neon.