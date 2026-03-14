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
   - Filler words, pacing (WPM), and response time metrics displayed in coaching panel
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

7. **30 scenarios with personality system**
   - 8 categories with search + filter chips
   - 6 behavioral dimensions per scenario (attachment, communication, flirtiness, emotional availability, conflict, texting style)
   - Adaptive difficulty with "Recommended for You" based on weak skills

8. **Real-world transfer tools**
   - Real Message Coach (`/coach`) — paste actual dating app messages for coaching
   - Post-Date Debrief (`/debrief`) — analyze real dates with guided prompts
   - Conversation Review — revisit past sessions with inline coaching notes

### Weaknesses (Remaining Gaps)

1. **No mobile app** — web-only responsive design; competitors like Hiki/Haik are mobile-first
2. **No community/social features** — completely solo practice; no peer connection
3. **No payment/billing** — premium tier exists but can't be purchased (no Stripe integration)
4. **No accessibility beyond basics** — missing aria-live for chat, reduced-motion, screen reader support
5. **No low-stimulation / sensory-safe UX mode** — critical for target audience
6. **No therapist/coach dashboard** — B2B channel not yet buildable

### ✅ Previously Identified Weaknesses — Now Fixed

| Issue | Resolution |
|-------|------------|
| ~~Tiny scenario library (10)~~ | Expanded to **30 scenarios** across 8 categories with filter chips + search |
| ~~Account deletion not implemented~~ | Server-side admin API deletes auth user + cascades all data |
| ~~Google OAuth disabled~~ | Button restored with graceful error handling (Supabase provider config still needed) |
| ~~Voice metrics not displayed~~ | Filler words, pacing (WPM), response time now shown in coaching panel |
| ~~Score display bug (% vs /10)~~ | Consistently uses **/10 scale** across dashboard, progress, scorecard |
| ~~No conversation review/replay~~ | Read-only `/practice/[sessionId]/review` with inline coaching notes |
| ~~Single AI persona style~~ | **6 behavioral dimensions** (attachment, communication, flirtiness, emotional availability, conflict, texting style) on all 30 scenarios |
| ~~No "real conversation" mode~~ | **Real Message Coach** at `/coach` — paste actual dating messages for subtext decoding + reply suggestions |

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

| # | Feature | Why Critical | Effort | Status |
|---|---------|-------------|--------|--------|
| 1.1 | **Fix account deletion** | Legal risk + trust issue for vulnerable users. Must actually delete data | Small | ✅ Done |
| 1.2 | **Fix score display bug** | 0-10 scores shown as percentages breaks analytics trust | Small | ✅ Done |
| 1.3 | **Surface hidden voice metrics** | Filler words, pacing (WPM), response time already computed but not shown | Small | ✅ Done |
| 1.4 | **Re-enable Google OAuth** | Reduces sign-up friction significantly | Small | ✅ Done |
| 1.5 | **Stripe payment integration** | Premium tier exists but can't be purchased. Revenue = zero without this | Medium | Pending |

### Tier 2: High-Impact Differentiators (Next 2-4 Sprints)

| # | Feature | Why Critical | Effort | Status |
|---|---------|-------------|--------|--------|
| 2.1 | **Scenario expansion (30+ scenarios)** | 10 is too few; users exhaust content quickly. Add: video calls, texting, rejection, meeting friends | Medium | ✅ Done (30 scenarios + category filter + search) |
| 2.2 | **Conversation review/replay** | Revisit past sessions, see coaching in context, study patterns over time | Medium | ✅ Done |
| 2.3 | **Real message coach** | Paste actual dating app messages for coaching. Bridges practice → real life | Medium | ✅ Done |
| 2.4 | **Accessibility improvements** | aria-live for chat, prefers-reduced-motion, screen reader, high contrast | Medium | Pending |
| 2.5 | **PWA / mobile app** | Install-to-homescreen with offline browsing. Competitors are mobile-first | Medium | Pending |

### Tier 3: Competitive Moat Features (3-6 Sprints)

