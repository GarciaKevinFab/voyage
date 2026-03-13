import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LUXURY_EASE = [0.645, 0.045, 0.355, 1];

/**
 * Mini music player for 30-second song previews.
 *
 * Props:
 *   - previewUrl: string — URL of the audio preview
 *   - trackName: string
 *   - artist: string
 *   - albumArt: string — URL of album artwork
 *   - isVisible: boolean
 *   - onClose: () => void
 */
export default function MusicPlayer({
  previewUrl,
  trackName,
  artist,
  albumArt,
  isVisible,
  onClose,
}) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const rafRef = useRef(null);

  /* ── Load and auto-play when URL changes ─────────────── */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !previewUrl) return;

    audio.src = previewUrl;
    audio.load();

    const handleLoaded = () => {
      setDuration(audio.duration || 30);
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setProgress(0);
    };

    audio.addEventListener('loadeddata', handleLoaded);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadeddata', handleLoaded);
      audio.removeEventListener('ended', handleEnded);
      audio.pause();
    };
  }, [previewUrl]);

  /* ── Progress tracking ───────────────────────────────── */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function tick() {
      if (audio.duration) {
        setProgress(audio.currentTime / audio.duration);
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    if (isPlaying) {
      rafRef.current = requestAnimationFrame(tick);
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  /* ── Play / Pause toggle ─────────────────────────────── */
  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  }, [isPlaying]);

  /* ── Close and clean up ──────────────────────────────── */
  const handleClose = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setProgress(0);
    onClose?.();
  }, [onClose]);

  /* ── Seek ────────────────────────────────────────────── */
  const handleSeek = useCallback(
    (e) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      audio.currentTime = ratio * duration;
      setProgress(ratio);
    },
    [duration]
  );

  return (
    <>
      <audio ref={audioRef} preload="none" />

      <AnimatePresence>
        {isVisible && previewUrl && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.4, ease: LUXURY_EASE }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 8000,
              backgroundColor: 'rgba(245,240,232,0.97)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              borderTop: '1px solid rgba(201,169,110,0.2)',
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            {/* Album art */}
            {albumArt && (
              <img
                src={albumArt}
                alt=""
                style={{
                  width: '40px',
                  height: '40px',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            )}

            {/* Track info */}
            <div style={{ flex: '0 1 180px', minWidth: 0 }}>
              <p
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 300,
                  fontSize: '11px',
                  color: '#0A0A0A',
                  letterSpacing: '0.05em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {trackName || 'Unknown'}
              </p>
              <p
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 200,
                  fontSize: '9px',
                  color: '#8A8478',
                  letterSpacing: '0.1em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: '2px',
                }}
              >
                {artist || ''}
              </p>
            </div>

            {/* Play / Pause */}
            <button
              onClick={togglePlay}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#0A0A0A',
                flexShrink: 0,
                padding: '4px 8px',
                transition: 'color 300ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#C9A96E')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#0A0A0A')}
            >
              {isPlaying ? '▐▐' : '▶'}
            </button>

            {/* Progress bar */}
            <div
              onClick={handleSeek}
              style={{
                flex: 1,
                height: '3px',
                backgroundColor: 'rgba(138,132,120,0.2)',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: `${progress * 100}%`,
                  backgroundColor: '#C9A96E',
                  transition: 'width 100ms linear',
                }}
              />
            </div>

            {/* Close */}
            <button
              onClick={handleClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                color: '#8A8478',
                flexShrink: 0,
                padding: '4px 8px',
                transition: 'color 300ms',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#0A0A0A')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#8A8478')}
            >
              &times;
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
