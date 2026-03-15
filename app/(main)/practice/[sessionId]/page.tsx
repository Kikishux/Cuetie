"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  LogOut,
  Mic,
  MessageCircle,
  BrainCircuit,
  X,
  Clock,
  Loader2,
} from "lucide-react";
import { useChat } from "@/lib/hooks/useChat";
import { useAudioPlayer } from "@/lib/hooks/useAudioPlayer";
import ConversationPanel from "@/components/chat/ConversationPanel";
import CoachingPanel from "@/components/chat/CoachingPanel";
import { HUME_FREE_PREVIEW_LIMIT } from "@/lib/subscription";
import type { Scenario, Session, RoundType } from "@/lib/types/database";
import { getSessionLimits, getElapsedSeconds } from "@/lib/types/database";

const VALID_ROUNDS = new Set<string>(["quick", "standard", "deep"]);

export default function SessionPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    }>
      <SessionPageInner />
    </Suspense>
  );
}

function SessionPageInner() {
  const params = useParams<{ sessionId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = params.sessionId;

  // Read round type from URL query param (set during session start), fall back to session DB value
  const roundFromUrl = searchParams.get("round");
  const resolvedRound: RoundType =
    roundFromUrl && VALID_ROUNDS.has(roundFromUrl) ? (roundFromUrl as RoundType) : "standard";

  const [session, setSession] = useState<Session | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "premium">("free");
  const [ending, setEnding] = useState(false);
  const [mobileCoachingOpen, setMobileCoachingOpen] = useState(false);
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  const {
    messages,
    coaching,
    voiceCoaching,
    humeEmotions,
    humeAnalysisLimitReached,
    humeAnalysesUsed,
    isLoading,
    isStreaming,
    streamingText,
    error,
    sessionWarning: chatWarning,
    sessionLimitReached,
    sendMessage,
    sendVoiceMessage,
  } = useChat(sessionId, resolvedRound);

  const audioPlayer = useAudioPlayer();

  // Voice mode can be toggled within a session — default to the session mode
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const handleEndSession = useCallback(async () => {
    if (ending) return;
    setEnding(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/end`, {
        method: "POST",
      });
      if (!res.ok) {
        // Still redirect to score page — it handles missing scorecards gracefully
        console.warn("End session returned non-OK, redirecting to score page anyway");
      }
      router.push(`/practice/${sessionId}/score`);
    } catch {
      // Always redirect — scorecard page will show error if no scorecard exists
      router.push(`/practice/${sessionId}/score`);
    }
  }, [ending, sessionId, router]);

  useEffect(() => {
    if (session?.mode === "voice") setVoiceEnabled(true);
  }, [session?.mode]);

  // Sync chat warnings
  useEffect(() => {
    if (chatWarning) setSessionWarning(chatWarning);
  }, [chatWarning]);

  // Auto-end when session limit reached
  useEffect(() => {
    if (sessionLimitReached) {
      setSessionWarning("Round complete — let's review your session.");
      const timer = setTimeout(() => handleEndSession(), 2000);
      return () => clearTimeout(timer);
    }
  }, [sessionLimitReached, handleEndSession]);

  // Fetch session + scenario data
  useEffect(() => {
    async function fetchSession() {
      try {
        const res = await fetch(`/api/sessions/${sessionId}`);
        if (!res.ok) throw new Error("Failed to load session");
        const data = await res.json();
        setSession(data.session ?? data);
        setScenario(data.scenario ?? null);
        setSubscriptionTier(data.subscriptionTier === "premium" ? "premium" : "free");
      } catch {
        // Error handled by useChat
      }
    }
    if (sessionId) fetchSession();
  }, [sessionId]);

  // Timer: update time remaining every second
  useEffect(() => {
    if (!session || session.status !== "active") return;
    const limits = getSessionLimits(resolvedRound, session.mode);

    const interval = setInterval(() => {
      const elapsed = getElapsedSeconds(session.started_at);
      const remaining = Math.max(0, limits.max_duration_seconds - elapsed);

      if (remaining <= 0) {
        setTimeRemaining("0:00");
        handleEndSession();
        clearInterval(interval);
        return;
      }

      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      setTimeRemaining(`${mins}:${secs.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [session, handleEndSession]);

  // Inactivity auto-abandon: end session after 30 min of no interaction
  useEffect(() => {
    if (!session || session.status !== "active") return;

    let lastActivity = Date.now();
    const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const resetActivity = () => { lastActivity = Date.now(); };

    // Track user activity
    window.addEventListener("keydown", resetActivity);
    window.addEventListener("mousedown", resetActivity);
    window.addEventListener("touchstart", resetActivity);

    const checker = setInterval(() => {
      if (Date.now() - lastActivity >= INACTIVITY_TIMEOUT) {
        setSessionWarning("Session ended due to inactivity.");
        handleEndSession();
        clearInterval(checker);
      }
    }, 60_000); // Check every minute

    return () => {
      clearInterval(checker);
      window.removeEventListener("keydown", resetActivity);
      window.removeEventListener("mousedown", resetActivity);
      window.removeEventListener("touchstart", resetActivity);
    };
  }, [session, handleEndSession]);

  const partnerName = scenario?.partner_persona?.name ?? "Partner";
  const isPremiumUser = subscriptionTier === "premium";

  return (
    <div className="-mx-4 -mt-6 -mb-6 sm:-mx-6 lg:-mx-8 flex flex-col" style={{ height: "calc(100vh - 8rem)" }}>
      {/* Session header */}
      <div className="flex shrink-0 items-center justify-between border-b bg-background px-4 py-2.5">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => router.push("/practice")}
            aria-label="Back to scenarios"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold truncate flex items-center gap-1.5">
              {scenario?.title ?? "Loading…"}
              {voiceEnabled && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal gap-1">
                  🎤 Voice
                </Badge>
              )}
              {timeRemaining && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-normal gap-1">
                  <Clock className="h-3 w-3" />
                  {timeRemaining}
                </Badge>
              )}
            </h2>
            <p className="text-xs text-muted-foreground">
              {voiceEnabled ? "Speaking" : "Chatting"} with{" "}
              <span className="font-medium text-foreground">{partnerName}</span>
              {" · "}
              <span className="capitalize">{resolvedRound} round</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Voice mode toggle */}
          <Button
            variant={voiceEnabled ? "default" : "ghost"}
            size="icon"
            className="h-8 w-8"
            onClick={() => setVoiceEnabled((v) => !v)}
            aria-label={voiceEnabled ? "Switch to text mode" : "Switch to voice mode"}
          >
            <Mic className="h-4 w-4" />
          </Button>

          {/* Mobile coaching toggle */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 md:hidden"
            onClick={() => setMobileCoachingOpen(!mobileCoachingOpen)}
            aria-label="Toggle coaching panel"
          >
            <BrainCircuit className="h-4 w-4" />
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleEndSession}
            disabled={ending}
            className="gap-1.5 text-xs"
          >
            <LogOut className="h-3.5 w-3.5" />
            {ending ? "Ending…" : "End Session"}
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="border-b border-destructive/30 bg-destructive/5 px-4 py-2 text-xs text-destructive">
          {error}
        </div>
      )}

      {/* Session warning banner */}
      {sessionWarning && (
        <div className="border-b border-primary/20 bg-primary/5 px-4 py-2 text-xs text-primary flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 shrink-0" />
          {sessionWarning}
        </div>
      )}

      {/* Main content: conversation + coaching */}
      <div className="relative flex flex-1 overflow-hidden">
        {/* Conversation panel */}
        <div className="flex-1">
          <ConversationPanel
            messages={messages}
            streamingText={streamingText}
            isLoading={isLoading}
            onSendMessage={sendMessage}
            onSendVoiceMessage={voiceEnabled ? sendVoiceMessage : undefined}
            onPlayAudio={voiceEnabled ? (url) => audioPlayer.play(url) : undefined}
            partnerName={partnerName}
            voiceMode={voiceEnabled}
            humeAnalysesUsed={humeAnalysesUsed}
            humeAnalysesLimit={HUME_FREE_PREVIEW_LIMIT}
            isPremiumUser={isPremiumUser}
          />
        </div>

        {/* Coaching sidebar — desktop */}
        <div className="hidden w-80 shrink-0 border-l md:block">
          <CoachingPanel
            coaching={coaching}
            voiceCoaching={voiceCoaching}
            humeEmotions={humeEmotions}
            humeAnalysisLimitReached={humeAnalysisLimitReached}
          />
        </div>

        {/* Coaching panel — mobile slide-over */}
        {mobileCoachingOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/30 md:hidden"
              onClick={() => setMobileCoachingOpen(false)}
            />
            <div className="fixed inset-y-0 right-0 z-50 w-80 max-w-[85vw] border-l bg-background shadow-xl md:hidden">
              <div className="flex items-center justify-between border-b px-4 py-2.5">
                <span className="text-sm font-semibold flex items-center gap-1.5">
                  <BrainCircuit className="h-4 w-4" />
                  Coaching
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setMobileCoachingOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <CoachingPanel
                coaching={coaching}
                voiceCoaching={voiceCoaching}
                humeEmotions={humeEmotions}
                humeAnalysisLimitReached={humeAnalysisLimitReached}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
