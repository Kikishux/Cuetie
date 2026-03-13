import { HumeClient } from "hume";

if (!process.env.HUME_API_KEY) {
  console.warn("HUME_API_KEY is not set — Hume emotion analysis will be unavailable");
}

export const humeClient = process.env.HUME_API_KEY
  ? new HumeClient({ apiKey: process.env.HUME_API_KEY })
  : null;

export const HUME_CONFIG = {
  models: {
    prosody: {}, // Voice prosody model for emotion from audio
  },
  topEmotionsCount: 5,
} as const;
