"use client"

import { useProgress } from "@/lib/hooks/useProgress"
import { WelcomeCard } from "@/components/dashboard/WelcomeCard"
import { SkillRadarChart } from "@/components/dashboard/SkillRadarChart"
import { StreakTracker } from "@/components/dashboard/StreakTracker"
import { RecentSessions } from "@/components/dashboard/RecentSessions"

function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Welcome skeleton */}
      <div className="h-28 rounded-xl bg-muted/60" />
      {/* Grid skeleton */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-80 rounded-xl bg-muted/60" />
        <div className="h-80 rounded-xl bg-muted/60" />
      </div>
      {/* Recent skeleton */}
      <div className="h-64 rounded-xl bg-muted/60" />
    </div>
  )
}

export default function DashboardPage() {
  const {
    displayName,
    skills,
    sessionsCompleted,
    totalMinutes,
    streak,
    practicedDays,
    recentSessions,
    isLoading,
    error,
  } = useProgress()

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <DashboardSkeleton />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-6">
      <WelcomeCard
        displayName={displayName}
        sessionsCompleted={sessionsCompleted}
        streak={streak}
      />

      <div className="grid gap-6 md:grid-cols-2">
        <SkillRadarChart skills={skills} />
        <StreakTracker
          streak={streak}
          totalSessions={sessionsCompleted}
          totalMinutes={totalMinutes}
          practicedDays={practicedDays}
        />
      </div>

      <RecentSessions sessions={recentSessions} />
    </div>
  )
}
