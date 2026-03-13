"use client"

import Link from "next/link"
import { CalendarDays, ChevronRight, Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"

interface SessionItem {
  id: string
  scenario_title: string
  overall_score: number
  completed_at: string
  skills_improved: string[]
}

interface RecentSessionsProps {
  sessions: SessionItem[]
}

function scoreBadgeVariant(score: number) {
  if (score >= 7) return "default"
  if (score >= 5) return "secondary"
  return "outline"
}

function formatDate(iso: string) {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffDays = Math.floor(diffMs / 86_400_000)

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Yesterday"
  if (diffDays < 7) return `${diffDays} days ago`
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

const SKILL_SHORT: Record<string, string> = {
  empathy: "Empathy",
  question_quality: "Questions",
  topic_flow: "Flow",
  cue_detection: "Cues",
  tone_matching: "Tone",
  conversation_pacing: "Pacing",
  self_disclosure: "Sharing",
  active_listening: "Listening",
}

export function RecentSessions({ sessions }: RecentSessionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Recent Sessions</CardTitle>
        </CardHeader>
        <CardContent>
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-3xl">💬</p>
              <p className="text-sm text-muted-foreground">
                No sessions yet — start your first practice!
              </p>
              <Link href="/practice">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Sparkles className="size-3.5" />
                  Start Practicing
                </Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {sessions.map((session) => (
                <li
                  key={session.id}
                  className="-mx-2 flex items-center gap-3 rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
                >
                  <Link
                    href={`/practice/${session.id}/score`}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {session.scenario_title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="size-3" />
                          {formatDate(session.completed_at)}
                        </span>
                        {session.skills_improved.length > 0 && (
                          <span className="text-green-600 dark:text-green-400">
                            ↑{" "}
                            {session.skills_improved
                              .slice(0, 3)
                              .map((s) => SKILL_SHORT[s] ?? s)
                              .join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>

                  <div className="flex shrink-0 flex-col items-end gap-1.5">
                    <Link href={`/practice/${session.id}/score`}>
                      <Badge variant={scoreBadgeVariant(session.overall_score)}>
                        {session.overall_score.toFixed(1)}/10
                      </Badge>
                    </Link>
                    <Link
                      href={`/practice/${session.id}/review`}
                      className="text-[11px] font-medium text-primary hover:underline"
                    >
                      Review conversation
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}
