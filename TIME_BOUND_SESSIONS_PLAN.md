# Time-Bound Practice Sessions — Research & Design Plan

## Problem Statement

Cuetie's practice sessions are completely unbounded — users can chat indefinitely, consuming unlimited OpenAI tokens (~1-2¢ per user turn on GPT-4o). This creates two problems:

1. **Unsustainable API costs** — no ceiling on per-session spend
2. **Unrealistic practice** — real dating conversations are finite; unbounded chat doesn't build real-world transfer skills

---

## Research: How Long Should Practice Sessions Be?

### Real Dating Interactions

| Interaction Type | Typical Length | Messages |
|-----------------|---------------|----------|
| Coffee/drink first date | 45-90 min | N/A |
| Dinner date | 120-180 min | N/A |
| Dating app texts before meeting | A few days to ~2 weeks | 10-30 total (5-15 per person) |
| One conversational arc | 10-30 min | 8-20 messages |

**Key insight:** Cuetie should simulate a **slice** of a date (the first 10-20 minutes), not a full evening. For texting scenarios, 10-20 total messages is realistic before the conversation naturally resolves (ask them out, or it fizzles).

### Academic Research on Practice Session Length

| Finding | Source Type | Implication |
|---------|------------|-------------|
| Social skills intervention roleplays: **3-10 min** per practice chunk | Autism intervention literature | Cuetie sessions should be focused rounds, not marathon chats |
| Deliberate practice: **10-25 min** blocks for cognitively demanding tasks | Performance psychology (Ericsson) | 10-20 min is the sweet spot for skill-building |
| **Distributed practice beats massed practice** — short + repeated > long marathon | Learning science | Encourage multiple short sessions rather than one long one |
| Autistic adults experience higher social-cognitive load → shorter optimal sessions | Autism research | Default shorter for this audience; offer extension as opt-in |
| Diminishing returns after **6-12 user turns** — quality drops, responses become rigid | Skill acquisition research | Most learning value is front-loaded |

### How Competitors Handle Session Bounds

| Product Type | Bound Style | Session Length |
|-------------|-------------|---------------|
| **SpringSocial / Noora** | Structurally bounded by scenario tree | Finite by design |
| **Duolingo** | Bite-sized lessons | 2-5 min per lesson |
| **Babbel** | Structured dialogues | 10-15 min per lesson |
| **Therapy/coaching apps** | Guided modules | 5-15 min typically |
| **AI companions (Replika)** | Unbounded | Wrong model — they optimize for engagement, not learning |

**Key insight:** Learning products chunk practice. Only companionship products allow infinite chat. Cuetie is a learning product.

### Cognitive Load & Fatigue for Autistic Adults

- Effortful social practice: **10-20 min** is a safe default before fatigue rises
- Voice practice is more fatiguing than text
- Fatigue signs: slower responses, shorter replies, repeating topics, less curiosity
- Optimal pattern: **10-15 min practice → 2-5 min reflection → optional restart**

### Token Economics (GPT-4o)

| Metric | Estimate |
|--------|----------|
| Per user turn (text) | ~0.9¢ to ~1.8¢ |
| Free session COGS target | $0.05-$0.12 (5-8 turns) |
| Premium session COGS target | $0.15-$0.35 (12-20 turns) |
| Scorecard generation | Additional ~2-4¢ |
| Voice STT + TTS per turn | Additional ~1-3¢ |

---

## Proposed Solution: Hybrid Limits

### Session Round Types

Users choose their round at session start:

| Round | User Turns | Duration | Cost Est. | Tier |
|-------|-----------|----------|-----------|------|
| **Quick Round** | 5 turns | ~5 min | ~$0.05-$0.09 | Free + Premium |
| **Standard Round** | 12 turns | ~15 min | ~$0.11-$0.22 | Free (limited) + Premium |
| **Deep Practice** | 16 turns | ~20 min | ~$0.15-$0.29 | Premium only |

### Voice Mode (Shorter — More Fatiguing + Costly)

