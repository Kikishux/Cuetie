# CLAUDE.md — Cuetie Project Context

## Project Overview

Cuetie is an AI-powered dating communication coach for autistic adults. Users practice conversations with AI partners in realistic dating scenarios, receive real-time coaching feedback, and track skill growth over time. The app emphasizes actionable, evidence-based coaching — not cheerleading.

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Framework | Next.js (App Router) | 16.1.6 |
| UI | React | 19.2.3 |
| Language | TypeScript (strict) | ^5 |
| Styling | Tailwind CSS | ^4 |
| Animation | Framer Motion | ^12.35.1 |
| Database & Auth | Supabase (PostgreSQL + Auth) | ^2.98.0 |
| AI Engine | OpenAI (GPT-4o, Whisper, TTS) | ^6.27.0 |
| Emotion Analysis | Hume AI (prosody) | ^0.15.15 |
| Validation | Zod | ^4.3.6 |
| Icons | Lucide React | ^0.577.0 |
| Charts | Recharts | ^3.8.0 |
| Testing | Vitest | ^4.0.18 |

## Commands

```bash
npm run dev          # Start dev server (localhost:3000)
npm run build        # Production build
npm test             # Run tests (vitest)
npm run test:watch   # Watch mode
npm run lint         # ESLint
```

## Project Structure

```
app/
├── (auth)/                    # Auth layout group (no nav bar)
│   ├── login/                 # Email + password login
│   └── onboarding/            # 4-step onboarding wizard
├── (main)/                    # Main layout group (with nav bar)
│   ├── dashboard/             # Home — skills overview, streak, recent sessions
│   ├── practice/              # Scenario grid + recommended
│   │   └── [sessionId]/       # Active chat session
│   │       ├── score/         # Scorecard after session ends
│   │       └── review/        # Conversation replay
│   ├── progress/              # Analytics & skill trends
│   ├── settings/              # User preferences, sensory settings
│   ├── coach/                 # Decode — analyze real conversations
│   └── debrief/               # Post-date debrief with AI
├── api/
│   ├── chat/send/             # SSE streaming chat + coaching
│   ├── sessions/start/        # Create session (text or voice)
│   ├── sessions/[id]/end/     # End session → generate scorecard
│   ├── scenarios/             # List, generate, recommend
│   ├── voice/transcribe/      # Whisper STT
│   ├── voice/synthesize/      # OpenAI TTS
│   ├── voice/analyze-emotion/ # Hume AI (premium-gated)
│   ├── coach/analyze/         # Decode real conversations
│   ├── coach/debrief/         # Post-date analysis
│   └── users/                 # Onboarding, delete account

components/
├── ui/           # Shadcn UI primitives (button, card, dialog, etc.)
├── chat/         # Session components (ConversationPanel, MessageBubble,
│                 #   CoachingPanel, SessionScorecard, ScenarioCard)
├── dashboard/    # Dashboard widgets (WelcomeCard, StreakTracker, SkillRadar)
├── onboarding/   # OnboardingWizard
└── shared/       # Header, AuthProvider, SensoryProvider

lib/
├── ai/           # AI modules
│   ├── config.ts              # Model configs (GPT-4o, Whisper, TTS)
│   ├── prompt-builder.ts      # Dynamic prompt construction
│   ├── response-parser.ts     # Zod-validated AI response parsing
│   ├── scorecard-generator.ts # Session evaluation + recommendations
│   ├── voice-coaching.ts      # Filler words, pacing, response time
│   ├── hume-config.ts         # Hume AI client
│   └── name-pools.ts          # Partner name generation
├── hooks/        # React hooks
│   ├── useChat.ts             # Chat state + message orchestration
│   ├── useVoiceRecorder.ts    # MediaRecorder voice capture
│   ├── useAudioAnalyzer.ts    # Web Audio API pitch/energy extraction
│   ├── useAudioPlayer.ts      # TTS audio playback
│   └── useProgress.ts         # Progress data fetching
├── supabase/     # Database clients
│   ├── client.ts              # Browser client (anon key)
│   ├── server.ts              # Server client (SSR, cookies)
│   └── admin.ts               # Service-role client (bypasses RLS)
├── types/        # TypeScript type definitions
│   ├── database.ts            # All DB types + FineTuneRecommendation + SKILL_LABELS
│   ├── ai.ts                  # AIResponse type
│   ├── api.ts                 # Request/response types
│   ├── coach.ts               # Coaching data types
│   └── hume.ts                # Hume API response types
├── subscription.ts            # Premium gating logic (canUseHume, isPremium)
└── utils.ts                   # cn() helper for Tailwind class merging

supabase/
├── migrations/   # Run in order (001 → 007) via SQL Editor
│   ├── 001_initial_schema.sql
│   ├── 002_subscription_tier.sql
│   ├── 003_expanded_scenarios.sql
│   ├── 004_persona_dimensions.sql
│   ├── 005_session_round_type.sql
│   ├── 006_dating_app_scenarios.sql
│   └── 007_finetune_sessions.sql
└── seed.sql      # 10 scenarios + 8 skill definitions
```

