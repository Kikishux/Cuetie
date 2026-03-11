"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"

export default function OnboardingPage() {
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function checkOnboardingStatus() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.replace("/login")
        return
      }

      const { data: userRow } = await supabase
        .from("users")
        .select("has_onboarded")
        .eq("id", user.id)
        .single()

      if (userRow?.has_onboarded) {
        router.replace("/dashboard")
        return
      }

      setReady(true)
    }

    checkOnboardingStatus()
  }, [router, supabase])

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Image
            src="/logo.png"
            alt="Cuetie"
            width={64}
            height={64}
            className="h-16 w-16 animate-pulse"
          />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <OnboardingWizard />
    </div>
  )
}