| # | Feature | Why It Creates Defensibility | Effort | Status |
|---|---------|------------------------------|--------|--------|
| 3.1 | **Therapist/coach dashboard** | Clinicians assign scenarios, review progress. Creates B2B channel | Large | Pending |
| 3.2 | **Community practice mode** | Opt-in peer practice with AI coaching. Unique in market | Large | Pending |
| 3.3 | **Adaptive difficulty** | AI adjusts scenarios based on skill levels. Personalized growth path | Medium | ✅ Done |
| 3.4 | **Conversation personality system** | AI partners with distinct styles/attachment patterns | Medium | ✅ Done |
| 3.5 | **Post-date debrief mode** | Describe a real date → AI analyzes, suggests what to practice next | Medium | ✅ Done |
| 3.6 | **Sensory-aware UX modes** | Low-stimulation, high-contrast, audio-only modes for sensory needs | Medium | Pending |

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

> **Cuetie is the only AI-powered dating communication coach built specifically for autistic adults, combining real-time conversation practice, voice emotion analysis, real-message decoding, post-date debriefs, and measurable skill progression — all designed to support clear communication without forced masking.**

vs. SpringSocial: "We're AI-powered, voice-enabled, and coach on real messages — not choose-your-response"
vs. Arrows: "We're dating-specific with emotion detection and real-world transfer tools, not general social skills"
vs. Hiki/Haik: "We teach you the skills to succeed on any dating platform, with 30 personality-driven scenarios"
vs. Noora: "We're focused on dating with adaptive difficulty and debrief tools — and we're a product, not a research project"

---

## Recommended Priority Order

```
Next:       1.5 (Stripe) → 2.4 (Accessibility) → 2.5 (PWA)     (enable revenue + reach)
Then:       S1 (Ambiguity Decoder) → S2 (Consent Coach) → S5 (Rejection Recovery)  (research-backed high-impact)
After:      S3 (Sensory Date Prep) → S4 (Transparent Scoring) → 3.6 (Low-stim UX)  (deepen differentiation)
Later:      3.1 (Therapist Dashboard) → 3.2 (Community) → S6–S14  (build moat + B2B)
```

## Key Insight

Cuetie's biggest competitive advantage isn't any single feature — it's the **combination**: autism-specific + dating-focused + voice emotion analysis + real-time coaching + skill tracking + real-message decoding + post-date debrief. No competitor has all seven. With Tier 1 fixes complete and Tier 2–3 differentiators largely shipped, the next moat comes from **research-informed depth** (Ambiguity Decoder, Consent Coach, Sensory Planner) and **revenue enablement** (Stripe integration).

---

## Strategic Direction — User Research Insights

> Based on qualitative research on autistic adults' romantic experiences, systematic reviews of social-skills interventions, HCI/neurodivergent UX research, and autistic community discourse patterns (Reddit r/autism, r/aspergers, Wrong Planet, autistic-led blogs/podcasts).

### The Core Problem Cuetie Should Solve

For autistic adults, dating is hard **not** because they "don't know the rules" in the abstract, but because dating is:

1. **Highly ambiguous** — signals are weak, implicit, and inconsistent
2. **Socially high-stakes** — rejection costs are emotionally amplified
3. **Full of indirect communication** — sarcasm, soft rejection, implied expectations
4. **Sensory and cognitively demanding** — noisy venues, multitasking, fatigue
5. **Poorly served by existing tools** — either childish, neurotypical-biased, or too generic

### The Biggest Unmet Need

> **Help autistic adults interpret ambiguous signals, act in ways aligned with their own values, and navigate dating safely — without forcing masking.**

This means Cuetie should prioritize: subtext translation with uncertainty, consent/boundary coaching, real-message coaching, sensory-aware date planning, post-date interpretation, and transparent non-patronizing feedback.

---

### Top Pain Points for Autistic Adults in Dating

