# Cuetie — TODO List

## Test / Demo Accounts

| Account | Email | Password | Status |
|---------|-------|----------|--------|
| Alex | `demo.alex@cuetie.test` | `CuetieDemo2026!` | Fresh (needs onboarding) |
| Sam | `demo.sam@cuetie.test` | `CuetieDemo2026!` | Fresh (needs onboarding) |
| Jordan | `demo.jordan@cuetie.test` | `CuetieDemo2026!` | Fresh (needs onboarding) |

> **Note:** Your existing account `demo@cuetietest.com` is already onboarded and has dashboard data.

---

## Re-enable "Continue with Google" login

**Why it was removed:** The Google OAuth provider is not enabled in the Supabase project. Clicking the button redirected to Supabase which returned a raw JSON error: `"Unsupported provider: provider is not enabled"`.

**Steps to re-enable:**

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

**Then re-add the button in code:**

File: `app/(auth)/login/page.tsx`

- Add `import { Separator } from "@/components/ui/separator"` back
- Add the `handleGoogleAuth` function back inside the component:

```tsx
async function handleGoogleAuth() {
  setError(null)
  const { error: oauthError } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/onboarding`,
    },
  })
  if (oauthError) setError(oauthError.message)
}
```

- Add the button + divider back before the email form inside `<CardContent>`:

```tsx
{/* Google OAuth */}
<Button
  variant="outline"
  className="w-full gap-2.5 font-medium"
  onClick={handleGoogleAuth}
  disabled={loading}
>
  <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
  Continue with Google
</Button>

{/* Divider */}
<div className="relative flex items-center py-1">
  <Separator className="flex-1" />
  <span className="mx-3 text-xs font-medium text-muted-foreground">
    or continue with email
  </span>
  <Separator className="flex-1" />
</div>
```

## Premium Test User

Sam (`demo.sam@cuetie.test`) should be set to premium tier for testing:
```sql
UPDATE public.users SET subscription_tier = 'premium' WHERE email = 'demo.sam@cuetie.test';
```
