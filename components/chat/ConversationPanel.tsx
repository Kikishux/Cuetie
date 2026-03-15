"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, Mic, Square, MessageCircleHeart } from "lucide-react";
import MessageBubble from "@/components/chat/MessageBubble";
import { useSensoryOptional } from "@/components/shared/SensoryProvider";
import type { Message } from "@/lib/types/database";
import { useVoiceRecorder } from "@/lib/hooks/useVoiceRecorder";
import { useAudioAnalyzer } from "@/lib/hooks/useAudioAnalyzer";
import type { AudioFeatures } from "@/lib/ai/voice-coaching";

interface ConversationPanelProps {
  messages: Message[];
  streamingText: string;
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  onSendVoiceMessage?: (audioBlob: Blob, audioFeatures?: AudioFeatures | null) => Promise<string | null>;
  onPlayAudio?: (url: string) => void;
  partnerName: string;
  voiceMode?: boolean;
  humeAnalysesUsed?: number;
  humeAnalysesLimit?: number;
  isPremiumUser?: boolean;
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5 px-1">
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-3.5 py-2.5">
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
        <span className="typing-dot inline-block h-1.5 w-1.5 rounded-full bg-muted-foreground/60" />
      </div>
      <span className="text-xs text-muted-foreground">{name} is typing…</span>
    </div>
  );
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ConversationPanel({
  messages,
  streamingText,
  isLoading,
  onSendMessage,
  onSendVoiceMessage,
  onPlayAudio,
  partnerName,
  voiceMode = false,
  humeAnalysesUsed,
  humeAnalysesLimit,
  isPremiumUser = false,
}: ConversationPanelProps) {
  const [input, setInput] = useState("");
  const { shouldAutoplay } = useSensoryOptional();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const recorder = useVoiceRecorder();
  const analyzer = useAudioAnalyzer();

  // Connect analyzer when recording stream becomes available
  useEffect(() => {
    if (recorder.stream && recorder.state === "recording") {
      analyzer.connect(recorder.stream);
    }
  }, [recorder.stream, recorder.state, analyzer]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInput("");
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [input, isLoading, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Voice recording handlers
  const handleMicClick = useCallback(async () => {
    if (recorder.state === "recording") {
      recorder.stopRecording();
    } else {
      recorder.reset();
      await recorder.startRecording();
    }
  }, [recorder]);

  // Auto-send when recording stops and we have a blob
  useEffect(() => {
    if (recorder.audioBlob && recorder.state === "idle" && onSendVoiceMessage) {
      const blob = recorder.audioBlob;
      const audioFeats = analyzer.disconnect();
      recorder.reset();
      onSendVoiceMessage(blob, audioFeats).then((audioUrl) => {
        if (audioUrl && onPlayAudio && shouldAutoplay) onPlayAudio(audioUrl);
      });
    }
  }, [recorder.audioBlob, recorder.state, onSendVoiceMessage, onPlayAudio, recorder, shouldAutoplay]);

  const streamingMessage: Message | null =
    streamingText
      ? {
          id: "streaming",
          session_id: "",
          role: "partner",
          content: streamingText,
          coaching: null,
          token_count: 0,
          created_at: new Date().toISOString(),
        }
      : null;

  const isRecording = recorder.state === "recording";
  const resolvedHumeAnalysesLimit = humeAnalysesLimit ?? 3;

  return (
    <div className="flex h-full flex-col">
      {/* Messages area */}
      <ScrollArea className="flex-1 overflow-y-auto">
        <div className="flex flex-col gap-3 p-4">
          {messages.length === 0 && !streamingText && (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 py-20 text-center">
              <div className="rounded-full bg-primary/10 p-4">
                <MessageCircleHeart className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Start the conversation</h3>
                <p className="mt-1 text-sm text-muted-foreground max-w-xs">
                  {voiceMode
                    ? "Tap the microphone to start speaking. Your coaching insights will appear on the right."
                    : "Say hello to begin practicing. Your coaching insights will appear on the right as you chat."}
                </p>
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            // For user messages, grab the micro_cue from the next partner response
            const nextMsg = msg.role === "user" ? messages[i + 1] : null;
            const microCue = nextMsg?.role === "partner" ? nextMsg.coaching?.micro_cue : undefined;

            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                partnerName={partnerName}
                voiceMode={voiceMode}
                microCue={microCue ?? null}
              />
            );
          })}

          {streamingMessage && (
            <MessageBubble
              message={streamingMessage}
              partnerName={partnerName}
              isStreaming
            />
          )}

          {isLoading && !streamingText && (
            <TypingIndicator name={partnerName} />
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t bg-background/80 backdrop-blur-sm p-3">
        {/* Recording indicator */}
        {isRecording && (
          <div className="flex items-center justify-center gap-2 pb-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
            </span>
            <span className="text-sm font-medium text-red-500">
              Recording {formatDuration(recorder.duration)}
            </span>
          </div>
        )}

        {recorder.error && (
          <p className="pb-2 text-center text-xs text-destructive">
            {recorder.error}
          </p>
        )}

        {voiceMode && (isPremiumUser || humeAnalysesUsed !== undefined) && (
          <div className="flex justify-end pb-2">
            {isPremiumUser ? (
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                ✨ Premium
              </span>
            ) : (
              <span className="rounded-full border border-primary/20 bg-primary/[0.03] px-2.5 py-1 text-[11px] font-medium text-primary">
                Voice Coach ({humeAnalysesUsed}/{resolvedHumeAnalysesLimit})
              </span>
            )}
          </div>
        )}

        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording ? "Recording…" : voiceMode ? "Type or tap 🎤 to speak…" : "Type your message…"
            }
            disabled={isLoading || isRecording}
            className={cn(
              "min-h-10 max-h-32 resize-none rounded-xl border-muted-foreground/20",
              "focus-visible:ring-primary/30"
            )}
            rows={1}
          />

          {/* Mic button — shown in voice mode */}
          {voiceMode && onSendVoiceMessage && (
            <Button
              size="icon"
              variant={isRecording ? "destructive" : "outline"}
              onClick={handleMicClick}
              disabled={isLoading}
              className={cn(
                "shrink-0 rounded-xl h-10 w-10",
                isRecording && "animate-pulse"
              )}
              aria-label={isRecording ? "Stop recording" : "Start recording"}
            >
              {isRecording ? (
                <Square className="h-4 w-4" />
              ) : (
                <Mic className="h-4 w-4" />
              )}
            </Button>
          )}

          <Button
            size="icon"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="shrink-0 rounded-xl h-10 w-10"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground/50 text-center">
          {voiceMode
            ? "Tap 🎤 to speak · or type and press Enter"
            : "Press Enter to send · Shift+Enter for new line"}
        </p>
      </div>
    </div>
  );
}
