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
