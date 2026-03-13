# Plan: Competitive Analysis & Critical Feature Roadmap

> **Previous plan (Hume AI integration) — COMPLETED ✅**

---

## Market Landscape

Cuetie operates at the intersection of **AI social skills coaching** and **neurodivergent dating**. The market has two distinct segments:

### Segment 1: AI Social Skills Coaches (Direct Competitors)

| Product | Focus | Key Differentiator | Pricing | Weakness |
|---------|-------|-------------------|---------|----------|
| **Noora** (Stanford) | AI social coach for autistic teens/adults | Research-backed empathy training, scenario-based | Free (research) | Academic project, not dating-specific, limited scenarios |
| **Arrows** | AI avatar social skills for autistic adults | Visual AI avatars, real-time misstep detection | SaaS subscription | Broader social focus (workplace, dating), not dating-first |
| **SpringSocial** | 1,000+ social scenarios | Massive scenario library, privacy-first, no account needed | Free/premium | No voice, no real-time AI coaching, choose-your-response format |
| **Flir** | AI dating/social role-play | Realistic character simulations | Subscription | Generic — not autism-specific, no clinical backing |
| **Doode AI** | Dating conversation practice | Flirting coaching, profile building, privacy | Freemium | Dating-only, no neurodivergent specialization |
| **Social Butterfly** | Chatbot social skills trainer | Free, no login, body language tips | Free | GPT wrapper, no progress tracking, no voice |
| **ChatCoach / Virtual Sapiens** | Communication coaching (professional) | Interview/pitch practice, AI feedback | Subscription | Workplace-focused, not dating/autism |

### Segment 2: Neurodivergent Dating Platforms (Adjacent)

| Product | Users | Key Feature | Pricing | Weakness |
|---------|-------|-------------|---------|----------|
| **Hiki** | 200K+ autistic/ADHD | Largest ND dating community, friendship + dating | Free basic, >$40/mo premium | Expensive, no coaching, just matching |
| **Haik** | Autistic/ADHD | Community groups, safety-first, affordable | Free/affordable premium | Small user base, no AI coaching |
| **Mattr** | ND (UK) | Mental health check-ins, mindful dating | Modest | Regional (UK), no practice features |
| **Synchrony** | ND adults | Interest-based matching, optional AI guide "Jesse" | Free/premium | New, friendship-first, coaching is minimal |

### Segment 3: Mainstream (Indirect)

| Product | ND-Relevant Feature | Why Users Leave |
|---------|--------------------|-----------------| 
| **Hinge** | Prompts help start conversations | Not ND-aware, no coaching, overwhelm |
| **Bumble** | Women-first reduces pressure | No ND support, ghosting, ambiguity |

---

## Cuetie SWOT Analysis

### Strengths (What Makes Cuetie Unique)

1. **Only product combining AI dating coaching + autism-specific + voice emotion analysis**
   - No competitor offers Hume AI emotion detection in a dating practice context
   - Bridges the gap between "practice apps" (SpringSocial) and "dating apps" (Hiki)

2. **Real-time dual-panel coaching during practice**
   - Live cue decoded + suggestion + tone analysis while chatting
   - Competitors offer feedback after-the-fact, not in real-time

3. **Voice mode with prosody analysis**
   - STT → practice → TTS → emotion feedback loop
   - Only Arrows has anything similar (visual avatars), but without prosody

4. **Concrete, specific feedback (not vague advice)**
   - Skill-tagged coaching (8 measurable skills)
   - Scorecard with specific examples and rewrites
   - Aligned with how autistic users process information

5. **Progress tracking with skill radar + streak system**
   - Gamification that rewards practice consistency
   - Most competitors lack longitudinal progress tracking

6. **Privacy-conscious voice handling**
   - Temp files deleted after transcription
   - No persistent audio storage

### Weaknesses (Critical Gaps)

1. **No mobile app** — web-only responsive design; competitors like Hiki/Haik are mobile-first
2. **Tiny scenario library** — only 10 scenarios vs SpringSocial's 1,000+
3. **No community/social features** — completely solo practice; no peer connection
4. **Account deletion not implemented** — privacy risk for a vulnerable user base
5. **No payment/billing** — premium tier exists but can't be purchased
6. **Google OAuth disabled** — friction for sign-up
7. **Voice coaching metrics computed but not displayed** — filler words, pacing, response time are wasted
8. **Score display bug** — 0-10 scale shown as percentages in some views
9. **No conversation review/replay** — can't revisit past conversations to study patterns
10. **No accessibility beyond basics** — missing aria-live for chat, reduced-motion, screen reader support
11. **Single AI persona style** — all scenarios feel similar; no personality variation
12. **No "real conversation" mode** — only simulated dates, no guidance for actual dating app messages

### Opportunities

1. **Market gap**: No product does "autism + dating coaching + voice emotion" together
2. **Therapist/clinician channel**: Could be prescribed or recommended by autism specialists
3. **Partnership with ND dating apps** (Hiki, Haik): Practice on Cuetie → date on their platform
4. **B2B**: Sell to autism support organizations, schools, therapy practices

