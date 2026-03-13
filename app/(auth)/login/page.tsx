"use client"

import { useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleEmailAuth(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError

        if (!data.session) {
          setMessage("Check your email to confirm your account!")
          setLoading(false)
          return
        }

        router.push("/onboarding")
      } else {
        const { data, error: signInError } =
          await supabase.auth.signInWithPassword({ email, password })
        if (signInError) throw signInError

        const { data: userRow } = await supabase
          .from("users")
          .select("has_onboarded")
          .eq("id", data.user.id)
          .single()

        router.push(userRow?.has_onboarded ? "/dashboard" : "/onboarding")
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Something went wrong. Try again."
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  async function handleGoogleAuth() {
    setError(null)
    setLoading(true)
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/onboarding`,
      },
    })
    if (oauthError) {
      setError(
        oauthError.message === "Unsupported provider: provider is not enabled"
          ? "Google sign-in is not yet available. Please use email instead."
          : oauthError.message
      )
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto">
            <Image
              src="/logo.png"
              alt="Cuetie"
              width={80}
              height={80}
              className="h-20 w-20"
            />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              Cuetie
            </CardTitle>
            <CardDescription className="mt-1.5 text-sm">
              {isSignUp
                ? "Create your account to start your journey"
                : "Welcome back! Sign in to continue growing"}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Google OAuth */}
          <Button
            variant="outline"
            className="w-full gap-2.5 border-primary/20 bg-primary/[0.04] font-medium hover:bg-primary/[0.08] hover:text-foreground"
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

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setEmail(e.target.value)
                }
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder={isSignUp ? "Create a password" : "Your password"}
                value={password}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPassword(e.target.value)
                }
                required
                minLength={6}
                autoComplete={isSignUp ? "new-password" : "current-password"}
              />
            </div>

            {error && (
              <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            {message && (
              <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full font-medium"
              disabled={loading}
            >
              {loading
                ? "One moment…"
                : isSignUp
                  ? "Create Account"
                  : "Sign In"}
            </Button>
          </form>
        </CardContent>

        <CardFooter className="justify-center pb-6">
          <button
            type="button"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            onClick={() => {
              setIsSignUp(!isSignUp)
              setError(null)
              setMessage(null)
            }}
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </CardFooter>
      </Card>
    </div>
  )
}
