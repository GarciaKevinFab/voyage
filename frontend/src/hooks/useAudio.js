import { useRef, useState, useCallback } from 'react';

/**
 * Web Audio API hook for a tactile page-turn sound effect.
 *
 * The sound is synthesized from:
 *   - A short burst of filtered noise (paper rustle)
 *   - A low sine oscillator (soft thud)
 *
 * Returns { playPageTurn, toggleSound, isSoundEnabled }
 */
export default function useAudio() {
  const ctxRef = useRef(null);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);

  /**
   * Lazily initialize the AudioContext (must happen after user gesture).
   */
  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  /**
   * Create and play the page-turn sound effect.
   */
  const playPageTurn = useCallback(() => {
    if (!isSoundEnabled) return;

    const ctx = getContext();
    const now = ctx.currentTime;
    const duration = 0.25;

    // ── Noise buffer (paper rustle) ───────────────────
    const bufferSize = ctx.sampleRate * duration;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const channelData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;

    // Bandpass filter — paper-like frequency range
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 3000;
    filter.Q.value = 0.8;

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.08, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    noiseSource.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // ── Sine oscillator (soft thud) ───────────────────
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

    const oscGain = ctx.createGain();
    oscGain.gain.setValueAtTime(0.05, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);

    // Start and stop
    noiseSource.start(now);
    noiseSource.stop(now + duration);
    osc.start(now);
    osc.stop(now + 0.15);
  }, [isSoundEnabled, getContext]);

  const toggleSound = useCallback(() => {
    setIsSoundEnabled((prev) => !prev);
  }, []);

  return { playPageTurn, toggleSound, isSoundEnabled };
}
