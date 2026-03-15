"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Message, CoachingData } from "@/lib/types/database";
import type { AudioFeatures, VoiceCoaching } from "@/lib/ai/voice-coaching";
import type {
  HumeAnalysisResponse,
  HumeEmotionResult,
} from "@/lib/types/hume";

interface UseChatReturn {
  messages: Message[];
  coaching: CoachingData | null;
  voiceCoaching: VoiceCoaching | null;
  humeEmotions: HumeEmotionResult | null;
  humeAnalysisLimitReached: boolean;
  humeAnalysesUsed: number;
  isLoading: boolean;
  isStreaming: boolean;
  streamingText: string;
  error: string | null;
  sessionWarning: string | null;
  sessionLimitReached: boolean;
  sendMessage: (
    content: string,
    audioFeatures?: AudioFeatures | null,
    humeEmotionsOverride?: HumeEmotionResult | null
  ) => Promise<string | null>;
  sendVoiceMessage: (audioBlob: Blob, audioFeatures?: AudioFeatures | null) => Promise<string | null>;
  loadMessages: (sessionId: string) => Promise<void>;
}

export function useChat(sessionId: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [coaching, setCoaching] = useState<CoachingData | null>(null);
  const [voiceCoaching, setVoiceCoaching] = useState<VoiceCoaching | null>(null);
  const [humeEmotions, setHumeEmotions] = useState<HumeEmotionResult | null>(null);
  const [humeAnalysisLimitReached, setHumeAnalysisLimitReached] = useState(false);
  const [humeAnalysesUsed, setHumeAnalysesUsed] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [sessionWarning, setSessionWarning] = useState<string | null>(null);
  const [sessionLimitReached, setSessionLimitReached] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const pendingVoiceCoachingRef = useRef<VoiceCoaching | null>(null);

  const mergeVoiceTone = useCallback((nextCoaching: CoachingData): CoachingData => {
    const voiceTone = pendingVoiceCoachingRef.current?.tone;

    if (!voiceTone || nextCoaching.voice_tone) {
      return nextCoaching;
    }

    return {
      ...nextCoaching,
      voice_tone: voiceTone,
    };
  }, []);

  const loadMessages = useCallback(async (sid: string) => {
    setVoiceCoaching(null);

    try {
      const res = await fetch(`/api/sessions/${sid}`);
      if (!res.ok) throw new Error("Failed to load session");
      const data = await res.json();
      setMessages(data.messages ?? []);
      if (data.messages?.length) {
        const lastPartner = [...(data.messages as Message[])]
          .reverse()
          .find((m) => m.role === "partner" && m.coaching);
        if (lastPartner?.coaching) setCoaching(lastPartner.coaching);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load messages");
    }
  }, []);

  useEffect(() => {
    if (sessionId) loadMessages(sessionId);
    return () => abortRef.current?.abort();
  }, [sessionId, loadMessages]);

  const sendMessage = useCallback(
    async (
      content: string,
      audioFeatures?: AudioFeatures | null,
      humeEmotionsOverride?: HumeEmotionResult | null
    ): Promise<string | null> => {
      if (!content.trim() || isLoading) return null;

      setError(null);
      if (!pendingVoiceCoachingRef.current) {
        setVoiceCoaching(null);
      }
      setIsLoading(true);
      setIsStreaming(false);
      setStreamingText("");

      // Optimistically add user message
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        session_id: sessionId,
        role: "user",
        content: content.trim(),
        coaching: null,
        token_count: 0,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      try {
        abortRef.current = new AbortController();
        const resolvedHumeEmotions = humeEmotionsOverride ?? humeEmotions;
        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            content: content.trim(),
            ...(audioFeatures ? { audioFeatures } : {}),
            ...(resolvedHumeEmotions ? { humeEmotions: resolvedHumeEmotions } : {}),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.error?.message ?? "Failed to send message");
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        setIsStreaming(true);
        const decoder = new TextDecoder();
        let accumulated = "";
        let partnerCoaching: CoachingData | null = null;
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          // Keep the last incomplete line in the buffer
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed || !trimmed.startsWith("data:")) continue;

            const payload = trimmed.slice(5).trim();
            if (payload === "[DONE]") continue;

            try {
              const event = JSON.parse(payload);

              switch (event.type) {
                case "token":
                  accumulated += event.content;
                  setStreamingText(accumulated);
                  break;
                case "coaching":
                  partnerCoaching = mergeVoiceTone(event.data as CoachingData);
                  setCoaching(partnerCoaching);
                  break;
                case "session_warning":
                  setSessionWarning(event.message ?? "You're nearing the end of this round.");
                  break;
                case "session_limit":
                  setSessionLimitReached(true);
                  setSessionWarning(null);
                  throw new Error("SESSION_LIMIT_REACHED");
                case "error":
                  throw new Error(event.message ?? "Stream error");
                case "done":
                  if (event.partner_response) {
                    accumulated = event.partner_response;
                  }
                  break;
              }
            } catch (parseErr) {
              // Skip unparseable lines (may be partial JSON)
              if (parseErr instanceof Error && parseErr.message === "Stream error") {
                throw parseErr;
              }
            }
          }
        }

        // Add completed partner message
        const partnerMessage: Message = {
          id: `partner-${Date.now()}`,
          session_id: sessionId,
          role: "partner",
          content: accumulated,
          coaching: partnerCoaching,
          token_count: 0,
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, partnerMessage]);
        return accumulated;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError")
          return null;
        setError(err instanceof Error ? err.message : "Something went wrong");
        return null;
      } finally {
        setIsLoading(false);
        setIsStreaming(false);
        setStreamingText("");
        abortRef.current = null;
      }
    },
    [sessionId, isLoading, mergeVoiceTone, humeEmotions]
  );

  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob, audioFeatures?: AudioFeatures | null): Promise<string | null> => {
      if (isLoading) return null;

      setError(null);

      try {
        // --- Transcribe audio ---
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("sessionId", sessionId);
        if (audioFeatures) {
          formData.append("audioFeatures", JSON.stringify(audioFeatures));
        }

        const transcribeRes = await fetch("/api/voice/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!transcribeRes.ok) {
          const errData = await transcribeRes.json().catch(() => null);
          throw new Error(
            errData?.error?.message ?? "Failed to transcribe audio"
          );
        }

        const {
          text,
          voice_coaching,
          audioFeatures: transcribedAudioFeatures,
        } = (await transcribeRes.json()) as {
          text?: string;
          voice_coaching?: VoiceCoaching | null;
          audioFeatures?: AudioFeatures | null;
        };
        if (!text) throw new Error("Could not understand the audio");

        pendingVoiceCoachingRef.current = voice_coaching ?? null;
        setVoiceCoaching(voice_coaching ?? null);

        const humeFormData = new FormData();
        humeFormData.append("audio", audioBlob, "recording.webm");
        humeFormData.append("sessionId", sessionId);

        const humePromise: Promise<HumeAnalysisResponse | null> = fetch(
          "/api/voice/analyze-emotion",
          {
            method: "POST",
            body: humeFormData,
          }
        )
          .then((response) => (response.ok ? response.json() : null))
          .catch(() => null);

        // --- Send transcribed text through normal chat pipeline with audio features ---
        const [partnerResponse, humeResult] = await Promise.all([
          sendMessage(text, transcribedAudioFeatures ?? audioFeatures),
          humePromise,
        ]);

        if (humeResult?.status === "available" && humeResult.result) {
          setHumeEmotions(humeResult.result);
          setHumeAnalysisLimitReached(false);
          setHumeAnalysesUsed((prev) => prev + 1);
        } else if (humeResult?.status === "limit_reached") {
          setHumeAnalysisLimitReached(true);
        }

        // --- Synthesize TTS for the partner response ---
        if (partnerResponse) {
          const synthRes = await fetch("/api/voice/synthesize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              text: partnerResponse,
              sessionId,
            }),
          });

          if (synthRes.ok) {
            const audioBlob = await synthRes.blob();
            return URL.createObjectURL(audioBlob);
          }
        }

        return null;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError")
          return null;
        setError(err instanceof Error ? err.message : "Voice message failed");
        return null;
      } finally {
        pendingVoiceCoachingRef.current = null;
      }
    },
    [sessionId, isLoading, sendMessage]
  );

  return {
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
    sessionWarning,
    sessionLimitReached,
    sendMessage,
    sendVoiceMessage,
    loadMessages,
  };
}
