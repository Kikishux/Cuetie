import { describe, it, expect } from "vitest";
import {
  analyzeFillerWords,
  analyzePacing,
  analyzeResponseTime,
  analyzeVoiceMessage,
} from "@/lib/ai/voice-coaching";

// ============================================================
// analyzeFillerWords
// ============================================================

describe("analyzeFillerWords", () => {
  it("detects no filler words in clean speech", () => {
    const result = analyzeFillerWords(
      "I really enjoyed our conversation at the coffee shop yesterday."
    );
    expect(result.count).toBe(0);
    expect(result.words).toEqual([]);
    expect(result.feedback).toContain("no filler words");
  });

  it("detects common filler words: um, uh", () => {
    const result = analyzeFillerWords(
      "So um I was thinking uh maybe we could go out sometime."
    );
    expect(result.count).toBeGreaterThanOrEqual(2);
    expect(result.words).toEqual(expect.arrayContaining(["um", "uh"]));
  });

  it("detects 'you know' as a filler phrase", () => {
    const result = analyzeFillerWords(
      "I was just, you know, trying to be nice, you know?"
    );
    expect(result.words).toEqual(
      expect.arrayContaining(["you know"])
    );
    expect(result.count).toBeGreaterThanOrEqual(2);
  });

  it("detects 'basically' and 'literally'", () => {
    const result = analyzeFillerWords(
      "I basically just literally walked over and said hello."
    );
    expect(result.words).toEqual(
      expect.arrayContaining(["basically", "literally"])
    );
  });

  it("gives mild feedback for 1-2 fillers", () => {
    const result = analyzeFillerWords("Um, that sounds great.");
    expect(result.count).toBeLessThanOrEqual(2);
    expect(result.feedback).toContain("pretty normal");
  });

  it("gives stronger feedback for 3+ fillers", () => {
    const result = analyzeFillerWords(
      "Um, like, you know, I basically just, uh, wanted to say hi."
    );
    expect(result.count).toBeGreaterThanOrEqual(3);
    expect(result.feedback).toContain("pausing");
  });
});

// ============================================================
// analyzePacing
// ============================================================

describe("analyzePacing", () => {
  it("returns null for empty words array", () => {
    expect(analyzePacing([], 5)).toBeNull();
  });

  it("returns null for very short audio (<2s)", () => {
    const words = [{ word: "hi", start: 0, end: 0.5 }];
    expect(analyzePacing(words, 1)).toBeNull();
  });

  it("rates normal pace as 'good' (120-160 WPM)", () => {
    // 20 words in 10 seconds = 120 WPM
    const words = Array.from({ length: 20 }, (_, i) => ({
      word: `word${i}`,
      start: i * 0.5,
      end: i * 0.5 + 0.4,
    }));
    const result = analyzePacing(words, 10);
    expect(result).not.toBeNull();
    expect(result!.rating).toBe("good");
    expect(result!.wpm).toBeGreaterThanOrEqual(100);
    expect(result!.wpm).toBeLessThanOrEqual(170);
  });

  it("rates slow pace as 'too-slow' (<100 WPM)", () => {
    // 10 words in 10 seconds = 60 WPM
    const words = Array.from({ length: 10 }, (_, i) => ({
      word: `word${i}`,
      start: i * 1,
      end: i * 1 + 0.8,
    }));
    const result = analyzePacing(words, 10);
    expect(result).not.toBeNull();
    expect(result!.rating).toBe("too-slow");
    expect(result!.feedback).toContain("picking up");
  });

  it("rates fast pace as 'too-fast' (>170 WPM)", () => {
    // 60 words in 15 seconds = 240 WPM
    const words = Array.from({ length: 60 }, (_, i) => ({
      word: `word${i}`,
      start: i * 0.25,
      end: i * 0.25 + 0.2,
    }));
    const result = analyzePacing(words, 15);
    expect(result).not.toBeNull();
    expect(result!.rating).toBe("too-fast");
    expect(result!.feedback).toContain("slowing down");
  });
});

// ============================================================
// analyzeResponseTime
// ============================================================

describe("analyzeResponseTime", () => {
  it("returns null for negative values", () => {
    expect(analyzeResponseTime(-1)).toBeNull();
  });

  it("rates very quick response (<0.5s) as 'too-fast'", () => {
    const result = analyzeResponseTime(0.2);
    expect(result).not.toBeNull();
    expect(result!.rating).toBe("too-fast");
    expect(result!.feedback).toContain("jumped in");
  });

  it("rates natural pause (1-8s) as 'natural'", () => {
    const result = analyzeResponseTime(2.5);
    expect(result).not.toBeNull();
    expect(result!.rating).toBe("natural");
    expect(result!.feedback).toContain("natural pause");
  });

  it("rates long pause (>8s) as 'too-slow'", () => {
    const result = analyzeResponseTime(12);
    expect(result).not.toBeNull();
    expect(result!.rating).toBe("too-slow");
    expect(result!.feedback).toContain("waited");
  });

  it("includes rounded seconds in result", () => {
    const result = analyzeResponseTime(3.456);
    expect(result!.seconds).toBe(3.5);
  });
});

// ============================================================
// analyzeVoiceMessage (integration)
// ============================================================

describe("analyzeVoiceMessage", () => {
  it("returns all three coaching components", () => {
    const words = Array.from({ length: 25 }, (_, i) => ({
      word: `word${i}`,
      start: i * 0.4,
      end: i * 0.4 + 0.3,
    }));

    const result = analyzeVoiceMessage(
      "Um, I think that sounds like a great idea, you know?",
      words,
      10,
      2.0
    );

    expect(result.filler_words).toBeDefined();
    expect(result.filler_words.count).toBeGreaterThanOrEqual(1);
    expect(result.pacing).toBeDefined();
    expect(result.pacing!.wpm).toBeGreaterThan(0);
    expect(result.response_time).toBeDefined();
    expect(result.response_time!.rating).toBe("natural");
  });

  it("handles missing response time", () => {
    const result = analyzeVoiceMessage("Hello there!", [], 3);
    expect(result.response_time).toBeNull();
  });

  it("handles empty words array gracefully", () => {
    const result = analyzeVoiceMessage("Hello!", [], 1);
    expect(result.pacing).toBeNull();
    expect(result.filler_words.count).toBe(0);
  });
});
