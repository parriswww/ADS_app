import { useCallback, useEffect, useRef, useState } from "react";

export interface MotionState {
  stable: boolean;
  motionScore: number;
}

interface UseMotionDetectionOptions {
  enabled: boolean;
  stabilityThreshold?: number;
  stabilityDurationMs?: number;
  cooldownMs?: number;
  onStable: () => void;
}

/**
 * Frame-diff motion detection over a live video element.
 * Compares downscaled luminance frames; calls onStable when the camera
 * is held still enough for stabilityDurationMs, then enters a cooldown.
 */
export function useMotionDetection(
  videoRef: React.RefObject<HTMLVideoElement | null>,
  opts: UseMotionDetectionOptions
) {
  const {
    enabled,
    stabilityThreshold = 12,
    stabilityDurationMs = 500,
    cooldownMs = 1500,
    onStable,
  } = opts;

  const [state, setState] = useState<MotionState>({ stable: false, motionScore: 0 });
  const rafRef = useRef<number | null>(null);
  const prevFrameRef = useRef<Uint8ClampedArray | null>(null);
  const stableSinceRef = useRef<number | null>(null);
  const cooldownUntilRef = useRef<number>(0);
  const onStableRef = useRef(onStable);

  useEffect(() => {
    onStableRef.current = onStable;
  }, [onStable]);

  const tick = useCallback(() => {
    const video = videoRef.current;
    if (!video || !enabled) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    if (!video.videoWidth || !video.videoHeight) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    const W = 64;
    const H = 48;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    ctx.drawImage(video, 0, 0, W, H);
    const imageData = ctx.getImageData(0, 0, W, H);
    const current = imageData.data;

    let score = 0;
    const prev = prevFrameRef.current;
    if (prev) {
      let diffSum = 0;
      for (let i = 0; i < current.length; i += 4) {
        const lum = (current[i] + current[i + 1] + current[i + 2]) / 3;
        const prevLum = (prev[i] + prev[i + 1] + prev[i + 2]) / 3;
        diffSum += Math.abs(lum - prevLum);
      }
      score = diffSum / (W * H);
    }
    prevFrameRef.current = new Uint8ClampedArray(current);

    const now = performance.now();
    const inCooldown = now < cooldownUntilRef.current;
    const isStable = !inCooldown && score < stabilityThreshold;

    if (isStable) {
      if (stableSinceRef.current === null) {
        stableSinceRef.current = now;
      }
      if (now - stableSinceRef.current >= stabilityDurationMs) {
        cooldownUntilRef.current = now + cooldownMs;
        stableSinceRef.current = null;
        onStableRef.current();
        setState({ stable: false, motionScore: score });
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
    } else {
      stableSinceRef.current = null;
    }

    setState({ stable: isStable, motionScore: score });
    rafRef.current = requestAnimationFrame(tick);
  }, [videoRef, enabled, stabilityThreshold, stabilityDurationMs, cooldownMs]);

  useEffect(() => {
    if (!enabled) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      prevFrameRef.current = null;
      stableSinceRef.current = null;
      cooldownUntilRef.current = 0;
      setState({ stable: false, motionScore: 0 });
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [enabled, tick]);

  return state;
}