### Threats

1. **Stanford's Noora** could add dating scenarios + go commercial
2. **Arrows** has funding and avatar-based approach that may feel more immersive
3. **Mainstream dating apps** adding AI coaching (Hinge is exploring AI-assisted prompts)
4. **AI commoditization** — GPT wrappers are easy to build; defensibility requires depth

---

## Critical Features to Plan

### Tier 1: Must-Have (Next 1-2 Sprints) — Fix Credibility Gaps

| # | Feature | Why Critical | Effort |
|---|---------|-------------|--------|
| 1.1 | **Fix account deletion** | Legal risk + trust issue for vulnerable users. Must actually delete data | Small |
| 1.2 | **Fix score display bug** | 0-10 scores shown as percentages breaks analytics trust | Small |
| 1.3 | **Surface hidden voice metrics** | Filler words, pacing (WPM), response time already computed but not shown | Small |
| 1.4 | **Re-enable Google OAuth** | Reduces sign-up friction significantly | Small |
| 1.5 | **Stripe payment integration** | Premium tier exists but can't be purchased. Revenue = zero without this | Medium |

### Tier 2: High-Impact Differentiators (Next 2-4 Sprints)

| # | Feature | Why Critical | Effort |
|---|---------|-------------|--------|
| 2.1 | **Scenario expansion (30+ scenarios)** | 10 is too few; users exhaust content quickly. Add: video calls, texting, rejection, meeting friends | Medium |
| 2.2 | **Conversation review/replay** | Revisit past sessions, see coaching in context, study patterns over time | Medium |
| 2.3 | **Real message coach** | Paste actual dating app messages for coaching. Bridges practice → real life | Medium |
| 2.4 | **Accessibility improvements** | aria-live for chat, prefers-reduced-motion, screen reader, high contrast | Medium |
| 2.5 | **PWA / mobile app** | Install-to-homescreen with offline browsing. Competitors are mobile-first | Medium |

### Tier 3: Competitive Moat Features (3-6 Sprints)

| # | Feature | Why It Creates Defensibility | Effort |
|---|---------|------------------------------|--------|
| 3.1 | **Therapist/coach dashboard** | Clinicians assign scenarios, review progress. Creates B2B channel | Large |
| 3.2 | **Community practice mode** | Opt-in peer practice with AI coaching. Unique in market | Large |
| 3.3 | **Adaptive difficulty** | AI adjusts scenarios based on skill levels. Personalized growth path | Medium |
| 3.4 | **Conversation personality system** | AI partners with distinct styles/attachment patterns | Medium |
| 3.5 | **Post-date debrief mode** | Describe a real date → AI analyzes, suggests what to practice next | Medium |
| 3.6 | **Sensory-aware UX modes** | Low-stimulation, high-contrast, audio-only modes for sensory needs | Medium |

### Tier 4: Future Vision

| # | Feature | Description |
|---|---------|-------------|
| 4.1 | **Real-time date coaching** | Live earpiece coaching during actual dates |
| 4.2 | **Video practice + facial expression** | Webcam-based with Hume facial emotion detection |
| 4.3 | **Dating app integration** | "Practice this conversation on Cuetie" in Hiki/Haik |
| 4.4 | **Multi-language support** | Beyond English for global autistic community |
| 4.5 | **AI-generated personalized scenarios** | Based on user's real dating profile and matches |

---

## Competitive Positioning Statement

> **Cuetie is the only AI-powered dating communication coach built specifically for autistic adults, combining real-time conversation practice with voice emotion analysis and measurable skill progression.**

vs. SpringSocial: "We're AI-powered and voice-enabled, not choose-your-response"
vs. Arrows: "We're dating-specific with emotion detection, not general social skills"
vs. Hiki/Haik: "We teach you the skills to succeed on any dating platform"
vs. Noora: "We're focused on dating, not general empathy — and we're a product, not a research project"

---

## Recommended Priority Order

```
Sprint 1-2:  1.1 → 1.2 → 1.3 → 1.4 → 1.5  (fix credibility + enable revenue)
Sprint 3-4:  2.1 → 2.3 → 2.4              (differentiate + retain users)
Sprint 5-6:  2.2 → 2.5 → 3.3 → 3.4        (deepen engagement + mobile)
Sprint 7+:   3.1 → 3.2 → 3.5 → 3.6        (build moat + B2B)
```

## Key Insight

Cuetie's biggest competitive advantage isn't any single feature — it's the **combination**: autism-specific + dating-focused + voice emotion analysis + real-time coaching + skill tracking. No competitor has all five. The risk is that each piece is reproducible individually; the moat comes from **depth of integration** and **trust with the autistic community**.

The most impactful near-term move is **Tier 2.3 (Real Message Coach)** — letting users paste actual dating app messages for coaching. This bridges practice → real life, which no competitor does, and creates daily-use engagement beyond practice sessions.
