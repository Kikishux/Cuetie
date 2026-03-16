# Cuetie — Deployment & Setup Guide

> This guide walks you through setting up Cuetie from zero to a running application.
> No coding experience required — just follow each step.

---

## Quick Start (for developers who already have accounts)

```bash
# 1. Clone the repo
git clone https://github.com/Kikishux/Cuetie.git
cd Cuetie

# 2. Install dependencies
npm install

# 3. Copy and fill in environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase URL, anon key, service role key, and OpenAI API key

# 4. Run all migrations in Supabase SQL Editor (001 → 007), then run seed.sql

# 5. Create a test user in Supabase Auth dashboard:
#    Email: demo.alex@cuetie.test  Password: CuetieDemo2026!

# 6. Start the dev server
npm run dev
# Open http://localhost:3000
```

---

## Table of Contents

1. [Prerequisites (What You Need)](#1-prerequisites)
2. [Set Up Supabase (Database + Auth)](#2-set-up-supabase)
3. [Set Up OpenAI (AI Engine)](#3-set-up-openai)
4. [Configure the App](#4-configure-the-app)
5. [Run Locally](#5-run-locally)
6. [Deploy to Vercel (Go Live)](#6-deploy-to-vercel)
7. [Set Up Google Login (Optional)](#7-set-up-google-login)
8. [Verify Everything Works](#8-verify-everything-works)
9. [Ongoing Costs & Monitoring](#9-ongoing-costs--monitoring)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

You need these installed on your computer:

### Node.js (v18 or later)
- Download from: https://nodejs.org
- Pick the **LTS** (Long Term Support) version
- After install, verify it works by opening a terminal and typing:
  ```
  node --version
  ```
  You should see something like `v20.x.x`

### Git
- Download from: https://git-scm.com
- Verify with:
  ```
  git --version
  ```

### A Code Editor (optional but helpful)
- [VS Code](https://code.visualstudio.com) is free and excellent

### Accounts You'll Need (all free tier)
| Service | What It Does | Sign Up |
|---------|-------------|---------|
| **Supabase** | Database + user authentication | https://supabase.com |
| **OpenAI** | AI engine (GPT-4o) | https://platform.openai.com |
| **Vercel** | Hosts your web app | https://vercel.com |
| **GitHub** | Stores your code | https://github.com |

---

## 2. Set Up Supabase

Supabase is your database and handles user login/signup.

### Step 2.1 — Create a Project

1. Go to https://supabase.com and sign in (or create an account)
2. Click **"New Project"**
3. Fill in:
   - **Name**: `cuetie`
   - **Database Password**: Choose a strong password and **save it somewhere safe**
   - **Region**: Pick the one closest to your users (e.g., `East US` for US users)
4. Click **"Create new project"** and wait ~2 minutes for it to spin up

### Step 2.2 — Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API** (left sidebar)
2. You'll see two important values — copy them both:

   | Key | Where to Find It | What It Looks Like |
   |-----|-----------------|-------------------|
   | **Project URL** | Under "Project URL" | `https://abc123xyz.supabase.co` |
   | **anon public key** | Under "Project API keys" → `anon` `public` | `eyJhbGciOiJIUzI1NiIs...` (long string) |
   | **service_role key** | Under "Project API keys" → `service_role` `secret` | `eyJhbGciOiJIUzI1NiIs...` (long string) |

   ⚠️ **The `service_role` key is SECRET — never share it or put it in client-side code**

### Step 2.3 — Create the Database Tables

1. In your Supabase dashboard, go to **SQL Editor** (left sidebar)
2. Run each migration file **in order**. For each file:
   - Click **"New Query"**
   - Open the migration file from the Cuetie project
   - Copy the **entire contents** and paste it into the SQL Editor
   - Click **"Run"** (or press Ctrl+Enter)

   | # | File | What It Creates |
   |---|------|----------------|
   | 1 | `supabase/migrations/001_initial_schema.sql` | Core tables: users, scenarios, sessions, messages, skills |
   | 2 | `supabase/migrations/002_subscription_tier.sql` | Subscription tier column |
   | 3 | `supabase/migrations/003_expanded_scenarios.sql` | Additional practice scenarios |
   | 4 | `supabase/migrations/004_persona_dimensions.sql` | Partner personality dimensions |
   | 5 | `supabase/migrations/005_session_round_type.sql` | Session round types (quick/standard/deep) |
   | 6 | `supabase/migrations/006_dating_app_scenarios.sql` | Dating app messaging scenarios |
   | 7 | `supabase/migrations/007_finetune_sessions.sql` | Fine-tune / dynamic scenario support |

   ⚠️ **Order matters** — run them 001 → 007 sequentially.

### Step 2.4 — Seed the Practice Scenarios

1. Still in the **SQL Editor**, click **"New Query"** again
2. Open the file `supabase/seed.sql` from the Cuetie project
3. Copy the **entire contents** and paste it in
4. Click **"Run"**
5. You should see "Success" — this populates scenarios and skill definitions

### Step 2.5 — Create a Test User

1. In your Supabase dashboard, go to **Authentication** → **Users** (left sidebar)
2. Click **"Add User"** → **"Create new user"**
3. Enter:
   - **Email**: `demo.alex@cuetie.test`
   - **Password**: `CuetieDemo2026!`
   - Check **"Auto Confirm User"**
4. Click **"Create User"**

> 💡 This gives you a test account to log in immediately without email verification.

### Step 2.6 — Verify Tables Were Created

1. Go to **Table Editor** (left sidebar)
2. You should see these tables:
   - `users`
   - `scenarios` (should have 10 rows)
   - `sessions`
   - `messages`
   - `skill_defs` (should have 8 rows)
   - `skill_scores`

✅ **Supabase is ready!**

---

## 3. Set Up OpenAI

OpenAI powers the AI conversation partner and coaching.

### Step 3.1 — Get an API Key

1. Go to https://platform.openai.com and sign in (or create an account)
2. Go to **API Keys** (click your profile icon → "API Keys", or go to https://platform.openai.com/api-keys)
3. Click **"Create new secret key"**
4. Give it a name like `cuetie-app`
5. **Copy the key immediately** — you won't be able to see it again!
   - It looks like: `sk-proj-abc123...`

### Step 3.2 — Add Payment Method

1. Go to **Settings** → **Billing** (https://platform.openai.com/settings/organization/billing/overview)
2. Click **"Add payment method"** and add a credit card
3. Set a **usage limit** to protect yourself:
   - Go to **Settings** → **Limits**
   - Set a monthly budget (suggested: **$20-50/month** to start)
   - Set a notification threshold at **$10** so you know when costs increase

> 💡 **Cost estimate**: Each practice conversation costs roughly $0.02-0.05. So $20/month supports ~400-1000 practice sessions.

✅ **OpenAI is ready!**

---

## 4. Configure the App

### Step 4.1 — Set Up Environment Variables

1. In the Cuetie project folder, find the file `.env.local`
2. Open it in a text editor and replace the placeholder values:

```bash
# Paste your Supabase values from Step 2.2
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ-your-actual-anon-key

# Paste the service_role key from Step 2.2
SUPABASE_SERVICE_ROLE_KEY=eyJ-your-actual-service-role-key

# Paste your OpenAI API key from Step 3.1
OPENAI_API_KEY=sk-proj-your-actual-key
```

3. Save the file

⚠️ **IMPORTANT**: Never share `.env.local` or commit it to Git. It's already in `.gitignore`.

### Step 4.2 — Install Dependencies

Open a terminal in the Cuetie project folder and run:

```bash
npm install
```

Wait for it to finish (may take 1-2 minutes).

---

## 5. Run Locally

### Step 5.1 — Start the Development Server

```bash
npm run dev
```

You should see:
```
▲ Next.js 16.x.x (Turbopack)
- Local:    http://localhost:3000
```

### Step 5.2 — Open the App

1. Open your browser and go to **http://localhost:3000**
2. You should see the Cuetie landing page
3. Click **"Start Practicing Free"** to go to the login page
4. Create an account with email + password
5. Complete the onboarding quiz
6. Start a practice session!

### Step 5.3 — Test the Full Flow

| Step | What to Do | What Should Happen |
|------|-----------|-------------------|
| 1 | Visit http://localhost:3000 | Landing page with features |
| 2 | Click "Start Practicing Free" | Redirected to /login |
| 3 | Enter email + password, click Sign Up | Account created |
| 4 | Complete 4-step onboarding wizard | Profile saved, redirected to /dashboard |
| 5 | Click "Start Practicing" on dashboard | Scenario selection grid |
| 6 | Pick "First Coffee Date" | Chat session starts, partner sends opening message |
| 7 | Type a response and press Enter | AI responds + coaching sidebar appears |
| 8 | Chat for 5-10 messages | Coaching insights update with each exchange |
| 9 | Click "End Session" | Scorecard generated with skill scores |
| 10 | Go to Dashboard | Progress chart updates |

To stop the server, press `Ctrl+C` in the terminal.

✅ **Local setup complete!**

---

## 6. Deploy to Vercel (Go Live)

### Step 6.1 — Push Code to GitHub

1. Create a new repository on GitHub:
   - Go to https://github.com/new
   - Name it `cuetie`
   - Keep it **Private**
   - Click **"Create repository"**

2. In your terminal (in the Cuetie folder), run:
   ```bash
   git init
   git add .
   git commit -m "Initial Cuetie MVP"
   git branch -M main
   git remote add origin https://github.com/YOUR-USERNAME/cuetie.git
   git push -u origin main
   ```

### Step 6.2 — Deploy on Vercel

1. Go to https://vercel.com and sign in with your GitHub account
2. Click **"Add New..."** → **"Project"**
3. Find and select your `cuetie` repository
4. Under **"Environment Variables"**, add these four:

   | Name | Value |
   |------|-------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key |
   | `OPENAI_API_KEY` | Your OpenAI API key |

5. Click **"Deploy"**
6. Wait 2-3 minutes for the build to complete
7. Vercel gives you a URL like `https://cuetie-abc123.vercel.app`

### Step 6.3 — Update Supabase Auth Redirect URLs

1. Go to your Supabase dashboard → **Authentication** → **URL Configuration**
2. Set **Site URL** to your Vercel URL: `https://cuetie-abc123.vercel.app`
3. Add **Redirect URLs**:
   - `https://cuetie-abc123.vercel.app/**`
   - `http://localhost:3000/**` (for local development)

### Step 6.4 — Custom Domain (Optional)

1. In Vercel, go to your project → **Settings** → **Domains**
2. Add your custom domain (e.g., `cuetie.app`)
3. Follow Vercel's instructions to update your DNS records
4. Update the Supabase Site URL to your custom domain

✅ **Your app is live!**

---

## 7. Set Up Google Login (Optional)

To let users sign in with their Google account:

### Step 7.1 — Create Google OAuth Credentials

1. Go to https://console.cloud.google.com
2. Create a new project (or select an existing one)
3. Go to **APIs & Services** → **Credentials**
4. Click **"Create Credentials"** → **"OAuth client ID"**
5. If prompted, configure the **OAuth consent screen**:
   - App name: `Cuetie`
   - User support email: your email
   - Authorized domains: your Vercel domain
   - Save
6. Back in Credentials, create OAuth client ID:
   - Application type: **Web application**
   - Name: `Cuetie`
   - Authorized redirect URIs: `https://YOUR-SUPABASE-PROJECT.supabase.co/auth/v1/callback`
7. Copy the **Client ID** and **Client Secret**

### Step 7.2 — Add to Supabase

1. In Supabase dashboard → **Authentication** → **Providers**
2. Find **Google** and enable it
3. Paste the **Client ID** and **Client Secret**
4. Save

✅ **Google login is ready!**

---

## 8. Verify Everything Works

### Quick Health Check

After deploying, verify each component:

| Check | How | Expected Result |
|-------|-----|----------------|
| Landing page loads | Visit your URL | Beautiful landing page with CTA |
| Signup works | Create a new account | Redirected to onboarding |
| Onboarding saves | Complete the 4 steps | Data visible in Supabase `users` table |
| Scenarios load | Go to /practice | 10 scenario cards displayed |
| AI chat works | Start a session, send a message | AI responds with coaching sidebar |
| Scorecard generates | End a session | Skill scores displayed |
| Dashboard shows data | Visit /dashboard | Radar chart + recent sessions |

### Check Supabase Data

1. Go to Supabase → **Table Editor**
2. After testing, you should see:
   - Your user in `users` table with `has_onboarded = true`
   - Practice sessions in `sessions` table
   - Messages in `messages` table
   - Skill scores in `skill_scores` table

---

## 9. Ongoing Costs & Monitoring

### Monthly Cost Breakdown

| Service | Free Tier Limit | When You'll Pay |
|---------|----------------|----------------|
| **Vercel** | 100GB bandwidth, 100hrs compute | Hobby is free; Pro at $20/mo if you exceed |
| **Supabase** | 500MB database, 50K auth users, 1GB storage | Pro at $25/mo for more |
| **OpenAI** | Pay-per-use only | ~$0.02-0.05 per conversation exchange |
| **Domain** (optional) | N/A | ~$12/year |

### Estimated Monthly Costs by Usage

| Users | Sessions/Month | OpenAI Cost | Total |
|-------|---------------|-------------|-------|
| 10 | ~100 | ~$5 | ~$5 |
| 50 | ~500 | ~$25 | ~$25 |
| 200 | ~2,000 | ~$100 | ~$125 (Supabase Pro) |
| 1,000+ | ~10,000 | ~$500 | Time to monetize! |

### Monitor Your Spending

- **OpenAI**: https://platform.openai.com/usage — check daily
- **Supabase**: Dashboard → **Settings** → **Billing**
- **Vercel**: Dashboard → **Usage**

Set up email alerts for billing thresholds on all three platforms.

---

## 10. Troubleshooting

### "Missing Supabase environment variables"
→ Your `.env.local` file is missing or has placeholder values. Double-check Step 4.1.

### "OpenAI API key invalid"
→ Your key may have expired or been deleted. Create a new one at https://platform.openai.com/api-keys

### Login/signup not working
→ Check Supabase → **Authentication** → **URL Configuration**. Your redirect URLs must match your app URL.

### AI responses are empty or error
→ Check that your OpenAI account has billing set up and hasn't exceeded the usage limit.

### Scenarios page is empty
→ The seed data wasn't loaded. Re-run `supabase/seed.sql` in the Supabase SQL Editor (Step 2.4).

### Database tables don't exist
→ Re-run `supabase/migrations/001_initial_schema.sql` in the SQL Editor (Step 2.3).

### Build fails on Vercel
→ Make sure all 4 environment variables are set in Vercel project settings (Step 6.2).

### Google login shows error
→ Verify the redirect URI in Google Cloud Console matches `https://YOUR-PROJECT.supabase.co/auth/v1/callback` exactly.

---

## Quick Reference Card

```
┌─────────────────────────────────────────────────┐
│              CUETIE QUICK REFERENCE              │
├─────────────────────────────────────────────────┤
│                                                 │
│  Local development:  npm run dev                │
│  Production build:   npm run build              │
│  Start production:   npm start                  │
│                                                 │
│  App URL:            http://localhost:3000       │
│  Supabase:           supabase.com/dashboard     │
│  OpenAI Usage:       platform.openai.com/usage  │
│  Vercel Dashboard:   vercel.com/dashboard       │
│                                                 │
│  Key files:                                     │
│  ├── .env.local        (API keys — SECRET)      │
│  ├── supabase/         (database SQL)           │
│  ├── app/              (pages & API routes)     │
│  ├── components/       (UI components)          │
│  └── lib/              (AI engine & utilities)  │
│                                                 │
└─────────────────────────────────────────────────┘
```
