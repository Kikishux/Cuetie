"use client"

import { Timer, MessageCircle, Flame } from "lucide-react"
import { motion } from "framer-motion"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StreakTrackerProps {
  streak: number
  totalSessions: number
  totalMinutes: number
  practicedDays?: boolean[]
}

const DAY_LABELS = ["M", "T", "W", "T", "F", "S", "S"]

function getEncouragement(streak: number): string {
  if (streak === 0) return "Start practicing to build your streak!"
  if (streak === 1) return "Great start — keep it going tomorrow! 🌟"
  if (streak < 4) return "You're building momentum! 💪"
  if (streak < 7) return "Amazing consistency — almost a full week! 🌈"
  if (streak < 14) return "Incredible dedication! You're on fire! 🔥"
  return "Unstoppable! Your growth is inspiring! 🏆"
}

function formatMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export function StreakTracker({
  streak,
  totalSessions,
  totalMinutes,
  practicedDays = Array(7).fill(false),
}: StreakTrackerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.2 }}
    >
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-lg">Your Streak</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Streak counter */}
          <div className="flex items-center justify-center gap-2">
            <motion.div
              animate={streak > 0 ? { scale: [1, 1.15, 1] } : undefined}
              transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
            >
              <Flame
                className={cn(
                  "size-8",
                  streak > 0
                    ? "text-orange-500 drop-shadow-[0_0_6px_rgba(249,115,22,0.4)]"
                    : "text-muted-foreground/40"
                )}
              />
            </motion.div>
            <span className="text-3xl font-bold tabular-nums">{streak}</span>
            <span className="text-sm text-muted-foreground">
              {streak === 1 ? "day" : "days"}
            </span>
          </div>

          {/* Last 7 days dots */}
          <div className="flex justify-center gap-2">
            {practicedDays.map((practiced, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "size-5 rounded-full border-2 transition-colors",
                    practiced
                      ? "border-pink-400 bg-pink-400 dark:border-pink-500 dark:bg-pink-500"
                      : "border-muted-foreground/20 bg-transparent"
                  )}
                />
                <span className="text-[10px] text-muted-foreground">
                  {DAY_LABELS[i]}
                </span>
              </div>
            ))}
          </div>

          {/* Encouragement */}
          <p className="text-center text-sm text-muted-foreground">
            {getEncouragement(streak)}
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <MessageCircle className="size-4 text-pink-500" />
              <div>
                <p className="text-lg font-semibold leading-tight tabular-nums">
                  {totalSessions}
                </p>
                <p className="text-[11px] text-muted-foreground">Sessions</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
              <Timer className="size-4 text-primary" />
              <div>
                <p className="text-lg font-semibold leading-tight tabular-nums">
                  {formatMinutes(totalMinutes)}
                </p>
                <p className="text-[11px] text-muted-foreground">Practice</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
