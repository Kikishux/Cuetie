import { NextRequest } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { buildChatPrompt } from "@/lib/ai/prompt-builder";
import { parseAIResponse } from "@/lib/ai/response-parser";
import { getOpenAIClient, CHAT_CONFIG } from "@/lib/ai/config";
import type { Message, OnboardingProfile, Scenario, Session } from "@/lib/types/database";

const sendMessageSchema = z.object({
  sessionId: z.string().min(1),
  content: z.string().min(1).max(2000),
});

function sseEvent(type: string, data: unknown): string {
  return `data: ${JSON.stringify({ type, ...data as object })}\n\n`;
}

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // --- Parse & validate body ---
        const body = await request.json();
        const parsed = sendMessageSchema.safeParse(body);
        if (!parsed.success) {
          controller.enqueue(
            encoder.encode(sseEvent("error", { code: "VALIDATION_ERROR", message: parsed.error.message }))
          );
          controller.close();
          return;
        }

        const { sessionId, content } = parsed.data;

        // --- Authenticate ---
        const supabase = await createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
          controller.enqueue(
            encoder.encode(sseEvent("error", { code: "UNAUTHORIZED", message: "Authentication required" }))
          );
          controller.close();
          return;
        }

        // --- Fetch session & verify ownership ---
        const { data: session, error: sessionError } = await supabase
          .from("sessions")
          .select("*")
          .eq("id", sessionId)
          .eq("user_id", user.id)
          .single<Session>();

        if (sessionError || !session) {
          controller.enqueue(
            encoder.encode(sseEvent("error", { code: "NOT_FOUND", message: "Session not found" }))
          );
          controller.close();
          return;
        }

        if (session.status !== "active") {
          controller.enqueue(
            encoder.encode(sseEvent("error", { code: "SESSION_ENDED", message: "Session is no longer active" }))
          );
          controller.close();
          return;
        }

        // --- Fetch scenario ---
        const { data: scenario, error: scenarioError } = await supabase
          .from("scenarios")
          .select("*")
          .eq("id", session.scenario_id)
          .single<Scenario>();

        if (scenarioError || !scenario) {
          controller.enqueue(
            encoder.encode(sseEvent("error", { code: "NOT_FOUND", message: "Scenario not found" }))
          );
          controller.close();
          return;
        }

        // --- Fetch user profile ---
        const { data: userRecord } = await supabase
          .from("users")
          .select("onboarding_profile")
          .eq("id", user.id)
          .single<{ onboarding_profile: OnboardingProfile }>();

        const userProfile: OnboardingProfile = userRecord?.onboarding_profile ?? {};

        // --- Save user message ---
        const { error: insertError } = await supabase.from("messages").insert({
          session_id: sessionId,
          role: "user" as const,
          content,
        });

        if (insertError) {
          controller.enqueue(
            encoder.encode(sseEvent("error", { code: "DB_ERROR", message: "Failed to save message" }))
          );
          controller.close();
          return;
        }

        // --- Fetch conversation history ---
        const { data: messages } = await supabase
          .from("messages")
          .select("*")
          .eq("session_id", sessionId)
          .order("created_at", { ascending: true })
          .returns<Message[]>();

        // --- Build prompt & call OpenAI with streaming ---
        const promptMessages = buildChatPrompt(scenario, userProfile, messages ?? []);

        const completion = await getOpenAIClient().chat.completions.create({
          model: CHAT_CONFIG.model,
          temperature: CHAT_CONFIG.temperature,
          max_tokens: CHAT_CONFIG.max_tokens,
          response_format: CHAT_CONFIG.response_format,
          messages: promptMessages,
          stream: true,
        });

        let fullResponse = "";
        let totalTokens = 0;

        for await (const chunk of completion) {
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) {
            fullResponse += delta;
            controller.enqueue(encoder.encode(sseEvent("token", { content: delta })));
          }

          if (chunk.usage) {
            totalTokens = chunk.usage.total_tokens;
          }
        }

        // --- Parse AI response ---
        const aiResponse = parseAIResponse(fullResponse);

        // --- Save partner message ---
        await supabase.from("messages").insert({
          session_id: sessionId,
          role: "partner" as const,
          content: aiResponse.partner_response,
          coaching: aiResponse.coaching,
          token_count: totalTokens,
        });

        // --- Update session counters ---
        await supabase
          .from("sessions")
          .update({
            message_count: (session.message_count ?? 0) + 2,
            total_tokens: (session.total_tokens ?? 0) + totalTokens,
          })
          .eq("id", sessionId);

        // --- Send final SSE events ---
        controller.enqueue(encoder.encode(sseEvent("coaching", { data: aiResponse.coaching })));
        controller.enqueue(encoder.encode(sseEvent("done", { partner_response: aiResponse.partner_response, messageCount: (session.message_count ?? 0) + 2 })));
        controller.close();
      } catch (err) {
        const message = err instanceof Error ? err.message : "Internal server error";
        controller.enqueue(
          encoder.encode(sseEvent("error", { code: "INTERNAL_ERROR", message }))
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
