# Cuetie — TODO List

## ✅ Completed

| Feature | Date | Details |
|---------|------|---------|
| Hume AI voice emotion analysis | Mar 13 | Premium voice coach with 48-emotion detection, free/premium tier gating |
| Fix account deletion | Mar 13 | Server-side admin API deletes auth user + cascades all data |
| Fix score display bug | Mar 13 | Changed % → /10 across progress, dashboard, charts |
| Surface voice metrics | Mar 13 | Filler words, pacing (WPM), response time now shown in coaching panel |
| Re-enable Google OAuth | Mar 13 | Button restored with graceful error if Supabase provider not configured |
| Scenario expansion (10→30) | Mar 13 | 20 new scenarios across all 8 categories + category filter chips + search |
| Conversation review/replay | Mar 13 | Read-only /review page with inline coaching notes, linked from scorecard/progress/dashboard |
| Real Message Coach | Mar 13 | New /coach page — paste dating messages, get decoded meaning, social cues, flags, 3 reply options |
| Adaptive difficulty | Mar 13 | Recommendation API + "🎯 Recommended for You" section + scorecard suggested next scenarios |
| Conversation personality system | Mar 13 | 6 behavioral dimensions (attachment, communication, flirtiness, emotional availability, conflict, texting style) on all 30 scenarios |
| Post-date debrief | Mar 13 | New /debrief page with guided prompts, AI analysis of real dates, specific scenario recommendations by title |

---

## Test / Demo Accounts

| Account | Email | Password | Status |
|---------|-------|----------|--------|
| Alex | `demo.alex@cuetie.test` | `CuetieDemo2026!` | Fresh (needs onboarding) |
| Sam | `demo.sam@cuetie.test` | `CuetieDemo2026!` | Fresh (needs onboarding) |
| Jordan | `demo.jordan@cuetie.test` | `CuetieDemo2026!` | Fresh (needs onboarding) |

> **Note:** Your existing account `demo@cuetietest.com` is already onboarded and has dashboard data.

---

## ✅ "Continue with Google" login — Re-enabled

**Status:** Button is back in the code with graceful error handling. Supabase provider still needs to be enabled.

**Remaining Supabase setup (manual):**

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select the Cuetie project (`bzclzwvzqvuqpwprtsfp`)
3. Navigate to **Authentication → Providers → Google**
4. Toggle Google provider **ON**
5. Set up Google OAuth credentials:
   - Go to https://console.cloud.google.com/apis/credentials
   - Create an OAuth 2.0 Client ID (Web application)
   - Add authorized redirect URI: `https://bzclzwvzqvuqpwprtsfp.supabase.co/auth/v1/callback`
   - Copy the **Client ID** and **Client Secret** into Supabase
6. Save the provider settings in Supabase

## Premium Test User

Sam (`demo.sam@cuetie.test`) should be set to premium tier for testing:
```sql
UPDATE public.users SET subscription_tier = 'premium' WHERE email = 'demo.sam@cuetie.test';
```
