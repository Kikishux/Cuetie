"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Send, MessageCircleHeart } from "lucide-react";
import MessageBubble from "@/components/chat/MessageBubble";
import type { Message } from "@/lib/types/database";

interface ConversationPanelProps {
  messages: Message[];
  streamingText: string;
  isLoading: boolean;
  onSendMessage: (content: string) => void;
  partnerName: string;
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

export default function ConversationPanel({
  messages,
  streamingText,
  isLoading,
  onSendMessage,
  partnerName,
}: ConversationPanelProps) {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom on new messages or streaming text
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingText]);

  const handleSend = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInput("");
    // Re-focus textarea after sending
    setTimeout(() => textareaRef.current?.focus(), 0);
  }, [input, isLoading, onSendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Build the streaming message object for display
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
                  Say hello to begin practicing. Your coaching insights will
                  appear on the right as you chat.
                </p>
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              partnerName={partnerName}
            />
          ))}

          {/* Streaming message */}
          {streamingMessage && (
            <MessageBubble
              message={streamingMessage}
              partnerName={partnerName}
              isStreaming
            />
          )}

          {/* Typing indicator (when loading but no text yet) */}
          {isLoading && !streamingText && (
            <TypingIndicator name={partnerName} />
          )}

          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input area */}
      <div className="border-t bg-background/80 backdrop-blur-sm p-3">
        <div className="flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message…"
            disabled={isLoading}
            className={cn(
              "min-h-10 max-h-32 resize-none rounded-xl border-muted-foreground/20",
              "focus-visible:ring-primary/30"
            )}
            rows={1}
          />
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
          Press Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
