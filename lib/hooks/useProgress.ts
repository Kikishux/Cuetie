"use client"

import { useState, useEffect } from "react"
import type { SkillId } from "@/lib/types/database"

interface SkillProgress {
  currentScore: number
  previousScore: number | null
  trend: "up" | "down" | "stable"
  history: { date: string; score: number }[]
}

interface RecentSession {
  id: string
  scenario_title: string
  overall_score: number
  completed_at: string
  skills_improved: string[]
}

interface ProgressData {
  displayName: string | null
  skills: Record<SkillId, SkillProgress>
  sessionsCompleted: number
  totalMinutes: number
  streak: number
  practicedDays: boolean[]
  recentSessions: RecentSession[]
  isLoading: boolean
  error: string | null
}

export function useProgress(): ProgressData {
  const [data, setData] = useState<Omit<ProgressData, "isLoading" | "error">>({
    displayName: null,
    skills: {} as Record<SkillId, SkillProgress>,
    sessionsCompleted: 0,
    totalMinutes: 0,
    streak: 0,
    practicedDays: Array(7).fill(false),
    recentSessions: [],
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function fetchProgress() {
      try {
        const res = await fetch("/api/progress")
        if (!res.ok) {
          throw new Error(
            res.status === 401
              ? "Please sign in to view your progress"
              : "Failed to load progress data"
          )
        }
        const json = await res.json()
        if (!cancelled) {
          setData(json)
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Something went wrong"
          )
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    fetchProgress()
    return () => {
      cancelled = true
    }
  }, [])

  return { ...data, isLoading, error }
}

export type { SkillProgress, RecentSession, ProgressData }
