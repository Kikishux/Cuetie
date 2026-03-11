import OpenAI from "openai";
import type { PromptConfig } from "@/lib/types/ai";

// ============================================================
// Model Configurations
// ============================================================

export const CHAT_CONFIG: PromptConfig = {
  model: "gpt-4o",
  temperature: 0.8,
  max_tokens: 1000,
  response_format: { type: "json_object" },
};

export const SCORECARD_CONFIG: PromptConfig = {
  model: "gpt-4o",
  temperature: 0.3,
  max_tokens: 2000,
  response_format: { type: "json_object" },
};

/** Sliding window — only the most recent N messages are sent as context. */
export const MAX_CONTEXT_MESSAGES = 20;

/** Appended when the model detects crisis-related language. */
export const SAFETY_DISCLAIMER = [
  "If you or someone you know is in crisis, please reach out for help:",
  "• National Suicide Prevention Lifeline: 988 (call or text)",
  "• Crisis Text Line: text HOME to 741741",
  "• SAMHSA National Helpline: 1-800-662-4357",
  "Cuetie is a coaching tool and is not a substitute for professional mental health support.",
].join("\n");

// ============================================================
// OpenAI Client (lazy-initialized to avoid build-time errors)
// ============================================================

let _openai: OpenAI | null = null;

export function getOpenAIClient(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return _openai;
}

/** @deprecated Use getOpenAIClient() instead */
export const openai = undefined as unknown as OpenAI;
