"use client";

import { useRef, useCallback, useState } from "react";
import type { AudioFeatures } from "@/lib/ai/voice-coaching";

/**
 * Extracts audio features (pitch, energy, pauses) from a MediaStream
 * using the Web Audio API. Connect to a recording stream to analyze
 * voice characteristics in real-time.
 */
export function useAudioAnalyzer() {
  const [features, setFeatures] = useState<AudioFeatures | null>(null);

  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const rafRef = useRef<number | null>(null);

  // Accumulated samples
  const pitchSamplesRef = useRef<number[]>([]);
  const energySamplesRef = useRef<number[]>([]);
  const silentFramesRef = useRef<number>(0);
  const totalFramesRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  /**
   * Connect to a MediaStream and start analyzing audio features.
   */
  const connect = useCallback((stream: MediaStream) => {
    // Reset
    pitchSamplesRef.current = [];
    energySamplesRef.current = [];
    silentFramesRef.current = 0;
    totalFramesRef.current = 0;
    startTimeRef.current = Date.now();
    setFeatures(null);

    const ctx = new AudioContext();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.3;

    const source = ctx.createMediaStreamSource(stream);
    source.connect(analyser);

    ctxRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;

    const bufferLength = analyser.fftSize;
    const timeData = new Float32Array(bufferLength);

    const SILENCE_THRESHOLD = 0.01;

    function analyze() {
      if (!analyserRef.current) return;

      analyserRef.current.getFloatTimeDomainData(timeData);
      totalFramesRef.current++;

      // RMS energy
      let sumSq = 0;
      for (let i = 0; i < bufferLength; i++) {
        sumSq += timeData[i] * timeData[i];
      }
      const rms = Math.sqrt(sumSq / bufferLength);
      energySamplesRef.current.push(rms);

      if (rms < SILENCE_THRESHOLD) {
        silentFramesRef.current++;
      } else {
        // Pitch detection via autocorrelation (only on non-silent frames)
        const pitch = detectPitch(timeData, ctx.sampleRate);
        if (pitch > 50 && pitch < 600) {
          pitchSamplesRef.current.push(pitch);
        }
      }

      rafRef.current = requestAnimationFrame(analyze);
    }

    rafRef.current = requestAnimationFrame(analyze);
  }, []);

  /**
   * Disconnect and compute final AudioFeatures summary.
   */
  const disconnect = useCallback((): AudioFeatures | null => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (ctxRef.current) {
      ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
    }
    analyserRef.current = null;

    const pitches = pitchSamplesRef.current;
    const energies = energySamplesRef.current;
    const totalFrames = totalFramesRef.current;
    const silentFrames = silentFramesRef.current;
    const elapsed = (Date.now() - startTimeRef.current) / 1000;

    if (pitches.length < 3 || energies.length < 3) {
      setFeatures(null);
      return null;
    }

    const avgPitch = mean(pitches);
    const pitchVariability = stddev(pitches);
    const avgEnergy = mean(energies);
    const energyVariability = stddev(energies);
    const pauseRatio = totalFrames > 0 ? silentFrames / totalFrames : 0;
    const speakingDuration = elapsed * (1 - pauseRatio);

    const result: AudioFeatures = {
      avgPitch: round2(avgPitch),
      pitchVariability: round2(pitchVariability),
      avgEnergy: round2(avgEnergy),
      energyVariability: round2(energyVariability),
      pauseRatio: round2(pauseRatio),
      speakingDuration: round2(speakingDuration),
    };

    setFeatures(result);
    return result;
  }, []);

  return { features, connect, disconnect };
}

// --- Helpers ---

function mean(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function stddev(arr: number[]): number {
  const m = mean(arr);
  const variance = arr.reduce((sum, v) => sum + (v - m) ** 2, 0) / arr.length;
  return Math.sqrt(variance);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Pitch detection using autocorrelation on time-domain audio data.
 * Returns fundamental frequency in Hz, or 0 if no clear pitch detected.
 */
function detectPitch(buffer: Float32Array, sampleRate: number): number {
  const SIZE = buffer.length;
  const MAX_SAMPLES = Math.floor(SIZE / 2);
  let bestOffset = -1;
  let bestCorrelation = 0;
  let foundGoodCorrelation = false;

  // Only analyze if there's enough signal
  let rms = 0;
  for (let i = 0; i < SIZE; i++) {
    rms += buffer[i] * buffer[i];
  }
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return 0;

  const correlations = new Float32Array(MAX_SAMPLES);

  for (let offset = 0; offset < MAX_SAMPLES; offset++) {
    let correlation = 0;
    for (let i = 0; i < MAX_SAMPLES; i++) {
      correlation += Math.abs(buffer[i] - buffer[i + offset]);
    }
    correlation = 1 - correlation / MAX_SAMPLES;
    correlations[offset] = correlation;

    if (correlation > 0.9 && correlation > bestCorrelation) {
      bestCorrelation = correlation;
      bestOffset = offset;
      foundGoodCorrelation = true;
    } else if (foundGoodCorrelation) {
      // We've found a good correlation and it's getting worse — stop
      break;
    }
  }

  if (bestCorrelation > 0.01 && bestOffset > 0) {
    return sampleRate / bestOffset;
  }

  return 0;
}
