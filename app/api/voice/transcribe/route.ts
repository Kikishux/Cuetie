import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import fsp from "fs/promises";
import path from "path";
import os from "os";
import { createClient } from "@/lib/supabase/server";
import { getOpenAIClient, STT_CONFIG } from "@/lib/ai/config";
import { analyzeVoiceMessage } from "@/lib/ai/voice-coaching";
import type { ErrorResponse } from "@/lib/types/api";

export async function POST(request: NextRequest) {
  let tmpPath: string | null = null;

  try {
    // --- Authenticate ---
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "UNAUTHORIZED", message: "Authentication required" } },
        { status: 401 }
      );
    }

    // --- Parse multipart form data ---
    const formData = await request.formData();
    const audioFile = formData.get("audio") as File | null;
    const sessionId = formData.get("sessionId") as string | null;

    if (!audioFile || audioFile.size === 0) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "VALIDATION_ERROR", message: "Audio file is required" } },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "VALIDATION_ERROR", message: "Session ID is required" } },
        { status: 400 }
      );
    }

    // --- Verify session ownership ---
    const { data: session } = await supabase
      .from("sessions")
      .select("id")
      .eq("id", sessionId)
      .eq("user_id", user.id)
      .single();

    if (!session) {
      return NextResponse.json<ErrorResponse>(
        { error: { code: "NOT_FOUND", message: "Session not found" } },
        { status: 404 }
      );
    }

    // --- Write audio to temp file and call Whisper ---
    const openai = getOpenAIClient();
    tmpPath = path.join(os.tmpdir(), `cuetie-${Date.now()}.webm`);

    const audioBytes = await audioFile.arrayBuffer();
    await fsp.writeFile(tmpPath, Buffer.from(audioBytes));

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(tmpPath),
      model: STT_CONFIG.model,
      language: STT_CONFIG.language,
      response_format: "verbose_json",
      timestamp_granularities: ["word"],
    });

    const text = transcription.text?.trim();
    if (!text) {
      return NextResponse.json<ErrorResponse>(
        {
          error: {
            code: "EMPTY_TRANSCRIPTION",
            message: "Could not understand the audio. Please try speaking more clearly.",
          },
        },
        { status: 422 }
      );
    }

    // --- Voice coaching analysis ---
    const words = (transcription.words as Array<{ word: string; start: number; end: number }>) ?? [];
    const duration = transcription.duration ?? 0;
    const responseTime = formData.get("responseTime")
      ? parseFloat(formData.get("responseTime") as string)
      : undefined;

    const voiceCoaching = analyzeVoiceMessage(text, words, duration, responseTime);

    return NextResponse.json({
      text,
      duration_seconds: duration,
      words,
      voice_coaching: voiceCoaching,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Transcription failed";
    return NextResponse.json<ErrorResponse>(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  } finally {
    if (tmpPath) {
      await fsp.unlink(tmpPath).catch(() => {});
    }
  }
}