| Pain Point | What It Looks Like | Confidence | Source Types |
|---|---|---|---|
| **Reading interest vs friendliness** | "Are they flirting or just being nice?" | High | Qualitative studies, community forums |
| **Understanding subtext** | Sarcasm, teasing, soft rejection, "maybe later," implied expectations | High | Qualitative studies, HCI research |
| **Initiating/sustaining conversation** | When to self-disclose, avoiding monologues/interrogation mode | High | Intervention literature, community |
| **Texting & dating app pragmatics** | Response timing, tone matching, when to ask out, message length | High | Community patterns, HCI research |
| **Consent & physical escalation** | When/how to ask for touch, reading discomfort, goodbye hug/kiss | High | Sexuality education, community |
| **Sensory overload during dates** | Noise, lights, crowds, shutdown risk, performance collapse | High | Sensory/autism research, community |
| **Managing rejection & rumination** | Replaying conversations, ghosting distress, not knowing if it went well | High | Qualitative studies, anxiety literature |
| **Balancing authenticity vs masking** | "Am I learning communication or pretending to be neurotypical?" | High | Self-advocacy writing, HCI critique |
| **Interpreting voice/facial cues** | Flat affect mismatch, missing enthusiasm/discomfort cues | Medium-High | Social communication literature |
| **Transferring practice to real life** | Canned roleplay not mapping to actual dates/messages | High | HCI transfer-of-learning research |

These cluster into **6 skill buckets**:

**A. Signal Interpretation** — Is this flirting, politeness, or disinterest? Is "I'm busy" a reschedule or a soft no?

**B. Conversation Pragmatics** — Turn-taking, reciprocal questions, how much detail is "too much," flirting without sounding scripted

**C. Subtext & "Between the Lines"** — Hints, hedging, softening, recognizing "not now" vs "never"

**D. Sensory Self-Regulation** — Choosing tolerable venues, coping mid-date, planning breaks/exit routes

**E. Consent, Boundaries & Physical Affection** — When/how to ask, reading hesitation, saying no, recovering from awkward moments

**F. Post-Date Interpretation** — Did it go well? Should I text? Am I overthinking?

---

### What Autistic Adults Want from Social-Skills Tools

#### ✅ What They Value Most

**1. Explicit explanations, not vague advice**
- "Here are 3 possible meanings" / "This reply may sound abrupt because…"
- NOT "Just be confident" / "Relax and be yourself"
- Every coaching insight should include: likely interpretation, why, uncertainty level, 2–3 valid response options

**2. Concrete examples and rewrites**
- Side-by-side rewrites, message comparison, "too intense / neutral / warm" examples
- NOT abstract labels only ("show empathy more")

**3. Adult, respectful tone**
- Dignity, autonomy, realism, real adult dating situations
- NOT childish, school-like, cartoonish, or parent/therapist-facing

**4. Tools that acknowledge ambiguity**
- Confidence ranges, multiple plausible interpretations
- NOT pretending there is one correct answer in socially ambiguous situations

**5. Personalization to their communication style**
- Let users set: directness level, flirting comfort, sensory needs, "help me stay authentic" vs "help me blend in"
- NOT one-size-fits-all neurotypical norms

**6. Real-world transfer**
- Help with actual dating app messages, actual post-date texts, actual confusion from real interactions
- NOT fictional practice scenarios forever

#### ❌ What They Find Patronizing

- "It feels like it's trying to make me normal"
- "It assumes neurotypical behavior is always better"
- "It treats me like a child"
- "It scores me without explaining the rubric"
- "It tells me to make eye contact / smile more / act natural"
- "It ignores sensory overload"

---

### Market Gaps — Where Cuetie Wins

