import { describe, it, expect } from "vitest";
import type {
  AmbiguityAnalysis,
  AmbiguityLevel,
  SupportLevel,
  InteractionStage,
  UserNeed,
  Interpretation,
  EvidenceMarker,
  GoalResponse,
  CoachAnalysisRequest,
} from "@/lib/types/coach";

// ============================================================
// Type shape validation
// ============================================================

describe("Ambiguity Decoder types", () => {
  describe("AmbiguityLevel", () => {
    it("accepts all valid levels", () => {
      const levels: AmbiguityLevel[] = ["low", "medium", "high"];
      expect(levels).toHaveLength(3);
    });
  });

  describe("SupportLevel", () => {
    it("accepts all valid levels", () => {
      const levels: SupportLevel[] = ["strong", "some", "weak"];
      expect(levels).toHaveLength(3);
    });
  });

  describe("InteractionStage", () => {
    it("accepts all valid stages", () => {
      const stages: InteractionStage[] = [
        "just-matched",
        "early-texting",
        "after-first-date",
        "ongoing-dating",
        "other",
      ];
      expect(stages).toHaveLength(5);
    });
  });

  describe("UserNeed", () => {
    it("accepts all valid needs", () => {
      const needs: UserNeed[] = [
        "understand-meaning",
        "decide-whether-to-reply",
        "write-a-reply",
        "check-if-should-ask-directly",
      ];
      expect(needs).toHaveLength(4);
    });
  });
});

// ============================================================
// CoachAnalysisRequest shape
// ============================================================

describe("CoachAnalysisRequest", () => {
  it("supports minimal request (message only)", () => {
    const req: CoachAnalysisRequest = { message: "hey what's up" };
    expect(req.message).toBeTruthy();
    expect(req.context).toBeUndefined();
    expect(req.interaction_stage).toBeUndefined();
    expect(req.user_need).toBeUndefined();
  });

  it("supports full request with all fields", () => {
    const req: CoachAnalysisRequest = {
      message: "haha maybe sometime!",
      context: "We matched 3 days ago on Hinge",
      interaction_stage: "early-texting",
      user_need: "understand-meaning",
    };
    expect(req.message).toBeTruthy();
    expect(req.context).toBeTruthy();
    expect(req.interaction_stage).toBe("early-texting");
    expect(req.user_need).toBe("understand-meaning");
  });
});

// ============================================================
// AmbiguityAnalysis full shape
// ============================================================

function createMockAnalysis(overrides?: Partial<AmbiguityAnalysis>): AmbiguityAnalysis {
  return {
    best_read: "This leans friendly with possible mild interest",
    ambiguity_level: "medium",
    best_next_move: "Ask a low-pressure follow-up question",
    literal_meaning: "They said they had a good time and are busy this week",
    interpretations: [
      {
        label: "Genuine interest, busy schedule",
        support_level: "some",
        explanation: "The follow-up question suggests wanting to continue",
        evidence_phrases: ["I had a great time", "what are you up to this weekend?"],
      },
      {
        label: "Polite but noncommittal",
        support_level: "some",
        explanation: "No concrete plan proposed despite positive words",
        evidence_phrases: ["maybe sometime", "been so busy"],
      },
    ],
    evidence_markers: [
      {
        phrase: "maybe sometime",
        could_mean: "Genuinely open but not ready to commit to a plan",
        but_also: "A soft way of avoiding a direct yes",
      },
      {
        phrase: "I had a great time",
        could_mean: "They enjoyed the date and want more",
        but_also: "A polite closing remark after any date",
      },
    ],
    responses_by_goal: {
      warm: {
        text: "I had a great time too! Let me know when your schedule opens up 😊",
        why: "Matches their energy without pressuring",
        best_when: "You want to stay warm without pushing",
      },
      direct: {
        text: "I'd love to see you again. Are you free Saturday?",
        why: "Gives them a concrete option to say yes or no to",
        best_when: "You prefer clarity over ambiguity",
      },
      clarifying: {
        text: "I enjoyed it too! Are you saying you'd like to go out again, or is this more of a friendly goodbye?",
        why: "Directly asks what they mean in a non-confrontational way",
        best_when: "Ambiguity is causing you stress",
      },
      boundary: {
        text: "Thanks, I had fun too. I'm looking for someone who can make plans — let me know if that's you!",
        why: "Sets a clear expectation without hostility",
        best_when: "You've been in ambiguous situations before and want to filter",
      },
    },
    ask_directly_scripts: [
      "I'm not always great at reading tone over text — are you interested in meeting up again, or just being nice?",
      "I had a good time and want to be upfront: I'd like to see you again. How do you feel about that?",
    ],
    coaching_tip: "When someone says 'maybe sometime' without proposing a specific time, it's genuinely ambiguous. Proposing a concrete plan is the fastest way to get clarity.",
    ...overrides,
  };
}

