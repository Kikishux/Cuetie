'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, MessageSquare } from 'lucide-react'
import { ConversationReview } from '@/components/chat/ConversationReview'
import type { Message, Scenario, Scorecard, SessionMode } from '@/lib/types/database'

export default function ReviewPage() {
  const { sessionId } = useParams<{ sessionId: string }>()
  const router = useRouter()
  const [messages, setMessages] = useState<Message[]>([])
  const [scenario, setScenario] = useState<Scenario | null>(null)
  const [scorecard, setScorecard] = useState<Scorecard | null>(null)
  const [sessionMode, setSessionMode] = useState<SessionMode>('text')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`)
        if (!res.ok) throw new Error('Failed to load session')
        const data = await res.json()

        if (cancelled) return

        setMessages(data.messages ?? [])
        setScenario(data.scenario ?? null)
        setScorecard(data.session?.scorecard ?? null)
        setSessionMode(data.session?.mode ?? 'text')
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Failed to load')
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    if (sessionId) {
      load()
    }

    return () => {
      cancelled = true
    }
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Loading conversation...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-destructive">{error}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            onClick={() => router.back()}
            className="rounded-lg p-2 transition-colors hover:bg-muted"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold">
              {scenario?.title ?? 'Practice Session'}
            </h1>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <MessageSquare className="h-3.5 w-3.5" />
              <span>{messages.length} messages</span>
              <span>·</span>
              <span className="capitalize">{sessionMode} mode</span>
              {scorecard && (
                <>
                  <span>·</span>
                  <span className="font-medium">
                    {scorecard.overall_score.toFixed(1)}/10 overall
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        <Link
          href={`/practice/${sessionId}/score`}
          className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
        >
          <FileText className="h-4 w-4" />
          View Scorecard
        </Link>
      </div>

      <ConversationReview
        messages={messages}
        sessionMode={sessionMode}
        partnerName={scenario?.partner_persona.name ?? 'Partner'}
      />
    </div>
  )
}
