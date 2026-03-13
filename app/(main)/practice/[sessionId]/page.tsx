"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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
} from "lucide-react";
import { useChat } from "@/lib/hooks/useChat";
import { useAudioPlayer } from "@/lib/hooks/useAudioPlayer";
import ConversationPanel from "@/components/chat/ConversationPanel";
import CoachingPanel from "@/components/chat/CoachingPanel";
import { HUME_FREE_PREVIEW_LIMIT } from "@/lib/subscription";
import type { Scenario, Session } from "@/lib/types/database";

export default function SessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;

  const [session, setSession] = useState<Session | null>(null);
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [subscriptionTier, setSubscriptionTier] = useState<"free" | "premium">("free");
  const [ending, setEnding] = useState(false);
  const [mobileCoachingOpen, setMobileCoachingOpen] = useState(false);

  const {
    messages,
    coaching,
    humeEmotions,
    humeAnalysisLimitReached,
    humeAnalysesUsed,
    isLoading,
    isStreaming,
    streamingText,
    error,
    sendMessage,
    sendVoiceMessage,
  } = useChat(sessionId);

  const audioPlayer = useAudioPlayer();

  // Voice mode can be toggled within a session — default to the session mode
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  useEffect(() => {
    if (session?.mode === "voice") setVoiceEnabled(true);
  }, [session?.mode]);

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

  const handleEndSession = async () => {
    if (ending) return;
    setEnding(true);
    try {
      const res = await fetch(`/api/sessions/${sessionId}/end`, {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to end session");
      router.push(`/practice/${sessionId}/score`);
    } catch {
      setEnding(false);
    }
  };

  const partnerName = scenario?.partner_persona?.name ?? "Partner";
  const isPremiumUser = subscriptionTier === "premium";

  return (
    <div className="flex h-[calc(100vh-5rem)] flex-col">
      {/* Session header */}
      <div className="flex items-center justify-between border-b px-4 py-2.5">
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
            </h2>
            <p className="text-xs text-muted-foreground">
              {voiceEnabled ? "Speaking" : "Chatting"} with{" "}
              <span className="font-medium text-foreground">{partnerName}</span>
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
            sessionScores={coaching?.skill_scores}
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
                sessionScores={coaching?.skill_scores}
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
