"use client";

import { motion } from "framer-motion";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Mic } from "lucide-react";
import type { Message } from "@/lib/types/database";

interface MessageBubbleProps {
  message: Message;
  partnerName: string;
  isStreaming?: boolean;
  voiceMode?: boolean;
}

function formatTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

export default function MessageBubble({
  message,
  partnerName,
  isStreaming = false,
  voiceMode = false,
}: MessageBubbleProps) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}
    >
      {/* Partner avatar */}
      {!isUser && (
        <Avatar size="sm" className="mt-1 shrink-0">
          <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
            {partnerName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn("flex max-w-[75%] flex-col gap-1", isUser && "items-end")}
      >
        {/* Name label for partner */}
        {!isUser && (
          <span className="text-xs font-medium text-muted-foreground pl-1">
            {partnerName}
          </span>
        )}

        {/* Bubble */}
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
            isUser
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-muted text-foreground rounded-bl-md"
          )}
        >
          {/* Voice mode indicator for user messages */}
          {isUser && voiceMode && (
            <span className="inline-flex items-center gap-1 text-primary-foreground/70 text-[10px] mb-1">
              <Mic className="h-3 w-3" /> spoken
            </span>
          )}

          <p className="whitespace-pre-wrap break-words">{message.content}</p>

          {/* Streaming cursor */}
          {isStreaming && (
            <span className="inline-block ml-0.5 w-0.5 h-4 bg-current animate-pulse align-text-bottom" />
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[10px] text-muted-foreground/60 px-1">
          {formatTime(message.created_at)}
        </span>

        {/* Inline micro-cue coaching nudge — shown on partner messages as feedback about the user's previous turn */}
        {!isUser && message.coaching?.micro_cue && (
          <span className="text-[11px] text-muted-foreground bg-primary/5 border border-primary/15 rounded-full px-2.5 py-0.5 mt-0.5 inline-block">
            {message.coaching.micro_cue}
          </span>
        )}
      </div>
    </motion.div>
  );
}