| Gap | Status of Market | Cuetie Opportunity |
|---|---|---|
| **Adult dating-specific autism support** | Tools are strongest in education/school/general social skills, weakest in flirting, dating apps, first dates, consent | Core product — already positioned here |
| **Real-message interpretation** | Few tools let you paste a real message and get subtext + safe responses + uncertainty warnings | Strengthen existing Message Coach into signature pillar |
| **Sensory-aware dating support** | Complete white space — no tool treats sensory regulation as part of dating success | Build Sensory-Aware Date Planner |
| **Consent & boundary coaching** | Practical tools for asking before touch, reading hesitation, wording direct consent are rare | New dedicated skill track |
| **Masking-safe coaching** | Most tools optimize for "pass as typical" — missing "communicate clearly while staying yourself" | Position as core brand differentiator |
| **Transparent scoring** | AI coaches score "warmth" without making rubric visible; autistic users want to see why | Rebuild scoring with explainability |

### Competitor Weaknesses by Segment

| Competitor Type | Strength | Where They Fail This Audience |
|---|---|---|
| **Floreo / immersive tools** | Immersive practice, scenario-based | Clinician-oriented, not dating-specific, miss texting/subtext |
| **Social Skills Solutions** | Structured explicit instruction | Didactic, not optimized for adult romance |
| **Joon / self-regulation** | Motivation, routines, engagement | Not built for nuanced romantic communication |
| **Mainstream dating coaches** | Know modern dating norms | Rarely autism-aware, encourage "game" over clarity |

---

### Effective Coaching Approaches for This Audience

| Approach | Why It Works | Implementation |
|---|---|---|
| **Explicit instruction + rationale** | Signal → Interpretation → Why → Response options | Already doing this; deepen with uncertainty language |
| **Frameworks first, scripts second** | Frameworks generalize; scripts help stressful moments | "Show interest = answer + reciprocate + small emotional signal" |
| **Contrastive examples** | Show too blunt / balanced / too intense side-by-side | Add to coaching panel |
| **Immediate feedback in context** | Right after the message, tied to exact wording | Dual-panel coaching already aligned |
| **Gradual scaffolding** | Decode → craft → text exchange → live chat → voice → date planning | Build "Transfer Ladder" |
| **Support uncertainty, not fake certainty** | "Likely friendly, possibly mild interest" > "She likes you" | Add confidence language to all coaching |
| **Sensory/cognitive load accommodations** | Low-stimulation UI, predictable structure, chunked feedback, pause/replay | Build accessibility modes |
| **Strength-based framing** | Clarity, compatibility, consent, self-advocacy — not deficit-fixing | Reframe all language |

---

### Risks & Concerns to Mitigate

| Risk | What Users Fear | Product Response |
|---|---|---|
| **Masking / "being fixed"** | Pressured to suppress autistic communication style | Explicitly state: "Directness is not wrong. You choose the style" |
| **Neurotypical bias in scoring** | Penalizing bluntness, assuming small talk is necessary | Score clarity, reciprocity, boundary awareness — not "normality" |
| **False certainty** | AI overstating attraction/rejection → embarrassment or unsafe escalation | Use confidence bands: likely / possible / weak evidence / ask directly |
| **Privacy concerns** | Real messages, voice samples, emotionally vulnerable content shared | Clear retention policy, easy deletion, private-by-default |
| **Over-reliance on tool** | Users stop trusting themselves, need AI before every text | Design for scaffolding: "coach less over time," confidence mode |
| **Shaming through scores** | "I failed being human" / "I'm bad at relationships" | Reframe as skill signals and growth markers, not worth or dateability |
| **Safety / manipulation** | App could teach performative empathy or coercive escalation | Anchor every module in consent, mutuality, respect for no |

---

### Strategic Feature Roadmap (Research-Informed)

#### Priority 1: Highest Impact, Good Feasibility

| # | Feature | Description | Impact | Feasibility |
|---|---------|-------------|--------|-------------|
| S1 | **Ambiguity Decoder v2** | Upgrade message coach: literal vs implied view, interest/confidence bands, suggested replies by goal, "ask directly" option, weak-evidence warnings | Very High | High |
| S2 | **Consent & Boundary Coaching** | Dedicated skill track: asking for touch, reading hesitation, saying no, ending dates safely, direct consent scripts | Very High | Medium |
| S3 | **Sensory-Aware Date Prep** | Venue filters/checklist, date energy budget, overwhelm scripts, break/exit planning, post-date recovery | High | Medium |
| S4 | **Transparent Masking-Safe Scoring** | Show rubric dimensions, explain score changes, let users choose goals (clarity/warmth/directness), separate social norms from safety | High | Medium |
| S5 | **Rejection & Ghosting Recovery** | Classify scenario (busy/soft no/hard no/ambiguous), one follow-up rule, closure scripts, rumination containment | High | High |