## Environment Variables

```bash
NEXT_PUBLIC_SUPABASE_URL=       # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=  # Supabase anon/public key
SUPABASE_SERVICE_ROLE_KEY=      # Supabase service role (server-only, bypasses RLS)
OPENAI_API_KEY=                 # OpenAI API key (GPT-4o, Whisper, TTS)
HUME_API_KEY=                   # Hume AI key (optional — emotion analysis)
NEXT_PUBLIC_POSTHOG_KEY=        # PostHog analytics (optional)
NEXT_PUBLIC_POSTHOG_HOST=       # PostHog host (optional)
```

## Key Architecture Patterns

### Chat Flow (per turn)
1. User sends message → `POST /api/chat/send` (SSE stream)
2. AI generates JSON: `{ micro_cue, partner_response, coaching }` — in that order
3. `micro_cue` is generated FIRST to prevent leaking upcoming partner response content
4. Coaching data (cue_decoded, suggestion, tone_analysis) stored on partner message
5. Micro-cue rendered under the USER's message via ConversationPanel index lookup

### Scorecard Flow (session end)
1. `POST /api/sessions/{id}/end` → calls `generateScorecard()`
2. AI scores 8 skills with evidence, suggests 2-3 next scenarios
3. Suggestions include `why` (citing user behavior) and `practice_goal`
4. Matched suggestions → start existing scenario; unmatched → generate dynamic micro-scenario

### Voice Mode Flow
1. Record → useVoiceRecorder (MediaRecorder)
2. Parallel: Whisper transcription + Hume emotion analysis + audio feature extraction
3. Text sent through normal chat pipeline with audioFeatures context
4. Partner response synthesized via TTS, auto-played if enabled

### Premium Gating
- **Free**: All features except Hume emotion analysis (3 free previews per session)
- **Premium**: Unlimited Hume analyses
- Enforcement: `lib/subscription.ts` → checked in `/api/voice/analyze-emotion`

## Known Gotchas

### Supabase RLS
- `scenarios` table: **SELECT only** for authenticated users. No INSERT/UPDATE/DELETE.
- Generated scenarios must be inserted via `lib/supabase/admin.ts` (service-role client).
- Sessions and messages tables allow user INSERT via RLS policies.

### AI Output Schema Ordering
- `micro_cue` MUST be the first field in the JSON output schema (before `partner_response`).
- LLMs generate tokens sequentially — if micro_cue comes after partner_response, it leaks upcoming content into coaching hints.
- This was a hard-won lesson. Do not reorder.

### Scorecard Recommendations
- `FineTuneRecommendation` includes `why` and `practice_goal` fields — the AI must cite specific user behavior.
- Prompt explicitly forbids generic titles like "Building rapport" — must be specific actionable tasks.
- `matched_scenario_id` matching is ID-only (no fuzzy title matching — caused false positives).

### Next.js 16 Warnings
- `middleware.ts` triggers a deprecation warning ("use proxy instead") — safe to ignore for now.
- Multiple lockfile warning — suppress with `turbopack.root` if needed.
- Dev server lock file at `.next/dev/lock` can get stale — delete it if server won't start.

### Voice Mode
- Session mode (text/voice) is set at creation, not toggleable mid-session (limits differ by mode).
- Voice mode has 20-25% fewer turns than text mode.
- Hume API fails silently (returns null) — graceful degradation, not a crash.
- `HUME_API_KEY` is optional — app works without it, just no emotion analysis.

### Scoring Calibration
- Scoring rubric is strict: single-word responses → all skills 0-2, zero questions → question_quality 0-1.
- `examples` field in scorecard is REQUIRED — AI must quote user's actual words as evidence.
- Real-time skill scores were removed from coaching sidebar (were inflated vs scorecard).

### Test User
- Email: `demo.alex@cuetie.test` / Password: `CuetieDemo2026!`
- Must be created manually in Supabase Auth dashboard with "Auto Confirm" enabled.

## Code Style

- TypeScript strict mode — no `any` except where interfacing with untyped Supabase admin client
- Tailwind CSS v4 for all styling — no CSS modules
- Shadcn UI components in `components/ui/` — do not modify directly
- Framer Motion for animations — use `SafeMotion` wrapper for reduced-motion support
- Zod v4 for all API input validation
- Path alias: `@/` maps to project root
- Comments only where code needs clarification — not for obvious code