| Round | User Turns | Duration |
|-------|-----------|----------|
| Quick | 4 turns | ~5 min |
| Standard | 8 turns | ~10 min |
| Deep | 12 turns | ~15 min |

### Enforcement Rules

A session ends when **ANY** of these is true:
1. ✅ User turn cap reached (hard stop)
2. ✅ Time cap reached (hard stop)
3. ✅ Token cap reached (backend safety — invisible to user)
4. ✅ User manually ends

### Soft Warning → Hard Stop Flow

1. **At 2 turns before cap**: coaching-style warning banner — "2 replies left — great time to practice your close"
2. **At cap**: AI sends a natural closing message → auto-redirect to scorecard
3. **At token safety cap**: force-end regardless (backend-only, should rarely trigger)

### Frequency Limits (Future — Not In V1)

| Tier | Daily Limit | Notes |
|------|------------|-------|
| Free | 1-2 sessions/day | Revisit after usage data |
| Premium | Generous (~5-10/day) | Fair-use cap |

---

## UX Design

### Session Start — Round Selection

When user clicks a scenario card, show a round picker:

```
┌──────────────────────────────────────┐
│ Choose your practice round           │
│                                      │
│ ⚡ Quick Round (5 min)               │
│    Practice one key moment           │
│                                      │
│ 🎯 Standard Round (15 min)           │
│    A full conversation arc           │
│                                      │
│ ✨ Deep Practice (20 min) [Premium]  │
│    Explore in depth                  │
│                                      │
│           [Start Practice]           │
└──────────────────────────────────────┘
```

### During Session — Progress Indicator

In the session header, show:
- Turn counter: "Turn 4 of 12"
- Optional subtle progress ring

### Warning at Soft Limit

At 2 turns before cap, show a coaching-style banner (not an error):

> "You're nearing the end of this round — great time to practice wrapping up or asking a follow-up question."

### At Hard Limit — Graceful Close

1. AI sends a natural closing message (coached by system prompt)
2. Show transition card: "Nice work — let's review while it's fresh"
3. Auto-redirect to scorecard after 2-3 seconds

### Framing (Critical)

✅ **Say:** "This round simulates the first 10 minutes of a real conversation"  
✅ **Say:** "Nice work — let's review while it's fresh"  
✅ **Say:** "Two replies left — practice your close"  
❌ **Never say:** "You hit your limit"  
❌ **Never say:** "Upgrade to continue"  
❌ **Never say:** "Session expired"

---

## Technical Implementation

### What Already Exists (No Migration Needed)
- `session.message_count` — already tracked, incremented by 2 per user turn
- `session.started_at` — already stored as timestamp
- `session.total_tokens` — already accumulated per message
- `session.status` — already supports "active" → "completed"

### What Needs To Be Built

1. **Session config types** — `RoundType`, `SessionLimits`, round configs per tier
2. **Round selection UI** — Modal/drawer on scenario click
3. **Session start API update** — Accept `round_type`, derive limits
4. **Backend enforcement** — Check limits in `/api/chat/send`, return 403 with reason
5. **Progress indicator** — Turn counter in session header
6. **Soft warning** — Coaching banner at N-2 turns
7. **Auto-end logic** — AI closing message + scorecard redirect

### Dependency Chain

```
session-config-types
  → session-round-select (UI)
  → session-start-api (backend)
      → session-backend-enforce
  → session-progress-ui
      → session-auto-end (requires both enforce + progress)
```

---

## Decisions (Resolved & Implemented)

1. **Round selection:** ✅ Users choose freely, Standard Round default-highlighted
2. **Progress display:** ✅ Time remaining only (turns enforced silently on backend)
3. **Tab close / inactivity:** ✅ Auto-abandon session after 30 min inactivity (keydown/mousedown/touch tracking)
4. **AI awareness:** ✅ System prompt includes round length + current turn — AI paces conversation arc naturally (early rapport → midpoint deepening → graceful close)
5. **Token safety cap:** ✅ 2x expected cost for the round type
