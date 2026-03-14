import React, { useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useMusicStore from '../../store/musicStore';
import useGlobalMusic from '../../hooks/useGlobalMusic';

const LUXURY_EASE = [0.645, 0.045, 0.355, 1];

/* ── Colour palette ──────────────────────────────────────── */
const GOLD = '#C9A96E';
const BLACK = '#0A0A0A';
const CREAM = '#F5F0E8';
const WARM_GRAY = '#8A8478';

/* ── Helpers ─────────────────────────────────────────────── */
function formatTime(seconds) {
  if (!seconds || !isFinite(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Fixed bottom-bar music player that persists across all screens.
 *
 * Renders only when there is a currentTrack or the queue is non-empty.
 */
export default function GlobalMusicPlayer() {
  const { toggle, seek, progress, duration, isPlaying, currentTrack } =
    useGlobalMusic();

  const queue = useMusicStore((s) => s.queue);
  const next = useMusicStore((s) => s.next);
  const prev = useMusicStore((s) => s.prev);
  const clearQueue = useMusicStore((s) => s.clearQueue);
  const togglePlaylist = useMusicStore((s) => s.togglePlaylist);

  const visible = Boolean(currentTrack || queue.length > 0);

  /* ── Seek handler ───────────────────────────────────────── */
  const handleSeek = useCallback(
    (e) => {
      if (!duration) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, x / rect.width));
      seek(ratio * duration);
    },
    [duration, seek],
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ duration: 0.45, ease: LUXURY_EASE }}
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9000,
            height: '64px',
            backgroundColor: BLACK,
            borderTop: `1px solid ${GOLD}33`,
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            gap: '16px',
            fontFamily: "'Josefin Sans', sans-serif",
          }}
        >
          {/* ── Left: album art + track info ─────────────── */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '0 1 260px', minWidth: 0 }}>
            {currentTrack?.album_art && (
              <img
                src={currentTrack.album_art}
                alt=""
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '4px',
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            )}
            <div style={{ minWidth: 0 }}>
              <p
                style={{
                  fontWeight: 400,
                  fontSize: '13px',
                  color: '#FFFFFF',
                  letterSpacing: '0.03em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  margin: 0,
                }}
              >
                {currentTrack?.name || 'No track'}
              </p>
              <p
                style={{
                  fontWeight: 300,
                  fontSize: '11px',
                  color: GOLD,
                  letterSpacing: '0.06em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  margin: '2px 0 0',
                }}
              >
                {currentTrack?.artist || ''}
              </p>
            </div>
          </div>

          {/* ── Center: transport controls ───────────────── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '20px',
              flex: '0 0 auto',
            }}
          >
            <ControlButton label="&#9198;" color={CREAM} onClick={prev} size={14} />
            <ControlButton
              label={isPlaying ? '\u275A\u275A' : '\u25B6'}
              color={GOLD}
              onClick={toggle}
              size={18}
            />
            <ControlButton label="&#9197;" color={CREAM} onClick={next} size={14} />
          </div>

          {/* ── Right: progress + time + actions ─────────── */}
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              minWidth: 0,
            }}
          >
            {/* Progress bar */}
            <div
              onClick={handleSeek}
              style={{
                flex: 1,
                height: '3px',
                backgroundColor: `${WARM_GRAY}44`,
                cursor: 'pointer',
                position: 'relative',
                borderRadius: '2px',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: '100%',
                  width: duration ? `${(progress / duration) * 100}%` : '0%',
                  backgroundColor: GOLD,
                  borderRadius: '2px',
                  transition: 'width 100ms linear',
                }}
              />
            </div>

            {/* Time */}
            <span
              style={{
                fontSize: '10px',
                color: WARM_GRAY,
                fontVariantNumeric: 'tabular-nums',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              {formatTime(progress)} / {formatTime(duration)}
            </span>

            {/* Playlist toggle */}
            <ControlButton label="&#9776;" color={CREAM} onClick={togglePlaylist} size={16} />

            {/* Close / clear */}
            <ControlButton label="&times;" color={WARM_GRAY} onClick={clearQueue} size={18} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Tiny reusable icon-button ──────────────────────────── */
function ControlButton({ label, color, onClick, size = 14 }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        fontSize: `${size}px`,
        color,
        padding: '4px 6px',
        lineHeight: 1,
        transition: 'opacity 200ms',
        flexShrink: 0,
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.7')}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      dangerouslySetInnerHTML={{ __html: label }}
    />
  );
}
