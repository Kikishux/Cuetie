import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import type { SkillId } from "@/lib/types/database"

const SKILL_IDS: SkillId[] = [
  "empathy",
  "question_quality",
  "topic_flow",
  "cue_detection",
  "tone_matching",
  "conversation_pacing",
  "self_disclosure",
  "active_listening",
]

function calculateStreak(sessions: { started_at: string }[]): number {
  if (sessions.length === 0) return 0

  const uniqueDays = [
    ...new Set(
      sessions.map((s) =>
        new Date(s.started_at).toISOString().slice(0, 10)
      )
    ),
  ].sort((a, b) => b.localeCompare(a))

  const today = new Date().toISOString().slice(0, 10)
  const yesterday = new Date(Date.now() - 86_400_000)
    .toISOString()
    .slice(0, 10)

  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0

  let streak = 1
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1])
    const curr = new Date(uniqueDays[i])
    const diffMs = prev.getTime() - curr.getTime()
    if (diffMs <= 86_400_000) {
      streak++
    } else {
      break
    }
  }
  return streak
}

function getPracticedDays(sessions: { started_at: string }[]): boolean[] {
  const days: boolean[] = Array(7).fill(false)
  const now = new Date()

  for (let i = 0; i < 7; i++) {
    const day = new Date(now.getTime() - i * 86_400_000)
      .toISOString()
      .slice(0, 10)
    days[6 - i] = sessions.some(
      (s) => new Date(s.started_at).toISOString().slice(0, 10) === day
    )
  }
  return days
}

export async function GET() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const [scoresResult, sessionsResult, profileResult] = await Promise.all([
    supabase
      .from("skill_scores")
      .select("*")
      .eq("user_id", user.id)
      .order("measured_at", { ascending: true }),
    supabase
      .from("sessions")
      .select("*, scenarios(title, category)")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("ended_at", { ascending: false }),
    supabase
      .from("users")
      .select("display_name")
      .eq("id", user.id)
      .single(),
  ])

  const scores = scoresResult.data ?? []
  const sessions = sessionsResult.data ?? []
  const displayName = profileResult.data?.display_name ?? null

  // Build per-skill data
  const skills: Record<
    string,
    {
      currentScore: number
      previousScore: number | null
      trend: "up" | "down" | "stable"
      history: { date: string; score: number }[]
    }
  > = {}

  for (const skillId of SKILL_IDS) {
    const skillScores = scores.filter(
      (s: { skill_id: string }) => s.skill_id === skillId
    )

    if (skillScores.length === 0) {
      skills[skillId] = {
        currentScore: 0,
        previousScore: null,
        trend: "stable",
        history: [],
      }
      continue
    }

    const current = skillScores[skillScores.length - 1].score
    const previous =
      skillScores.length > 1
        ? skillScores[skillScores.length - 2].score
        : null

    let trend: "up" | "down" | "stable" = "stable"
    if (previous !== null) {
      if (current > previous) trend = "up"
      else if (current < previous) trend = "down"
    }

    skills[skillId] = {
      currentScore: current,
      previousScore: previous,
      trend,
      history: skillScores.map(
        (s: { measured_at: string; score: number }) => ({
          date: s.measured_at,
          score: s.score,
        })
      ),
    }
  }

  // Total practice minutes
  let totalMinutes = 0
  for (const session of sessions) {
    if (session.ended_at && session.started_at) {
      const diff =
        new Date(session.ended_at).getTime() -
        new Date(session.started_at).getTime()
      totalMinutes += Math.round(diff / 60_000)
    }
  }

  // Recent sessions
  const recentSessions = sessions.slice(0, 5).map((s) => ({
    id: s.id,
    scenario_title: s.scenarios?.title ?? "Practice Session",
    overall_score: s.scorecard?.overall_score ?? 0,
    completed_at: s.ended_at ?? s.started_at,
    skills_improved:
      s.scorecard?.skills
        ? Object.entries(s.scorecard.skills)
            .filter(
              ([, v]) =>
                (v as { trend: string }).trend === "up"
            )
            .map(([k]) => k)
        : [],
  }))

  return NextResponse.json({
    displayName,
    skills,
    sessionsCompleted: sessions.length,
    totalMinutes,
    streak: calculateStreak(sessions),
    practicedDays: getPracticedDays(sessions),
    recentSessions,
  })
}
