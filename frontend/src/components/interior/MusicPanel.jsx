import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as api from '../../services/api';

export default function MusicPanel({ page, onUpdatePage, onSetCurrentPage, onClose }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef(null);
  const progressIntervalRef = useRef(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const data = await api.searchMusic(query);
      setResults(Array.isArray(data) ? data : data.results || []);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, [query]);

  const handlePlay = useCallback((song) => {
    // Stop any currently playing
    if (audioRef.current) {
      audioRef.current.pause();
      clearInterval(progressIntervalRef.current);
    }

    if (playingId === song.id) {
      setPlayingId(null);
      setProgress(0);
      return;
    }

    if (!song.preview_url) return;

    const audio = new Audio(song.preview_url);
    audioRef.current = audio;

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('ended', () => {
      setPlayingId(null);
      setProgress(0);
      clearInterval(progressIntervalRef.current);
    });

    audio.play();
    setPlayingId(song.id);

    progressIntervalRef.current = setInterval(() => {
      if (audioRef.current) {
        setProgress(audioRef.current.currentTime);
      }
    }, 100);
  }, [playingId]);

  const handleAssignSong = useCallback(async (song) => {
    const songData = {
      id: song.id,
      name: song.name,
      artist: song.artist || song.artists?.[0]?.name || 'Unknown',
      album: song.album || '',
      album_art: song.album_art || song.image || '',
      preview_url: song.preview_url || '',
      duration_ms: song.duration_ms || 0,
    };

    try {
      await onUpdatePage(page.id, { song: songData });
      onSetCurrentPage({ ...page, song: songData });
    } catch {
      // Error handled in hook
    }
  }, [page, onUpdatePage, onSetCurrentPage]);

  const handleRemoveSong = useCallback(async () => {
    try {
      await onUpdatePage(page.id, { song: null });
      onSetCurrentPage({ ...page, song: null });
    } catch {
      // Error handled in hook
    }
  }, [page, onUpdatePage, onSetCurrentPage]);

  const handleProgressClick = useCallback((e) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = ratio * duration;
    setProgress(ratio * duration);
  }, [duration]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatDurationMs = (ms) => {
    if (!ms) return '';
    return formatTime(ms / 1000);
  };

  return (
    <div
      style={{
        width: '400px',
        height: '100%',
        backgroundColor: '#FAFAF7',
        borderLeft: '1px solid #E8D5A3',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '20px 20px 16px',
          borderBottom: '1px solid #E8D5A3',
        }}
      >
        <h3
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 300,
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            color: '#8A8478',
            textTransform: 'uppercase',
          }}
        >
          Music
        </h3>
        <button
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Josefin Sans', sans-serif",
            fontSize: '1rem',
            color: '#8A8478',
            padding: '0 4px',
            transition: 'color 300ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#0A0A0A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8478'; }}
        >
          &times;
        </button>
      </div>

      {/* Current song */}
      {page?.song && (
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E8D5A3',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {page.song.album_art && (
            <img
              src={page.song.album_art}
              alt=""
              style={{ width: '40px', height: '40px', objectFit: 'cover' }}
            />
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 400,
                fontSize: '0.85rem',
                color: '#0A0A0A',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {page.song.name}
            </p>
            <p
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 200,
                fontSize: '0.6rem',
                color: '#8A8478',
                letterSpacing: '0.1em',
              }}
            >
              {page.song.artist}
            </p>
          </div>
          <button
            onClick={handleRemoveSong}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.9rem',
              color: '#8A8478',
              transition: 'color 300ms',
              padding: '2px 6px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#c0392b'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8478'; }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Search */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid #E8D5A3' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search songs..."
            style={{
              flex: 1,
              padding: '8px 12px',
              border: '1px solid #E8D5A3',
              background: 'transparent',
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 200,
              fontSize: '0.75rem',
              color: '#0A0A0A',
              outline: 'none',
              letterSpacing: '0.05em',
              transition: 'border-color 300ms',
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = '#C9A96E'; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = '#E8D5A3'; }}
          />
          <button
            onClick={handleSearch}
            disabled={searching}
            style={{
              padding: '8px 16px',
              backgroundColor: '#0A0A0A',
              color: '#FAFAF7',
              border: 'none',
              cursor: searching ? 'wait' : 'pointer',
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 300,
              fontSize: '0.6rem',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              transition: 'background-color 300ms',
            }}
          >
            {searching ? '...' : 'Search'}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '8px 0' }}>
        {results.map((song) => {
          const isPlaying = playingId === song.id;
          return (
            <div
              key={song.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '8px 20px',
                cursor: 'pointer',
                transition: 'background-color 300ms',
                backgroundColor: isPlaying ? 'rgba(201, 169, 110, 0.06)' : 'transparent',
              }}
              onClick={() => handleAssignSong(song)}
              onMouseEnter={(e) => {
                if (!isPlaying) e.currentTarget.style.backgroundColor = 'rgba(232, 213, 163, 0.2)';
              }}
              onMouseLeave={(e) => {
                if (!isPlaying) e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              {/* Album art */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <img
                  src={song.album_art || song.image || ''}
                  alt=""
                  style={{
                    width: '50px',
                    height: '50px',
                    objectFit: 'cover',
                    backgroundColor: '#E8D5A3',
                  }}
                />
                {/* Play button overlay */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePlay(song);
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: isPlaying ? 'rgba(10,10,10,0.4)' : 'rgba(10,10,10,0.2)',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#FAFAF7',
                    fontSize: '1rem',
                    opacity: isPlaying ? 1 : 0,
                    transition: 'opacity 300ms',
                  }}
                  className="group-hover:!opacity-100"
                  onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={(e) => { if (!isPlaying) e.currentTarget.style.opacity = '0'; }}
                >
                  {isPlaying ? '||' : '\u25B6'}
                </button>
              </div>

              {/* Song info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 400,
                    fontSize: '0.9rem',
                    color: '#0A0A0A',
                    lineHeight: 1.3,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {song.name}
                </p>
                <p
                  style={{
                    fontFamily: "'Josefin Sans', sans-serif",
                    fontWeight: 200,
                    fontSize: '0.65rem',
                    color: '#8A8478',
                    letterSpacing: '0.1em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {song.artist || song.artists?.[0]?.name || ''}
                </p>
              </div>

              {/* Duration */}
              <span
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 200,
                  fontSize: '0.6rem',
                  color: '#8A8478',
                  flexShrink: 0,
                }}
              >
                {formatDurationMs(song.duration_ms)}
              </span>
            </div>
          );
        })}

        {results.length === 0 && !searching && (
          <p
            style={{
              textAlign: 'center',
              padding: '40px 20px',
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: '0.85rem',
              color: '#8A8478',
              lineHeight: 1.8,
            }}
          >
            Search for a song to pair with this page
          </p>
        )}
      </div>

      {/* Audio progress bar (when playing) */}
      {playingId && (
        <div style={{ padding: '12px 20px', borderTop: '1px solid #E8D5A3' }}>
          <div
            onClick={handleProgressClick}
            style={{
              width: '100%',
              height: '4px',
              backgroundColor: '#E8D5A3',
              cursor: 'pointer',
              position: 'relative',
            }}
          >
            <motion.div
              style={{
                height: '100%',
                backgroundColor: '#C9A96E',
                width: duration ? `${(progress / duration) * 100}%` : '0%',
              }}
              transition={{ duration: 0.1 }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '4px',
            }}
          >
            <span
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 200,
                fontSize: '0.5rem',
                color: '#8A8478',
              }}
            >
              {formatTime(progress)}
            </span>
            <span
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 200,
                fontSize: '0.5rem',
                color: '#8A8478',
              }}
            >
              {formatTime(duration)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
