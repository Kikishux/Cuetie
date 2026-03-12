"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Message, CoachingData } from "@/lib/types/database";

interface UseChatReturn {
  messages: Message[];
  coaching: CoachingData | null;
  isLoading: boolean;
  isStreaming: boolean;
  streamingText: string;
  error: string | null;
  sendMessage: (content: string) => Promise<string | null>;
  sendVoiceMessage: (audioBlob: Blob) => Promise<string | null>;
  loadMessages: (sessionId: string) => Promise<void>;
}

export function useChat(sessionId: string): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [coaching, setCoaching] = useState<CoachingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const loadMessages = useCallback(async (sid: string) => {
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
    async (content: string): Promise<string | null> => {
      if (!content.trim() || isLoading) return null;

      setError(null);
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
        const res = await fetch("/api/chat/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, content: content.trim() }),
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
                  partnerCoaching = event.data as CoachingData;
                  setCoaching(partnerCoaching);
                  break;
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
    [sessionId, isLoading]
  );

  const sendVoiceMessage = useCallback(
    async (audioBlob: Blob): Promise<string | null> => {
      if (isLoading) return null;

      setError(null);

      try {
        // --- Transcribe audio ---
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("sessionId", sessionId);

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

        const { text } = await transcribeRes.json();
        if (!text) throw new Error("Could not understand the audio");

        // --- Send transcribed text through normal chat pipeline ---
        const partnerResponse = await sendMessage(text);

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
      }
    },
    [sessionId, isLoading, sendMessage]
  );

  return {
    messages,
    coaching,
    isLoading,
    isStreaming,
    streamingText,
    error,
    sendMessage,
    sendVoiceMessage,
    loadMessages,
  };
}
