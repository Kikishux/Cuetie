# Cuetie — Testing Plan

> **Version**: 1.0
> **Last Updated**: 2026-03-09
> **Scope**: MVP (Phase 1 — Text-only Practice Mode)

---

## Table of Contents

1. [Testing Strategy Overview](#1-testing-strategy-overview)
2. [Unit Tests](#2-unit-tests)
3. [API Integration Tests](#3-api-integration-tests)
4. [Component Tests](#4-component-tests)
5. [End-to-End Tests](#5-end-to-end-tests)
6. [Manual QA Test Cases](#6-manual-qa-test-cases)
7. [Performance Testing](#7-performance-testing)
8. [Security Testing](#8-security-testing)
9. [Accessibility Testing](#9-accessibility-testing)
10. [Test Environment Setup](#10-test-environment-setup)

---

## 1. Testing Strategy Overview

### Testing Pyramid

```
           ┌─────────┐
           │   E2E   │  5-10 critical user journeys
           │ (Playwright) │
          ┌┴─────────┴┐
          │ Integration │  API routes + Supabase queries
          │  (Vitest)   │
         ┌┴────────────┴┐
         │  Component    │  UI components in isolation
         │  (Vitest+RTL) │
        ┌┴──────────────┴┐
        │     Unit        │  AI engine, parsers, utilities
        │    (Vitest)     │
        └────────────────┘
```

### Tools

| Tool | Purpose |
|------|---------|
| **Vitest** | Unit & integration test runner (fast, Vite-native) |
| **React Testing Library** | Component testing |
| **Playwright** | End-to-end browser testing |
| **MSW (Mock Service Worker)** | Mock API & OpenAI calls |
| **Supabase Local** | Local database for integration tests |

### Coverage Targets (MVP)

| Layer | Target | Priority |
|-------|--------|----------|
| AI Engine (lib/ai/) | 90%+ | 🔴 Critical |
| API Routes | 80%+ | 🔴 Critical |
| Hooks | 70%+ | 🟡 High |
| Components | 60%+ | 🟡 High |
| E2E Flows | 5-10 scenarios | 🟡 High |
| Pages | 50%+ | 🟢 Medium |

---

## 2. Unit Tests

### 2.1 AI Prompt Builder (`lib/ai/prompt-builder.ts`)

| ID | Test Case | Input | Expected Output |
|----|-----------|-------|-----------------|
| PB-01 | Builds valid system prompt with all 4 layers | Scenario + Profile + Messages | System message contains persona name, coaching rules, user challenges |
| PB-02 | Includes scenario partner persona details | Scenario with persona "Alex, 27, teacher" | System prompt contains "Alex", "27", "teacher" |
| PB-03 | Includes user challenges from onboarding profile | Profile with challenges: ["reading_sarcasm"] | System prompt mentions "reading sarcasm" |
| PB-04 | Respects coaching style preference (gentle) | Profile: preferred_coaching_style = "gentle" | Prompt instructs gentle, encouraging feedback |
| PB-05 | Respects coaching style preference (direct) | Profile: preferred_coaching_style = "direct" | Prompt instructs clear, specific feedback |
| PB-06 | Limits conversation history to MAX_CONTEXT_MESSAGES | 30 messages passed | Only last 20 messages in output |
| PB-07 | Maps user messages to 'user' role | Messages with role: 'user' | OpenAI format: { role: 'user', content: '...' } |
| PB-08 | Maps partner messages to 'assistant' role | Messages with role: 'partner' | OpenAI format: { role: 'assistant', content: '...' } |
| PB-09 | Handles empty conversation history | Empty messages array | Returns system prompt only |
| PB-10 | Handles empty onboarding profile | Profile: {} | Uses default coaching instructions |
| PB-11 | Includes coaching focus areas from scenario | Scenario with coaching_focus: ["empathy", "cue_detection"] | System prompt emphasizes these skills |
| PB-12 | Includes hidden cues in persona | Persona with hidden_cues array | System prompt instructs exhibiting these cues |

### 2.2 AI Response Parser (`lib/ai/response-parser.ts`)

| ID | Test Case | Input | Expected Output |
|----|-----------|-------|-----------------|
| RP-01 | Parses valid JSON response | `{"partner_response":"Hi!","coaching":{...}}` | AIResponse with both fields |
| RP-02 | Extracts all coaching fields | Full coaching JSON | CoachingData with cue_decoded, suggestion, tone_analysis, skill_tags, skill_scores |
| RP-03 | Handles missing coaching fields gracefully | Partial coaching JSON | Defaults for missing fields |
| RP-04 | Handles malformed JSON | `"Not valid JSON at all"` | Fallback response with error coaching |
| RP-05 | Handles JSON with extra fields | JSON with unexpected keys | Strips extra fields, returns valid AIResponse |
| RP-06 | Handles empty partner_response | `{"partner_response":"","coaching":{...}}` | Returns with empty string (or fallback message) |
| RP-07 | Validates skill_tags contain valid SkillId values | skill_tags: ["empathy", "invalid_skill"] | Filters out invalid skills |
| RP-08 | Validates skill_scores are in 0-10 range | skill_scores: {"empathy": 15} | Clamps to 10 |
| RP-09 | Handles nested JSON in response | GPT wraps JSON in markdown code block | Strips markdown, parses inner JSON |
| RP-10 | extractCoachingData returns only coaching portion | Full AIResponse | CoachingData object only |

### 2.3 Scorecard Generator (`lib/ai/scorecard-generator.ts`)

| ID | Test Case | Input | Expected Output |
|----|-----------|-------|-----------------|
| SG-01 | Generates valid scorecard structure | Messages + Scenario + Profile | Scorecard with overall_score, skills, highlights, growth_areas |
| SG-02 | Overall score is between 0-10 | Any valid session | 0 ≤ overall_score ≤ 10 |
| SG-03 | All coached skills have scores | Session with multiple skills | Each SkillId has a score entry |
| SG-04 | Highlights array is non-empty | Completed session | At least 1 highlight |
| SG-05 | Growth areas array is non-empty | Completed session | At least 1 growth area |
| SG-06 | calculateSkillScores extracts correct format | Scorecard with 5 skills | Array of { skill_id, score } with 5 entries |
| SG-07 | Handles very short session (2 messages) | Minimal conversation | Still produces valid scorecard |
| SG-08 | Handles session with no coaching data | Messages without coaching field | Generates scores from raw conversation |

### 2.4 AI Config (`lib/ai/config.ts`)

| ID | Test Case | Expected |
|----|-----------|----------|
| CF-01 | getOpenAIClient returns OpenAI instance | Instance of OpenAI class |
| CF-02 | getOpenAIClient returns same instance on repeated calls | Singleton behavior |
| CF-03 | CHAT_CONFIG has expected model | "gpt-4o" |
| CF-04 | CHAT_CONFIG temperature is between 0-1 | 0.8 |
| CF-05 | SCORECARD_CONFIG temperature is lower than CHAT_CONFIG | 0.3 < 0.8 |
| CF-06 | MAX_CONTEXT_MESSAGES is a reasonable number | 20 |

### 2.5 Utilities (`lib/utils.ts`)

| ID | Test Case | Input | Expected |
|----|-----------|-------|----------|
| UT-01 | cn merges class names | cn("foo", "bar") | "foo bar" |
| UT-02 | cn handles conditional classes | cn("foo", false && "bar") | "foo" |
| UT-03 | cn deduplicates Tailwind conflicts | cn("p-4", "p-2") | "p-2" |

---

## 3. API Integration Tests

### 3.1 POST `/api/chat/send`

| ID | Test Case | Setup | Request | Expected |
|----|-----------|-------|---------|----------|
| CS-01 | Sends message and gets streamed response | Active session exists | `{ sessionId, content: "Hi there!" }` | SSE stream with partner_token events + coaching event + done event |
| CS-02 | Rejects unauthenticated request | No auth session | Any valid body | 401 Unauthorized |
| CS-03 | Rejects missing sessionId | Authenticated user | `{ content: "Hi" }` | 400 Bad Request |
| CS-04 | Rejects missing content | Authenticated user | `{ sessionId: "abc" }` | 400 Bad Request |
| CS-05 | Rejects empty content | Authenticated user | `{ sessionId: "abc", content: "" }` | 400 Bad Request |
| CS-06 | Rejects if session belongs to different user | Session owned by user B | Request from user A | 404 Not Found |
| CS-07 | Rejects if session is completed | Completed session | Valid request | 400 "Session is not active" |
| CS-08 | Saves user message to database | Active session | Valid request | New row in messages table with role='user' |
| CS-09 | Saves partner message with coaching data | Active session | Valid request | New row in messages table with role='partner' and coaching JSONB |
| CS-10 | Increments session message_count | Session with count=2 | Valid request | Session count becomes 4 (user + partner) |
| CS-11 | Handles OpenAI API error gracefully | OpenAI returns 500 | Valid request | SSE error event with user-friendly message |
| CS-12 | Respects content length limit | Authenticated user | Content > 2000 chars | 400 Bad Request |

### 3.2 POST `/api/sessions/start`

| ID | Test Case | Request | Expected |
|----|-----------|---------|----------|
| SS-01 | Creates new session | `{ scenarioId: valid_id }` | 200 with session, scenario, and opening message |
| SS-02 | Opening message has partner role | Valid request | openingMessage.role === "partner" |
| SS-03 | Opening message content matches scenario | Valid request | Content matches scenario.opening_message |
| SS-04 | Session status is 'active' | Valid request | session.status === "active" |
| SS-05 | Rejects invalid scenarioId | `{ scenarioId: "nonexistent" }` | 404 Not Found |
| SS-06 | Rejects unauthenticated request | No auth | 401 Unauthorized |

### 3.3 POST `/api/sessions/[sessionId]/end`

| ID | Test Case | Setup | Expected |
|----|-----------|-------|----------|
| SE-01 | Generates scorecard and returns it | Active session with 10 messages | 200 with scorecard containing skills, highlights, growth_areas |
| SE-02 | Updates session status to 'completed' | Active session | session.status === "completed" |
| SE-03 | Sets session ended_at timestamp | Active session | ended_at is not null and after started_at |
| SE-04 | Saves skill scores to skill_scores table | Active session | New rows in skill_scores for each skill |
| SE-05 | Rejects if session already completed | Completed session | 400 "Session already ended" |
| SE-06 | Rejects if session belongs to different user | Other user's session | 404 Not Found |

### 3.4 GET `/api/sessions/[sessionId]`

| ID | Test Case | Expected |
|----|-----------|----------|
| SG-01 | Returns session with messages and scenario | 200 with all three objects |
| SG-02 | Messages are ordered by created_at ascending | Chronological order |
| SG-03 | Rejects if session belongs to different user | 404 Not Found |
| SG-04 | Returns scorecard if session is completed | scorecard field populated |

### 3.5 GET `/api/scenarios`

| ID | Test Case | Expected |
|----|-----------|----------|
| SC-01 | Returns all active scenarios | Array with 10 seeded scenarios |
| SC-02 | Scenarios are ordered by sort_order | First is sort_order=1, last is sort_order=10 |
| SC-03 | Inactive scenarios are excluded | If any set is_active=false, not in response |
| SC-04 | Includes partner_persona data | Each scenario has persona with name, age, etc. |

### 3.6 POST `/api/users/onboarding`

| ID | Test Case | Request | Expected |
|----|-----------|---------|----------|
| OB-01 | Saves onboarding profile | Valid profile data | User updated in DB with onboarding_profile |
| OB-02 | Sets has_onboarded to true | Valid request | User has_onboarded === true |
| OB-03 | Updates display_name | `{ displayName: "Alex" }` | User display_name === "Alex" |
| OB-04 | Validates coaching style enum | `{ coachingStyle: "invalid" }` | 400 Bad Request |
| OB-05 | Rejects unauthenticated | No auth | 401 Unauthorized |

### 3.7 GET `/api/progress`

| ID | Test Case | Setup | Expected |
|----|-----------|-------|----------|
| PR-01 | Returns empty progress for new user | No sessions | Skills with zero scores, 0 streak |
| PR-02 | Returns correct skill scores | 2 completed sessions with scores | Per-skill current and previous scores |
| PR-03 | Calculates streak correctly | Sessions on 3 consecutive days | streak === 3 |
| PR-04 | Streak resets after gap | Sessions Mon, Tue, Thu | streak === 1 (Thu only) |
| PR-05 | Calculates total practice minutes | Sessions with known durations | Correct sum |
| PR-06 | Returns recent sessions with scenario titles | 3 completed sessions | Array with scenario_title populated |

---

## 4. Component Tests

### 4.1 Chat Components

| ID | Component | Test Case | Expected |
|----|-----------|-----------|----------|
| CC-01 | MessageBubble | Renders user message right-aligned | Has right-alignment classes |
| CC-02 | MessageBubble | Renders partner message left-aligned | Has left-alignment classes + avatar |
| CC-03 | MessageBubble | Shows partner name for partner messages | Name text visible |
| CC-04 | MessageBubble | Renders message content | Content text visible in DOM |
| CC-05 | CoachingCard | Renders all three sections | "Social Cue Decoded", "Suggestion", "Tone Analysis" visible |
| CC-06 | CoachingCard | Shows skill badges | Badge elements for each skill_tag |
| CC-07 | CoachingCard | Shows rewrite example when present | Rewrite text visible |
| CC-08 | CoachingCard | Hides rewrite when absent | No rewrite section |
| CC-09 | ConversationPanel | Renders list of messages | All messages visible |
| CC-10 | ConversationPanel | Shows typing indicator when loading | Animated dots visible |
| CC-11 | ConversationPanel | Input disabled while loading | Textarea has disabled attribute |
| CC-12 | ConversationPanel | Sends message on Enter key | onSendMessage called with input text |
| CC-13 | ConversationPanel | Shift+Enter creates newline (no send) | onSendMessage NOT called |
| CC-14 | ConversationPanel | Clears input after sending | Textarea value is empty |
| CC-15 | CoachingPanel | Shows empty state when no coaching | "Start chatting" message visible |
| CC-16 | CoachingPanel | Displays coaching card when data present | CoachingCard rendered |
| CC-17 | ScenarioCard | Shows title, description, difficulty | All text visible |
| CC-18 | ScenarioCard | Difficulty badge color coding | Beginner=green, Intermediate=yellow, Advanced=red |
| CC-19 | ScenarioCard | Click triggers handler | onClick called with scenario id |
| CC-20 | SessionScorecard | Shows overall score | Score number visible |
| CC-21 | SessionScorecard | Color codes score (green > 7) | Green styling for score 8 |
| CC-22 | SessionScorecard | Color codes score (red < 5) | Red styling for score 3 |
| CC-23 | SessionScorecard | Shows highlights with check icons | Highlight items visible |
| CC-24 | SessionScorecard | Shows growth areas | Growth area items visible |
| CC-25 | SessionScorecard | "Practice Again" button navigates | onClick handler called |

### 4.2 Dashboard Components

| ID | Component | Test Case | Expected |
|----|-----------|-----------|----------|
| DC-01 | WelcomeCard | Shows user name | "Welcome back, Alex!" visible |
| DC-02 | WelcomeCard | Shows streak count | Streak number + fire emoji visible |
| DC-03 | WelcomeCard | CTA links to /practice | Button has correct href |
| DC-04 | SkillRadarChart | Renders radar chart with data | SVG radar chart in DOM |
| DC-05 | SkillRadarChart | Shows empty state without data | Placeholder message visible |
| DC-06 | RecentSessions | Renders session list | Session items visible |
| DC-07 | RecentSessions | Shows empty state | "No sessions yet" message visible |
| DC-08 | RecentSessions | Session items are clickable | Link elements present |
| DC-09 | StreakTracker | Shows 7-day dot row | 7 dot elements rendered |
| DC-10 | StreakTracker | Fills dots for practice days | Active dots have filled styling |

### 4.3 Onboarding Components

| ID | Component | Test Case | Expected |
|----|-----------|-----------|----------|
| OC-01 | OnboardingWizard | Renders step 1 (welcome) first | Display name input visible |
| OC-02 | OnboardingWizard | Next button advances to step 2 | Challenges grid visible |
| OC-03 | OnboardingWizard | Back button returns to step 1 | Welcome screen visible again |
| OC-04 | OnboardingWizard | Can select multiple challenges | Multiple chips toggled on |
| OC-05 | OnboardingWizard | Can select goals in step 3 | Goal chips toggle |
| OC-06 | OnboardingWizard | Can select coaching style in step 4 | One radio option selected |
| OC-07 | OnboardingWizard | Progress bar updates per step | Width increases each step |
| OC-08 | OnboardingWizard | Submit calls API on final step | POST to /api/users/onboarding |

### 4.4 Shared Components

| ID | Component | Test Case | Expected |
|----|-----------|-----------|----------|
| SH-01 | Header | Renders logo/brand | "Cuetie" text visible |
| SH-02 | Header | Shows nav links | Dashboard, Practice, Progress links |
| SH-03 | Header | Highlights active link | Current path link has active style |
| SH-04 | Header | Sign out button works | Calls supabase.auth.signOut |
| SH-05 | AuthProvider | Provides user context | useAuth() returns user object |
| SH-06 | AuthProvider | signOut clears user state | user becomes null after signOut |

---

## 5. End-to-End Tests

### 5.1 Critical User Journeys (Playwright)

| ID | Journey | Steps | Pass Criteria |
|----|---------|-------|---------------|
| E2E-01 | **New User Signup → Onboarding → First Session** | 1. Visit / → 2. Click CTA → 3. Sign up with email → 4. Complete 4 onboarding steps → 5. Arrive at dashboard → 6. Click "Start Practicing" → 7. Select beginner scenario → 8. Send 3 messages → 9. End session → 10. View scorecard | Scorecard displays with scores; user in DB with has_onboarded=true |
| E2E-02 | **Returning User Login → Dashboard → Practice** | 1. Visit /login → 2. Sign in → 3. See dashboard with previous data → 4. Start new session → 5. Chat → 6. End session | Dashboard shows updated progress; new session in DB |
| E2E-03 | **Practice Session Chat Flow** | 1. Start session → 2. Read partner opening → 3. Send message → 4. See AI response stream in → 5. See coaching card appear → 6. Send 2 more messages → 7. Coaching updates each time | Streaming works; coaching panel shows 3 different coaching cards |
| E2E-04 | **Session Scorecard & Progress** | 1. Complete a practice session → 2. View scorecard → 3. Navigate to dashboard → 4. Check radar chart updated → 5. Navigate to progress page → 6. See line chart | Score data consistent across scorecard, dashboard, and progress page |
| E2E-05 | **Scenario Filtering** | 1. Go to /practice → 2. See all 10 scenarios → 3. Click "Beginner" tab → 4. See only beginner scenarios → 5. Click "Advanced" tab → 6. See only advanced scenarios | Correct filtering; counts match |
| E2E-06 | **Settings Update** | 1. Go to /settings → 2. Change display name → 3. Change coaching style → 4. Save → 5. Start new session → 6. Verify coaching reflects new style | Name updated in header; coaching style reflected in AI responses |
| E2E-07 | **Unauthenticated Redirect** | 1. Visit /dashboard without login → 2. Redirected to /login → 3. Visit /practice → 4. Redirected to /login | All protected routes redirect to /login |
| E2E-08 | **Landing Page → Login** | 1. Visit / → 2. See landing page → 3. Click CTA → 4. Arrive at /login | Navigation works; landing page renders fully |
| E2E-09 | **Abandon Session & Start New** | 1. Start session → 2. Send 2 messages → 3. Navigate away to /practice → 4. Start new session | New session created; old session remains in DB |
| E2E-10 | **Mobile Responsive Chat** | 1. Resize to mobile viewport → 2. Start session → 3. Send message → 4. Toggle coaching panel | Coaching panel accessible on mobile; layout doesn't break |

---

## 6. Manual QA Test Cases

### 6.1 Visual & UX Testing

| ID | Test Case | Steps | Pass Criteria |
|----|-----------|-------|---------------|
| MQ-01 | Landing page renders correctly | Load / at 1920x1080 | Hero, features, how-it-works, CTA all visible; no layout breaks |
| MQ-02 | Landing page mobile | Load / at 375x812 (iPhone) | All sections stack; readable; CTA reachable |
| MQ-03 | Login form validation | Submit empty form | Error messages appear for both fields |
| MQ-04 | Onboarding step animations | Complete each step | Smooth slide transition between steps |
| MQ-05 | Chat message scroll | Send 20+ messages | Auto-scrolls to bottom; can scroll up to see history |
| MQ-06 | Coaching card animation | Receive coaching after message | Card slides in smoothly from right |
| MQ-07 | Scorecard celebration | End session with score > 7 | Celebratory animation plays |
| MQ-08 | Radar chart readability | View dashboard with 8 skills | All 8 skill labels readable; no overlap |
| MQ-09 | Dark mode (if applicable) | Toggle to dark mode | All components readable; no invisible text |
| MQ-10 | Loading states | Slow network (throttle to 3G) | Skeleton loaders visible; no blank screens |

### 6.2 Edge Cases

| ID | Test Case | Steps | Pass Criteria |
|----|-----------|-------|---------------|
| EC-01 | Very long message | Send a 2000-char message | Message renders correctly; no overflow |
| EC-02 | Special characters in message | Send `<script>alert('xss')</script>` | Rendered as text, not executed |
| EC-03 | Emoji in messages | Send message with emojis 💝🧠 | Emojis render correctly |
| EC-04 | Rapid message sending | Send 5 messages within 2 seconds | Only first processes; others queued or blocked |
| EC-05 | Concurrent sessions | Open same session in 2 tabs | Both tabs show consistent state |
| EC-06 | Session timeout | Leave session idle for 30 min, then send | Handles gracefully (continues or prompts re-auth) |
| EC-07 | OpenAI rate limit hit | Trigger many requests | User sees "Please wait" message, not a crash |
| EC-08 | Network disconnect during streaming | Kill network mid-stream | Error message displayed; retry option available |
| EC-09 | Empty scenario library | Remove all scenarios from DB | Empty state message on /practice |
| EC-10 | User with no completed sessions | New user visits /dashboard | Empty states for radar chart, recent sessions, streak |

---

## 7. Performance Testing

| ID | Test | Target | How to Measure |
|----|------|--------|---------------|
| PT-01 | Landing page LCP | < 2.5s | Lighthouse in Chrome DevTools |
| PT-02 | Landing page Performance Score | > 90 | Lighthouse |
| PT-03 | Time to first AI token | < 2s | Measure from send click to first SSE token |
| PT-04 | Full AI response time | < 10s | Measure from send to complete response |
| PT-05 | Scorecard generation time | < 15s | Measure from "End Session" click to scorecard display |
| PT-06 | Page navigation (client-side) | < 500ms | Measure route transition time |
| PT-07 | Scenario list load time | < 1s | Measure from page load to scenarios rendered |
| PT-08 | Dashboard data load | < 2s | Measure from page load to charts rendered |
| PT-09 | Bundle size | < 500KB (first load JS) | `next build` output or Lighthouse |
| PT-10 | Concurrent users | 50 simultaneous chats | Load test with k6 or Artillery |

---

## 8. Security Testing

| ID | Test | Steps | Pass Criteria |
|----|------|-------|---------------|
| ST-01 | XSS prevention | Inject `<script>` tags in chat input | Rendered as plain text |
| ST-02 | CSRF protection | Attempt cross-site form submission | Request rejected |
| ST-03 | Row Level Security | Query API as user A for user B's session | 404 Not Found (not 403) |
| ST-04 | API key not exposed | Inspect browser network tab & page source | No OPENAI_API_KEY or SUPABASE_SERVICE_ROLE_KEY visible |
| ST-05 | Rate limiting | Send 50 chat requests in 1 minute | Requests after 30 return 429 |
| ST-06 | SQL injection | Pass `'; DROP TABLE users; --` as scenario ID | Request rejected; tables unaffected |
| ST-07 | Auth token expiry | Use expired JWT | 401 returned; redirected to login |
| ST-08 | Content moderation | Send harmful/explicit content | OpenAI moderation flags it; safe response returned |
| ST-09 | Data deletion | Click "Delete Account" in settings | All user data removed from DB |
| ST-10 | Env vars in build | Inspect `.next/` build output | Only `NEXT_PUBLIC_*` vars present client-side |

---

## 9. Accessibility Testing

| ID | Test | Tool/Method | Pass Criteria |
|----|------|------------|---------------|
| A11Y-01 | Keyboard navigation | Tab through all pages | All interactive elements focusable; visible focus rings |
| A11Y-02 | Screen reader compatibility | VoiceOver / NVDA | All content announced; chat messages readable |
| A11Y-03 | Color contrast | Lighthouse a11y audit | All text meets WCAG AA (4.5:1 ratio) |
| A11Y-04 | Form labels | Inspect login & onboarding forms | All inputs have associated labels |
| A11Y-05 | Alt text | Check all images | All images have meaningful alt text |
| A11Y-06 | Focus management in chat | Send message in chat | Focus returns to input after AI responds |
| A11Y-07 | ARIA live regions | AI response streams in | Screen reader announces new messages |
| A11Y-08 | Reduced motion | Enable prefers-reduced-motion | Animations disabled/reduced |
| A11Y-09 | Font scaling | Set browser to 200% zoom | Layout doesn't break; text readable |
| A11Y-10 | Lighthouse a11y score | Run Lighthouse on all pages | Score > 90 on each page |

> **Note**: Accessibility is especially important for Cuetie's audience. Many autistic users have co-occurring conditions that affect how they interact with interfaces.

---

## 10. Test Environment Setup

### 10.1 Install Test Dependencies

```bash
npm install -D vitest @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom msw @playwright/test
```

### 10.2 Vitest Configuration

Create `vitest.config.ts` in project root:

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    coverage: {
      reporter: ['text', 'html'],
      include: ['lib/**', 'components/**', 'app/**'],
      exclude: ['**/*.d.ts', 'components/ui/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

### 10.3 Test Setup File

Create `tests/setup.ts`:

```typescript
import '@testing-library/jest-dom'
```

### 10.4 Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

### 10.5 Playwright Configuration

Create `playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'mobile', use: { browserName: 'chromium', viewport: { width: 375, height: 812 } } },
  ],
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: true,
  },
})
```

### 10.6 Recommended File Structure

```
tests/
├── setup.ts                          (test setup / global mocks)
├── mocks/
│   ├── handlers.ts                   (MSW mock API handlers)
│   ├── openai.ts                     (Mock OpenAI responses)
│   └── supabase.ts                   (Mock Supabase client)
├── unit/
│   ├── ai/
│   │   ├── prompt-builder.test.ts
│   │   ├── response-parser.test.ts
│   │   ├── scorecard-generator.test.ts
│   │   └── config.test.ts
│   └── utils.test.ts
├── integration/
│   ├── api/
│   │   ├── chat-send.test.ts
│   │   ├── sessions.test.ts
│   │   ├── scenarios.test.ts
│   │   ├── progress.test.ts
│   │   └── onboarding.test.ts
├── components/
│   ├── chat/
│   │   ├── MessageBubble.test.tsx
│   │   ├── CoachingCard.test.tsx
│   │   ├── ConversationPanel.test.tsx
│   │   ├── ScenarioCard.test.tsx
│   │   └── SessionScorecard.test.tsx
│   ├── dashboard/
│   │   ├── WelcomeCard.test.tsx
│   │   ├── SkillRadarChart.test.tsx
│   │   └── RecentSessions.test.tsx
│   ├── onboarding/
│   │   └── OnboardingWizard.test.tsx
│   └── shared/
│       ├── Header.test.tsx
│       └── AuthProvider.test.tsx
└── e2e/
    ├── signup-onboarding.spec.ts
    ├── practice-session.spec.ts
    ├── scorecard-progress.spec.ts
    ├── scenario-filtering.spec.ts
    ├── settings.spec.ts
    ├── auth-redirect.spec.ts
    └── mobile-responsive.spec.ts
```

---

## Summary

| Category | Test Count | Priority |
|----------|-----------|----------|
| Unit Tests (AI Engine) | 38 | 🔴 Critical |
| API Integration Tests | 33 | 🔴 Critical |
| Component Tests | 41 | 🟡 High |
| E2E Journeys | 10 | 🟡 High |
| Manual QA | 20 | 🟡 High |
| Performance | 10 | 🟢 Medium |
| Security | 10 | 🔴 Critical |
| Accessibility | 10 | 🔴 Critical |
| **Total** | **172** | |

### Recommended Execution Order

1. **Unit tests for AI engine** — These are the core logic; test first
2. **API integration tests** — Verify data flow works correctly
3. **Security tests** — Especially RLS, XSS, API key exposure
4. **E2E critical journeys** — Verify the happy path works end-to-end
5. **Component tests** — UI rendering correctness
6. **Accessibility tests** — Critical for target audience
7. **Performance tests** — Ensure acceptable latency
8. **Manual QA** — Visual review and edge cases
