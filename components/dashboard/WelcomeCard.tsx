"use client"

import Link from "next/link"
import { Sparkles } from "lucide-react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
} from "@/components/ui/card"

interface WelcomeCardProps {
  displayName: string | null
  sessionsCompleted: number
  streak: number
}

export function WelcomeCard({
  displayName,
  sessionsCompleted,
  streak,
}: WelcomeCardProps) {
  const isNewUser = sessionsCompleted === 0
  const greeting = displayName
    ? `Welcome back, ${displayName}!`
    : "Ready to practice?"

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="border-none bg-muted/30 dark:bg-muted/20">
        <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <h2 className="text-2xl font-bold tracking-tight">{greeting}</h2>
            {isNewUser ? (
              <p className="text-muted-foreground">
                Start your first practice session and build your dating
                communication skills!
              </p>
            ) : (
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {streak > 0 && (
                  <span className="flex items-center gap-1 font-medium text-orange-600 dark:text-orange-400">
                    🔥 {streak} day streak
                  </span>
                )}
                <span>
                  {sessionsCompleted}{" "}
                  {sessionsCompleted === 1 ? "session" : "sessions"} completed
                </span>
              </div>
            )}
          </div>

          <Link href="/practice">
            <Button
              size="lg"
              className="gap-2 shadow-sm"
            >
              <Sparkles className="size-4" />
              {isNewUser ? "Start Your First Session" : "Start Practicing"}
            </Button>
          </Link>
        </CardContent>
      </Card>
    </motion.div>
  )
}
