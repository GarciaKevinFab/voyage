import { useRef, useState, useEffect, useCallback } from 'react';
import useMusicStore from '../store/musicStore';

/**
 * Hook that manages a singleton HTML Audio element driven by the global
 * music store.  Mount it once (e.g. in App or Layout) and interact with the
 * store from anywhere — this hook keeps the Audio element in sync.
 *
 * Returns:
 *   { play, pause, toggle, seek, progress, duration, isPlaying, currentTrack }
 */
export default function useGlobalMusic() {
  const audioRef = useRef(null);
  const rafRef = useRef(null);

  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  // ── Store selectors ──────────────────────────────────────
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const storePlay = useMusicStore((s) => s.play);
  const storePause = useMusicStore((s) => s.pause);
  const storeResume = useMusicStore((s) => s.resume);
  const storeNext = useMusicStore((s) => s.next);

  // ── Create Audio element once ────────────────────────────
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = 'auto';
    }

    return () => {
      // Cleanup on unmount
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = '';
      }
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── React to track changes ───────────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentTrack?.preview_url) {
      audio.pause();
      audio.src = '';
      setProgress(0);
      setDuration(0);
      return;
    }

    // Only reload if the source actually changed
    if (audio.src !== currentTrack.preview_url) {
      audio.src = currentTrack.preview_url;
      audio.load();
    }

    const handleLoaded = () => {
      setDuration(audio.duration || currentTrack.duration_ms / 1000 || 30);
      audio.play().catch(() => {});
    };

    const handleEnded = () => {
      storeNext();
    };

    audio.addEventListener('loadeddata', handleLoaded);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', handleLoaded);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentTrack, storeNext]);

  // ── React to isPlaying changes ───────────────────────────
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // ── Progress tracking via requestAnimationFrame ──────────
  useEffect(() => {
    const audio = audioRef.current;

    function tick() {
      if (audio && audio.duration) {
        setProgress(audio.currentTime);
        setDuration(audio.duration);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick);
    } else if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  // ── Exposed helpers ──────────────────────────────────────

  const play = useCallback(
    (track) => {
      storePlay(track);
    },
    [storePlay],
  );

  const pause = useCallback(() => {
    storePause();
  }, [storePause]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      storePause();
    } else {
      storeResume();
    }
  }, [isPlaying, storePause, storeResume]);

  const seek = useCallback(
    (time) => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = time;
      setProgress(time);
    },
    [],
  );

  return {
    play,
    pause,
    toggle,
    seek,
    progress,
    duration,
    isPlaying,
    currentTrack,
  };
}
