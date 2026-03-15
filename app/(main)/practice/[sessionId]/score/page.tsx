"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import SessionScorecard from "@/components/chat/SessionScorecard";
import type { Scorecard, Session } from "@/lib/types/database";

const MAX_RETRIES = 8;
const RETRY_DELAY_MS = 2500;

export default function ScorePage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const retriesRef = useRef(0);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    async function fetchScore() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error("Failed to load session");
        const data = await res.json();
        const session: Session = data.session ?? data;

        if (cancelled) return;

        if (session.scorecard) {
          setScorecard(session.scorecard);
          setLoading(false);
        } else if (retriesRef.current < MAX_RETRIES) {
          // Scorecard not ready yet — retry after delay
          retriesRef.current += 1;
          setTimeout(() => {
            if (!cancelled) fetchScore();
          }, RETRY_DELAY_MS);
        } else {
          setError("Scorecard generation is taking longer than expected. Please check back from your dashboard.");
          setLoading(false);
        }
      } catch (err) {
        if (cancelled) return;
        if (retriesRef.current < MAX_RETRIES) {
          retriesRef.current += 1;
          setTimeout(() => {
            if (!cancelled) fetchScore();
          }, RETRY_DELAY_MS);
        } else {
          setError(err instanceof Error ? err.message : "Something went wrong");
          setLoading(false);
        }
      }
    }

    fetchScore();
    return () => { cancelled = true; };
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            Generating your scorecard…
          </p>
        </div>
      </div>
    );
  }

  if (error || !scorecard) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-2">
          <p className="text-sm text-destructive">{error ?? "No data"}</p>
          <button
            onClick={() => router.push("/practice")}
            className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Back to scenarios
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <SessionScorecard
        scorecard={scorecard}
        onNewSession={() => router.push("/practice")}
        onGoToDashboard={() => router.push("/dashboard")}
        reviewHref={`/practice/${sessionId}/review`}
      />
    </div>
  );
}