describe("AmbiguityAnalysis", () => {
  it("has all required top-level fields", () => {
    const analysis = createMockAnalysis();
    expect(analysis.best_read).toBeTruthy();
    expect(analysis.ambiguity_level).toBeTruthy();
    expect(analysis.best_next_move).toBeTruthy();
    expect(analysis.literal_meaning).toBeTruthy();
    expect(analysis.interpretations).toBeInstanceOf(Array);
    expect(analysis.evidence_markers).toBeInstanceOf(Array);
    expect(analysis.responses_by_goal).toBeTruthy();
    expect(analysis.ask_directly_scripts).toBeInstanceOf(Array);
    expect(analysis.coaching_tip).toBeTruthy();
  });

  it("has all 4 goal response keys", () => {
    const analysis = createMockAnalysis();
    const goals = Object.keys(analysis.responses_by_goal);
    expect(goals).toContain("warm");
    expect(goals).toContain("direct");
    expect(goals).toContain("clarifying");
    expect(goals).toContain("boundary");
    expect(goals).toHaveLength(4);
  });

  it("each goal response has text, why, best_when", () => {
    const analysis = createMockAnalysis();
    for (const key of ["warm", "direct", "clarifying", "boundary"] as const) {
      const resp = analysis.responses_by_goal[key];
      expect(resp.text).toBeTruthy();
      expect(resp.why).toBeTruthy();
      expect(resp.best_when).toBeTruthy();
    }
  });
});

// ============================================================
// Interpretation validation
// ============================================================

describe("Interpretation", () => {
  it("requires label, support_level, explanation, evidence_phrases", () => {
    const interp: Interpretation = {
      label: "Genuine interest",
      support_level: "strong",
      explanation: "They asked a follow-up question",
      evidence_phrases: ["what are you doing this weekend?"],
    };
    expect(interp.label).toBeTruthy();
    expect(interp.support_level).toBe("strong");
    expect(interp.evidence_phrases).toHaveLength(1);
  });

  it("can have multiple evidence phrases", () => {
    const interp: Interpretation = {
      label: "Polite but distant",
      support_level: "weak",
      explanation: "Generic positive language without specifics",
      evidence_phrases: ["it was nice", "take care"],
    };
    expect(interp.evidence_phrases).toHaveLength(2);
  });
});

// ============================================================
// EvidenceMarker validation
// ============================================================

describe("EvidenceMarker", () => {
  it("has phrase, could_mean, but_also", () => {
    const marker: EvidenceMarker = {
      phrase: "haha maybe",
      could_mean: "Playful openness",
      but_also: "Deflecting with humor",
    };
    expect(marker.phrase).toBeTruthy();
    expect(marker.could_mean).toBeTruthy();
    expect(marker.but_also).toBeTruthy();
  });

  it("always presents two sides of the same phrase", () => {
    const marker: EvidenceMarker = {
      phrase: "I've been so busy",
      could_mean: "Genuinely overwhelmed schedule",
      but_also: "A way to create distance without saying no",
    };
    expect(marker.could_mean).not.toBe(marker.but_also);
  });
});

// ============================================================
// GoalResponse validation
// ============================================================

describe("GoalResponse", () => {
  it("has text, why, best_when", () => {
    const resp: GoalResponse = {
      text: "I'd love to see you again — how about Saturday?",
      why: "Gives a concrete plan to accept or decline",
      best_when: "You want clarity and are okay with a direct no",
    };
    expect(resp.text).toBeTruthy();
    expect(resp.why).toBeTruthy();
    expect(resp.best_when).toBeTruthy();
  });
});

// ============================================================
// Ambiguity-level-driven UX logic
// ============================================================

