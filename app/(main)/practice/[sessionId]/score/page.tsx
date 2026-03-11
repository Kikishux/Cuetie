"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import SessionScorecard from "@/components/chat/SessionScorecard";
import type { Scorecard, Session } from "@/lib/types/database";

export default function ScorePage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [scorecard, setScorecard] = useState<Scorecard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchScore() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error("Failed to load session");
        const data = await res.json();
        const session: Session = data.session ?? data;
        if (session.scorecard) {
          setScorecard(session.scorecard);
        } else {
          setError("No scorecard available for this session.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) fetchScore();
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
      />
    </div>
  );
}
