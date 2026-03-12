/**
 * Voice-specific coaching analysis — filler words, pacing, response time, and tone.
 */

export interface AudioFeatures {
  avgPitch: number;          // Hz — average fundamental frequency
  pitchVariability: number;  // stddev of pitch — monotone(low) vs expressive(high)
  avgEnergy: number;         // RMS energy 0-1 — quiet vs loud
  energyVariability: number; // stddev of energy — flat vs dynamic
  pauseRatio: number;        // 0-1 — fraction of recording that's silence
  speakingDuration: number;  // seconds of actual speech
}

export interface VoiceToneAnalysis {
  detected_emotion: string;
  confidence_level: number;    // 1-10
  expressiveness: number;      // 1-10 (1=monotone, 10=very expressive)
  energy_match: string;
  suggestion: string;
}

export interface VoiceCoaching {
  filler_words: {
    count: number;
    words: string[];
    feedback: string;
  };
  pacing: {
    wpm: number;
    rating: "too-slow" | "good" | "too-fast";
    feedback: string;
  } | null;
  response_time: {
    seconds: number;
    rating: "too-fast" | "natural" | "too-slow";
    feedback: string;
  } | null;
  tone: VoiceToneAnalysis | null;
}

// Common filler words and phrases
const FILLER_PATTERNS = [
  /\bum+\b/gi,
  /\buh+\b/gi,
  /\blike\b(?!\s+(?:a|the|to|that|this|it|when|how|what))/gi,
  /\byou know\b/gi,
  /\bbasically\b/gi,
  /\bliterally\b/gi,
  /\bactually\b/gi,
  /\bi mean\b/gi,
  /\bso+\b(?=\s*,|\s*\.|\s+(?:um|uh|like|yeah))/gi,
  /\bkind of\b/gi,
  /\bsort of\b/gi,
];

/**
 * Analyze transcribed text for filler words.
 */
export function analyzeFillerWords(text: string): VoiceCoaching["filler_words"] {
  const found: string[] = [];

  for (const pattern of FILLER_PATTERNS) {
    const matches = text.match(pattern);
    if (matches) {
      found.push(...matches.map((m) => m.toLowerCase()));
    }
  }

  const count = found.length;
  let feedback: string;

  if (count === 0) {
    feedback = "Great job — no filler words detected! Your speech was clear and confident.";
  } else if (count <= 2) {
    feedback = `You used ${count} filler word${count > 1 ? "s" : ""} (${[...new Set(found)].join(", ")}). That's pretty normal — just be mindful of them.`;
  } else {
    feedback = `You used ${count} filler words (${[...new Set(found)].join(", ")}). Try pausing briefly instead of filling silence — it actually sounds more confident.`;
  }

  return { count, words: found, feedback };
}

/**
 * Analyze speaking pace from Whisper word timestamps.
 */
export function analyzePacing(
  words: Array<{ word: string; start: number; end: number }>,
  totalDuration: number
): VoiceCoaching["pacing"] {
  if (!words.length || totalDuration < 2) return null;

  const wordCount = words.length;
  const minutes = totalDuration / 60;
  const wpm = Math.round(wordCount / minutes);

  let rating: "too-slow" | "good" | "too-fast";
  let feedback: string;

  if (wpm < 100) {
    rating = "too-slow";
    feedback = `You spoke at ~${wpm} WPM — that's quite slow. Try picking up the pace a bit to keep the conversation flowing naturally.`;
  } else if (wpm > 170) {
    rating = "too-fast";
    feedback = `You spoke at ~${wpm} WPM — that's pretty fast! Try slowing down to ~130-150 WPM. It'll feel more relaxed and give your date time to process.`;
  } else {
    rating = "good";
    feedback = `You spoke at ~${wpm} WPM — that's a comfortable conversational pace. Nice job!`;
  }

  return { wpm, rating, feedback };
}

/**
 * Analyze response time — how long the user waited before replying.
 */
export function analyzeResponseTime(
  secondsSincePartnerFinished: number
): VoiceCoaching["response_time"] {
  if (secondsSincePartnerFinished < 0) return null;

  let rating: "too-fast" | "natural" | "too-slow";
  let feedback: string;

  if (secondsSincePartnerFinished < 0.5) {
    rating = "too-fast";
    feedback = "You jumped in really quickly — it might feel like you're not fully listening. Try waiting a beat before responding.";
  } else if (secondsSincePartnerFinished > 8) {
    rating = "too-slow";
    feedback = `You waited ${Math.round(secondsSincePartnerFinished)} seconds before responding. Long pauses can feel awkward — try to respond within 3-5 seconds.`;
  } else {
    rating = "natural";
    feedback = "Good timing! You gave a natural pause before responding — that shows you were listening.";
  }

  return {
    seconds: Math.round(secondsSincePartnerFinished * 10) / 10,
    rating,
    feedback,
  };
}

/**
 * Run all voice coaching analyses on a transcription result.
 */
export function analyzeVoiceMessage(
  text: string,
  words: Array<{ word: string; start: number; end: number }>,
  durationSeconds: number,
  responseTimeSeconds?: number
): VoiceCoaching {
  return {
    filler_words: analyzeFillerWords(text),
    pacing: analyzePacing(words, durationSeconds),
    response_time:
      responseTimeSeconds !== undefined
        ? analyzeResponseTime(responseTimeSeconds)
        : null,
    tone: null, // Filled by GPT-4o when audio features are available
  };
}
