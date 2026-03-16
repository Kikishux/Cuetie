import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import ProfileEnrichmentForm from "@/components/profile/ProfileEnrichmentForm"
import type { ProfileEnrichment } from "@/lib/types/profile"

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/login")

  const { data } = await supabase
    .from("users")
    .select("profile_enrichment")
    .eq("id", user.id)
    .single()

  const initialData = (data?.profile_enrichment as ProfileEnrichment | null) ?? undefined

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-16">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Your Profile</h1>
        <p className="mt-1 text-muted-foreground">
          Help people understand how to connect with you.
        </p>
      </div>
      <ProfileEnrichmentForm initialData={initialData} />
    </div>
  )
}
