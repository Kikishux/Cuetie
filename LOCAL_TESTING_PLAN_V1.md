# Cuetie — Local Testing Plan V1

> **Version**: 1.0 | **Date**: 2026-03-09
> **Goal**: Get Cuetie running locally end-to-end and validate all features

---

## Quick Reference: What Works Without Credentials?

| Page | No Credentials | Supabase Only | Supabase + OpenAI |
|------|:-:|:-:|:-:|
| Landing (`/`) | ✅ | ✅ | ✅ |
| Login (`/login`) | ⚠️ UI only | ✅ | ✅ |
| Onboarding (`/onboarding`) | ❌ Blocked | ✅ | ✅ |
| Dashboard (`/dashboard`) | ❌ Blocked | ✅ | ✅ |
| Practice Scenarios (`/practice`) | ❌ Blocked | ✅ | ✅ |
| Chat (`/practice/[id]`) | ❌ Blocked | ⚠️ No AI | ✅ |
| Scorecard (`/practice/[id]/score`) | ❌ Blocked | ⚠️ No AI | ✅ |
| Progress (`/progress`) | ❌ Blocked | ✅ | ✅ |
| Settings (`/settings`) | ❌ Blocked | ✅ | ✅ |

---

## Phase 0: Prerequisites (5 min)