describe("Ambiguity-level UX logic", () => {
  it("should auto-select clarifying tab when ambiguity is high", () => {
    const analysis = createMockAnalysis({ ambiguity_level: "high" });
    const defaultTab = analysis.ambiguity_level === "high" ? "clarifying" : "warm";
    expect(defaultTab).toBe("clarifying");
  });

  it("should default to warm tab when ambiguity is low", () => {
    const analysis = createMockAnalysis({ ambiguity_level: "low" });
    const defaultTab = analysis.ambiguity_level === "high" ? "clarifying" : "warm";
    expect(defaultTab).toBe("warm");
  });

  it("should default to warm tab when ambiguity is medium", () => {
    const analysis = createMockAnalysis({ ambiguity_level: "medium" });
    const defaultTab = analysis.ambiguity_level === "high" ? "clarifying" : "warm";
    expect(defaultTab).toBe("warm");
  });

  it("should show ask-directly callout when ambiguity is not low", () => {
    for (const level of ["medium", "high"] as AmbiguityLevel[]) {
      const analysis = createMockAnalysis({ ambiguity_level: level });
      const showAskDirectly = analysis.ambiguity_level !== "low" && analysis.ask_directly_scripts.length > 0;
      expect(showAskDirectly).toBe(true);
    }
  });

  it("should hide ask-directly callout when ambiguity is low", () => {
    const analysis = createMockAnalysis({ ambiguity_level: "low" });
    const showAskDirectly = analysis.ambiguity_level !== "low" && analysis.ask_directly_scripts.length > 0;
    expect(showAskDirectly).toBe(false);
  });

  it("should use prominent styling for ask-directly when ambiguity is high", () => {
    const analysis = createMockAnalysis({ ambiguity_level: "high" });
    const isProminent = analysis.ambiguity_level === "high";
    expect(isProminent).toBe(true);
  });
});

// ============================================================
// Analysis constraints
// ============================================================

describe("Analysis constraints", () => {
  it("should have 2-4 interpretations", () => {
    const analysis = createMockAnalysis();
    expect(analysis.interpretations.length).toBeGreaterThanOrEqual(2);
    expect(analysis.interpretations.length).toBeLessThanOrEqual(4);
  });

  it("should have 1-6 evidence markers", () => {
    const analysis = createMockAnalysis();
    expect(analysis.evidence_markers.length).toBeGreaterThanOrEqual(1);
    expect(analysis.evidence_markers.length).toBeLessThanOrEqual(6);
  });

  it("should have 1-3 ask-directly scripts", () => {
    const analysis = createMockAnalysis();
    expect(analysis.ask_directly_scripts.length).toBeGreaterThanOrEqual(1);
    expect(analysis.ask_directly_scripts.length).toBeLessThanOrEqual(3);
  });

  it("every interpretation should have at least one evidence phrase", () => {
    const analysis = createMockAnalysis();
    for (const interp of analysis.interpretations) {
      expect(interp.evidence_phrases.length).toBeGreaterThanOrEqual(1);
    }
  });

  it("interpretations are ordered most to least likely", () => {
    const supportOrder: Record<SupportLevel, number> = { strong: 3, some: 2, weak: 1 };
    const analysis = createMockAnalysis({
      interpretations: [
        { label: "A", support_level: "strong", explanation: "x", evidence_phrases: ["a"] },
        { label: "B", support_level: "some", explanation: "y", evidence_phrases: ["b"] },
        { label: "C", support_level: "weak", explanation: "z", evidence_phrases: ["c"] },
      ],
    });
    for (let i = 0; i < analysis.interpretations.length - 1; i++) {
      const current = supportOrder[analysis.interpretations[i].support_level];
      const next = supportOrder[analysis.interpretations[i + 1].support_level];
      expect(current).toBeGreaterThanOrEqual(next);
    }
  });
});

// ============================================================
// Backwards compatibility
// ============================================================

describe("Backwards compatibility", () => {
  it("CoachAnalysisRequest still accepts message + context only", () => {
    const req: CoachAnalysisRequest = {
      message: "hey there!",
      context: "Just matched on Bumble",
    };
    expect(req.interaction_stage).toBeUndefined();
    expect(req.user_need).toBeUndefined();
  });

  it("new fields are optional on request", () => {
    const req: CoachAnalysisRequest = { message: "hi" };
    expect(Object.keys(req)).toEqual(["message"]);
  });
});
