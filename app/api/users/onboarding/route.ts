import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"

const onboardingSchema = z.object({
  display_name: z.string().min(1, "Display name is required"),
  onboarding_profile: z.object({
    challenges: z.array(z.string()).optional(),
    goals: z.array(z.string()).optional(),
    preferred_coaching_style: z
      .enum(["gentle", "direct", "detailed"])
      .optional(),
  }),
})

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    )
  }

  let validated: z.infer<typeof onboardingSchema>
  try {
    validated = onboardingSchema.parse(body)
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    )
  }

  const { data, error } = await supabase
    .from("users")
    .update({
      display_name: validated.display_name,
      onboarding_profile: validated.onboarding_profile,
      has_onboarded: true,
    })
    .eq("id", user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data)
}