#### Priority 2: High Value, Moderate Complexity

| # | Feature | Description | Impact | Feasibility |
|---|---------|-------------|--------|-------------|
| S6 | **Real-to-Practice Transfer Ladder** | Progressive modes: decode message → rewrite → simulate response → voice practice → call practice → first-date sim → debrief | High | Medium |
| S7 | **Low-Stimulation & Accessibility Modes** | Reduced motion, calmer visual density, chunked feedback, text-only mode, keyboard/screen-reader support, audio off by default | High | Medium |
| S8 | **Adult Scenario Expansion** | Dating apps, first-date sensory overload, soft rejection, follow-up texts, physical affection/consent, disclosing autism | High | Medium |
| S9 | **Repair Scripts Library** | Ready-made scripts for awkward moments: "I answered too intensely," "The noise is getting to me," "Can I ask directly?" | Medium-High | High |

#### Priority 3: Strategic Differentiation

| # | Feature | Description | Impact | Feasibility |
|---|---------|-------------|--------|-------------|
| S10 | **Pattern Detection Over Time** | "You often answer well but don't reciprocate with a question" / "Under stress you become overly detailed" | Medium-High | Medium |
| S11 | **Values-Based Personalization** | Settings: direct vs polished, sensory support level, flirting comfort, explicit consent preference, autistic-affirming vs NT-norm translation | Medium-High | Medium |
| S12 | **Compatible-Partner Signal Library** | Teach users to spot partners comfortable with direct communication, explicit plans, sensory needs, consent | Medium | Medium |
| S13 | **"Authentic, Not Performative" Mode** | Toggle: "Help me be clearer without masking" / "Help me understand NT norms" / "Help me find compatible people" | Medium-High | Medium |
| S14 | **Uncertainty Meter + "Ask Directly" Prompts** | When ambiguity is high, recommend direct clarification instead of more inference — supports autistic strengths | Medium | High |

---

### Product Principles

1. **Don't teach "normal" — teach "clear, respectful, mutually enjoyable"**
2. **Never present ambiguous social meaning as certainty**
3. **Optimize for compatibility, not masking**
4. **Treat sensory regulation as part of dating success**
5. **Prefer frameworks with examples over rigid scripts alone**
6. **Make every score explainable**
7. **Design for dignity, adulthood, and autonomy**

---

### Revised Positioning Statement

> **Cuetie is the most trusted autism-affirming tool for decoding dating ambiguity, practicing clear communication, and navigating romance without forced masking — combining real-time AI coaching, voice emotion analysis, and measurable skill progression designed with autistic strengths in mind.**

---

### Validation: Next Steps for Primary Research

Because this strategic direction is based on secondary research synthesis, validate before major roadmap commitments:

**Interview Questions to Test:**
1. Does "social coaching" feel helpful or patronizing?
2. Do users want scoring at all? If yes, how should it be framed?
3. Do they prefer scripts, frameworks, or both?
4. What types of dates/messages create the most uncertainty?
5. What feels supportive vs masking-pressure?

**Recommended Studies:**
- 12–15 semi-structured interviews with autistic adults who date or want to date
- 2-week diary study of confusing dating-app/message moments
- Concept testing for Ambiguity Decoder, Consent Coach, and Sensory Planner
- Participatory co-design with autistic advisors on language, scoring, and ethics
- Usability testing of low-stimulation mode and feedback explanations

**Segment By:** dating experience level, gender/sexuality, direct vs indirect preference, sensory sensitivity, text-first vs voice-first