### ✅ Already Done
- [x] Node.js v22+ installed
- [x] Dependencies installed (`npm install`)
- [x] Dev server runs (`npm run dev` → http://localhost:3000)
- [x] Landing page renders

### Accounts You Need

| Service | Free Tier? | Sign Up | What For |
|---------|:-:|---------|----------|
| **Supabase** | ✅ Free | https://supabase.com | Database + auth |
| **OpenAI** | ❌ Pay-as-you-go | https://platform.openai.com | AI coaching (~$0.02/chat) |

---

## Phase 1: Set Up Supabase (10 min)

### Step 1.1 — Create Supabase Project

1. Go to https://supabase.com → Sign up / Sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `cuetie`
   - **Database Password**: pick a strong one, save it
   - **Region**: closest to you (e.g., East US)
4. Click **"Create new project"** — wait ~2 min

### Step 1.2 — Get Your API Keys

1. Dashboard → **Settings** → **API** (left sidebar)
2. Copy these 3 values:

| Value | Location on Page |
|-------|-----------------|
| **Project URL** | Under "Project URL" |
| **anon public key** | "Project API keys" → anon / public |
| **service_role secret key** | "Project API keys" → service_role / secret |

### Step 1.3 — Run Database Migration

1. Dashboard → **SQL Editor** → **New Query**
2. Open `supabase/migrations/001_initial_schema.sql` from this project
3. Copy entire file → paste in SQL Editor → click **Run**
4. Expected: "Success. No rows returned"

### Step 1.4 — Seed Practice Scenarios

1. SQL Editor → **New Query**
2. Open `supabase/seed.sql` from this project
3. Copy entire file → paste → **Run**
4. Expected: "Success. 10 rows affected"

### Step 1.5 — Verify Tables

1. Go to **Table Editor** (left sidebar)
2. Confirm these tables exist:
   - `users` (0 rows)
   - `scenarios` (10 rows) ← click to verify data
   - `sessions` (0 rows)
   - `messages` (0 rows)
   - `skill_defs` (8 rows) ← empathy, question_quality, etc.
   - `skill_scores` (0 rows)

---

## Phase 2: Set Up OpenAI (5 min)

### Step 2.1 — Get API Key

1. Go to https://platform.openai.com → Sign in
2. Click profile → **API Keys** → **Create new secret key**
3. Name: `cuetie-local` → Copy immediately (can't view again)

### Step 2.2 — Add Budget Limit

1. **Settings** → **Billing** → Add payment method
2. **Settings** → **Limits** → Set monthly limit: **$10** (plenty for testing)

---

## Phase 3: Configure & Restart (2 min)

### Step 3.1 — Update `.env.local`

Open `Cuetie/.env.local` and replace ALL placeholder values:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...YOUR-REAL-ANON-KEY
SUPABASE_SERVICE_ROLE_KEY=eyJ...YOUR-REAL-SERVICE-ROLE-KEY
OPENAI_API_KEY=sk-proj-YOUR-REAL-KEY
```

### Step 3.2 — Restart Dev Server

```bash
# Stop current server (Ctrl+C)
# Then restart:
npm run dev
```

Confirm: `✓ Ready` with no new errors.

---

## Phase 4: Test Script — Full Demo Walkthrough

### Test 1: Landing Page ✅ (Already Working)

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Navigate to http://localhost:3000 | Landing page with hero, features, how-it-works, testimonials, footer |
| 2 | Scroll down | Sections fade in with smooth animations |
| 3 | Click "See How It Works" | Smooth-scrolls to How It Works section |
| 4 | Verify footer | Shows "© 2026 Cuetie" |

### Test 2: Sign Up (New Account)

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Click **"Get Started"** | Navigates to `/login` |
| 2 | Click **"Don't have an account? Sign up"** | Form switches to sign-up mode ("Create your account") |
| 3 | Enter email: `testuser@example.com` | Field fills |
| 4 | Enter password: `TestPass123!` | Field fills |
| 5 | Click **"Sign Up"** | **IF email confirmation enabled:** Shows "Check your email for a confirmation link" |
| | | **IF email confirmation disabled:** Redirects to `/onboarding` |

> ⚠️ **To disable email confirmation** (recommended for local testing):
> Supabase Dashboard → **Authentication** → **Email Templates** → **Settings** → Toggle OFF "Enable email confirmations"

### Test 3: Onboarding Wizard

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | After sign-up, lands on `/onboarding` | Shows OnboardingWizard step 1 |
| 2 | **Step 1**: Enter display name (e.g., "Alex") | Name input visible, Next button active |
| 3 | Click **Next** | Slides to Step 2 with animation |
| 4 | **Step 2**: Select challenges (e.g., "Reading sarcasm", "Making small talk") | Toggle chips highlight on click |
| 5 | Click **Next** | Slides to Step 3 |
| 6 | **Step 3**: Select goals (e.g., "First dates", "Texting") | Toggle chips highlight |
| 7 | Click **Next** | Slides to Step 4 |
| 8 | **Step 4**: Choose coaching style ("Gentle") | Radio-style selection highlights |
| 9 | Click **Complete** | Saves profile, redirects to `/dashboard` |

**Verify in Supabase:**
- Table Editor → `users` → Should have 1 row with:
  - `display_name`: "Alex"
  - `has_onboarded`: true
  - `onboarding_profile`: JSON with challenges, goals, coaching_style

### Test 4: Dashboard (Empty State)

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | After onboarding, lands on `/dashboard` | Shows WelcomeCard with "Hi Alex!" |
| 2 | Check skill radar chart | Shows flat chart (all zeros) or empty state |
| 3 | Check streak tracker | Shows 0 days, "Start your streak!" |
| 4 | Check recent sessions | Shows empty state — "No sessions yet" |
| 5 | Find **"Practice Now"** button | Button visible, links to `/practice` |

### Test 5: Scenario Selection

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Click **"Practice Now"** (or navigate to `/practice`) | Shows scenario cards |
| 2 | Verify scenario count | 10 scenarios loaded (from seed data) |
| 3 | Click **"All"** tab | Shows all 10 scenarios |
| 4 | Click **"Beginner"** tab | Filters to beginner scenarios only |
| 5 | Click **"Intermediate"** tab | Filters to intermediate scenarios |
| 6 | Inspect a scenario card | Shows: title, description, difficulty badge, partner name/info |
| 7 | Click a **beginner scenario** (e.g., "First Coffee Date") | Creates session → redirects to `/practice/[sessionId]` |

**Verify in Supabase:**
- `sessions` table → New row with `status: active`
- `messages` table → 1 row with the partner's opening message

### Test 6: Chat / Practice Session ⭐ (Core Feature)

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | After clicking scenario, lands on `/practice/[id]` | Shows dual-panel layout |
| 2 | **Left panel**: Conversation | Shows partner's opening message (e.g., "Hey! You must be Alex...") |
| 3 | **Right panel** (desktop) / toggle (mobile): Coaching | Empty or intro card |
| 4 | Type a message: "Hi! Yes, I'm Alex. Nice to meet you!" | Text appears in input |
| 5 | Press **Enter** or click **Send** | Message appears in chat as user bubble (right-aligned) |
| 6 | Watch for AI response | Typing indicator → Partner response streams in (left-aligned) |
| 7 | Check coaching panel | Coaching card appears with: cue decoding, suggestions, tone analysis |
| 8 | Send 2-3 more messages | Conversation flows naturally, coaching updates |
| 9 | Check conversation feel | Partner responds realistically based on scenario persona |

**Things to verify during chat:**
- Messages have different styles (user = right/blue, partner = left/gray)
- Streaming works (text appears word-by-word, not all at once)
- Coaching panel updates after each exchange
- No console errors during conversation

### Test 7: End Session & Scorecard

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | After 4-6 messages, click **"End Session"** | Loading state → redirects to `/practice/[id]/score` |
| 2 | View scorecard | Shows overall score (0-100) with color coding |
| 3 | Check skill breakdown | 8 skills with individual scores and trend icons |
| 4 | Check highlights | Lists things you did well |
| 5 | Check growth areas | Lists specific areas to improve |
| 6 | Click **"Practice Again"** | Returns to `/practice` scenario selection |
| 7 | Or click **"Back to Dashboard"** | Returns to `/dashboard` |

**Verify in Supabase:**
- `sessions` → Row updated: `status: completed`, `scorecard_json` populated
- `skill_scores` → 8 new rows (one per skill) with scores
- `messages` → All chat messages saved

### Test 8: Dashboard (After Session)

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Navigate to `/dashboard` | Updated data |
| 2 | Check radar chart | Shows skill scores from completed session |
| 3 | Check streak | Shows "1 day" streak |
| 4 | Check recent sessions | Shows your completed session with score |
| 5 | Check session count | Shows "1 session completed" |

### Test 9: Progress Tracking

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Navigate to `/progress` | Progress page loads |
| 2 | Check skill chart | Shows all 8 skills with scores |
| 3 | Check session history | Lists completed sessions with dates/scores |
| 4 | Check best/worst skill | Identifies your strongest and weakest areas |

### Test 10: Settings

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Navigate to `/settings` | Settings page loads |
| 2 | Change display name to "Alex 2.0" → click **Save** | Success message, name updates |
| 3 | Change coaching style → click **Save** | Success message |
| 4 | Toggle challenge selections → click **Save** | Success message |
| 5 | Navigate to `/dashboard` | Shows updated name "Hi Alex 2.0!" |

### Test 11: Sign Out & Sign In

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Click user menu → **Sign Out** | Redirects to `/login` |
| 2 | Try navigating to `/dashboard` | Redirected back to `/login` |
| 3 | Sign in with same email/password | Signs in → redirects to `/dashboard` (not onboarding) |
| 4 | Verify data persists | Dashboard shows previous session data |

### Test 12: Responsive / Mobile Layout

| # | Action | Expected Result |
|---|--------|----------------|
| 1 | Open DevTools → Toggle device toolbar | Mobile view |
| 2 | Set to iPhone 14 (390×844) | Landing page stacks vertically |
| 3 | Navigate to `/practice/[id]` (active session) | Coaching panel hidden, toggle button visible |
| 4 | Click coaching toggle | Panel slides in from right |
| 5 | Check all pages at mobile width | No horizontal overflow, readable text |

---

## Phase 5: Known Issues & Workarounds

| Issue | Impact | Workaround |
|-------|--------|------------|
| Turbopack lockfile warning | Cosmetic | Ignore — does not affect functionality |
| Middleware deprecation warning | Non-blocking | `middleware.ts` still works in Next.js 16 |
| Google OAuth not configured | No Google sign-in | Use email/password for testing |
| Account deletion is incomplete | Sign-out only, no data delete | Use Supabase dashboard to delete test users |
| No email confirmation server locally | Sign-up may require email verify | Disable email confirmation in Supabase Auth settings |

---

## Phase 6: Troubleshooting

### "Failed to fetch" on sign-in
**Cause:** `.env.local` has placeholder Supabase credentials
**Fix:** Replace with real credentials from Supabase dashboard → restart server

### "Invalid API key" on chat
**Cause:** `.env.local` has placeholder OpenAI key
**Fix:** Replace `OPENAI_API_KEY` with real key → restart server

### Sign-up says "Check your email" but no email arrives
**Cause:** Email confirmation is enabled (default)
**Fix:** Supabase → Authentication → Settings → Disable "Enable email confirmations"

### Chat sends message but no AI response
**Cause:** OpenAI API key invalid or billing not set up
**Fix:** Verify key at https://platform.openai.com/api-keys, add payment method

### Dashboard shows empty after completing a session
**Cause:** Supabase RLS policies may block reads
**Fix:** In Supabase SQL Editor, run: `SELECT * FROM sessions WHERE user_id = 'YOUR-USER-ID';`
If empty results, check RLS policies on the `sessions` table

### Server crashes on startup
**Cause:** Syntax error in `.env.local` (extra spaces, missing quotes)
**Fix:** Ensure no trailing spaces, no quotes around values, each on its own line

---

## Acceptance Criteria (V1 Complete When:)

- [ ] Can sign up with email/password
- [ ] Can complete 4-step onboarding wizard
- [ ] Dashboard shows welcome with display name
- [ ] Can browse and filter 10 practice scenarios
- [ ] Can start a chat session and exchange 5+ messages with AI
- [ ] Coaching panel shows insights during chat
- [ ] Can end session and view scorecard with scores
- [ ] Dashboard updates after completing a session
- [ ] Progress page shows skill data
- [ ] Settings page saves changes
- [ ] Sign out and sign back in works
- [ ] Data persists across sign-in sessions
