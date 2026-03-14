import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import useMusicStore from '../../store/musicStore';
import { getBooks, getPages, searchMusic } from '../../services/api';

const LUXURY_EASE = [0.645, 0.045, 0.355, 1];

/* ── Colour palette ──────────────────────────────────────── */
const GOLD = '#C9A96E';
const BLACK = '#0A0A0A';
const CREAM = '#F5F0E8';
const WARM_GRAY = '#8A8478';

/**
 * Slide-in panel from the right side showing the current playlist
 * and music discovery grouped by travel destination.
 */
export default function PlaylistDrawer() {
  const isOpen = useMusicStore((s) => s.isPlaylistOpen);
  const togglePlaylist = useMusicStore((s) => s.togglePlaylist);
  const play = useMusicStore((s) => s.play);
  const currentTrack = useMusicStore((s) => s.currentTrack);

  const [activeTab, setActiveTab] = useState('songs');
  const [mySongs, setMySongs] = useState([]);
  const [discoverGroups, setDiscoverGroups] = useState([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [loadingDiscover, setLoadingDiscover] = useState(false);

  /* ── Mis Canciones: gather songs from book pages ───────── */
  const loadMySongs = useCallback(async () => {
    setLoadingSongs(true);
    try {
      const books = await getBooks();
      const groups = [];

      for (const book of books) {
        const pages = await getPages(book.id);
        const songsForBook = pages
          .filter(
            (p) =>
              p.song_name || p.song_preview_url || p.song_artist,
          )
          .map((p) => ({
            id: p.id,
            name: p.song_name || 'Unknown',
            artist: p.song_artist || '',
            album: p.song_album || '',
            album_art: p.song_album_art || p.song_image || '',
            preview_url: p.song_preview_url || '',
            duration_ms: p.song_duration_ms || 30000,
          }));

        if (songsForBook.length > 0) {
          groups.push({ bookName: book.title || book.name || 'Untitled', songs: songsForBook });
        }
      }

      setMySongs(groups);
    } catch (err) {
      console.error('Failed to load songs from books:', err);
    } finally {
      setLoadingSongs(false);
    }
  }, []);

  /* ── Descubrir: search music by destination ────────────── */
  const loadDiscover = useCallback(async () => {
    setLoadingDiscover(true);
    try {
      const books = await getBooks();
      const groups = [];

      for (const book of books) {
        const city = book.city || book.title || book.name || '';
        const country = book.country || '';
        if (!city) continue;

        const query = country
          ? `${city} ${country} music`
          : `${city} music`;

        try {
          const results = await searchMusic(query, 5);
          const tracks = (results.tracks || results || []).map((t) => ({
            id: t.id,
            name: t.name,
            artist:
              t.artist ||
              (t.artists && t.artists[0]?.name) ||
              '',
            album: t.album || '',
            album_art:
              t.album_art ||
              t.image ||
              (t.album_images && t.album_images[0]?.url) ||
              '',
            preview_url: t.preview_url || '',
            duration_ms: t.duration_ms || 30000,
          }));

          if (tracks.length > 0) {
            groups.push({
              destination: city + (country ? `, ${country}` : ''),
              songs: tracks,
            });
          }
        } catch {
          // Skip destinations that fail search
        }
      }

      setDiscoverGroups(groups);
    } catch (err) {
      console.error('Failed to load discover music:', err);
    } finally {
      setLoadingDiscover(false);
    }
  }, []);

  /* ── Fetch data when tab becomes active ────────────────── */
  useEffect(() => {
    if (!isOpen) return;
    if (activeTab === 'songs' && mySongs.length === 0) loadMySongs();
    if (activeTab === 'discover' && discoverGroups.length === 0) loadDiscover();
  }, [isOpen, activeTab, mySongs.length, discoverGroups.length, loadMySongs, loadDiscover]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop overlay ──────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={togglePlaylist}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9400,
              backgroundColor: 'rgba(10,10,10,0.5)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* ── Drawer panel ─────────────────────────────── */}
          <motion.aside
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ duration: 0.4, ease: LUXURY_EASE }}
            style={{
              position: 'fixed',
              top: 0,
              right: 0,
              bottom: 0,
              width: '380px',
              maxWidth: '100vw',
              zIndex: 9500,
              backgroundColor: CREAM,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {/* ── Header ──────────────────────────────────── */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '28px 24px 16px',
                borderBottom: `1px solid ${GOLD}33`,
              }}
            >
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 500,
                  fontSize: '22px',
                  letterSpacing: '0.15em',
                  color: BLACK,
                  margin: 0,
                }}
              >
                PLAYLIST
              </h2>
              <button
                onClick={togglePlaylist}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '22px',
                  color: WARM_GRAY,
                  padding: '4px 8px',
                  transition: 'color 200ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = BLACK)}
                onMouseLeave={(e) => (e.currentTarget.style.color = WARM_GRAY)}
              >
                &times;
              </button>
            </div>

            {/* ── Tab bar ─────────────────────────────────── */}
            <div
              style={{
                display: 'flex',
                padding: '0 24px',
                gap: '4px',
                borderBottom: `1px solid ${GOLD}22`,
              }}
            >
              <TabButton
                active={activeTab === 'songs'}
                onClick={() => setActiveTab('songs')}
              >
                Mis Canciones
              </TabButton>
              <TabButton
                active={activeTab === 'discover'}
                onClick={() => setActiveTab('discover')}
              >
                Descubrir
              </TabButton>
            </div>

            {/* ── Tab content ─────────────────────────────── */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px 100px' }}>
              {activeTab === 'songs' && (
                <SongsTab
                  groups={mySongs}
                  loading={loadingSongs}
                  onPlay={play}
                  currentTrack={currentTrack}
                />
              )}
              {activeTab === 'discover' && (
                <DiscoverTab
                  groups={discoverGroups}
                  loading={loadingDiscover}
                  onPlay={play}
                  currentTrack={currentTrack}
                />
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

/* ═══════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════ */

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        borderBottom: active ? `2px solid ${GOLD}` : '2px solid transparent',
        cursor: 'pointer',
        fontFamily: "'Josefin Sans', sans-serif",
        fontWeight: active ? 500 : 300,
        fontSize: '12px',
        letterSpacing: '0.08em',
        color: active ? BLACK : WARM_GRAY,
        padding: '12px 16px',
        transition: 'all 200ms',
      }}
    >
      {children}
    </button>
  );
}

/* ── Mis Canciones tab ────────────────────────────────────── */
function SongsTab({ groups, loading, onPlay, currentTrack }) {
  if (loading) return <LoadingState />;

  if (groups.length === 0) {
    return (
      <EmptyState message="No songs found in your travel books yet. Add music to your pages to see them here." />
    );
  }

  return groups.map((group) => (
    <div key={group.bookName} style={{ marginBottom: '24px' }}>
      <GroupHeader>{group.bookName}</GroupHeader>
      {group.songs.map((song) => (
        <SongRow
          key={song.id}
          song={song}
          onPlay={onPlay}
          isActive={currentTrack?.id === song.id}
        />
      ))}
    </div>
  ));
}

/* ── Descubrir tab ────────────────────────────────────────── */
function DiscoverTab({ groups, loading, onPlay, currentTrack }) {
  if (loading) return <LoadingState />;

  if (groups.length === 0) {
    return (
      <EmptyState message="No destinations found. Create travel books with cities to discover local music." />
    );
  }

  return groups.map((group) => (
    <div key={group.destination} style={{ marginBottom: '24px' }}>
      <GroupHeader>{group.destination}</GroupHeader>
      {group.songs.map((song) => (
        <SongRow
          key={song.id}
          song={song}
          onPlay={onPlay}
          isActive={currentTrack?.id === song.id}
        />
      ))}
    </div>
  ));
}

/* ── Shared UI pieces ─────────────────────────────────────── */

function GroupHeader({ children }) {
  return (
    <h3
      style={{
        fontFamily: "'Cormorant Garamond', serif",
        fontWeight: 600,
        fontSize: '14px',
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: GOLD,
        margin: '0 0 10px',
      }}
    >
      {children}
    </h3>
  );
}

function SongRow({ song, onPlay, isActive }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        padding: '8px 0',
        borderBottom: `1px solid ${GOLD}11`,
      }}
    >
      {/* Album art */}
      {song.album_art ? (
        <img
          src={song.album_art}
          alt=""
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '3px',
            objectFit: 'cover',
            flexShrink: 0,
          }}
        />
      ) : (
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '3px',
            backgroundColor: `${WARM_GRAY}22`,
            flexShrink: 0,
          }}
        />
      )}

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: isActive ? 500 : 300,
            fontSize: '12px',
            color: isActive ? GOLD : BLACK,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            margin: 0,
            transition: 'color 200ms',
          }}
        >
          {song.name}
        </p>
        <p
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 200,
            fontSize: '10px',
            color: WARM_GRAY,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            margin: '2px 0 0',
          }}
        >
          {song.artist}
        </p>
      </div>

      {/* Play button */}
      <button
        onClick={() => onPlay(song)}
        style={{
          background: 'none',
          border: 'none',
          cursor: song.preview_url ? 'pointer' : 'default',
          fontSize: '14px',
          color: song.preview_url ? GOLD : `${WARM_GRAY}55`,
          padding: '4px 8px',
          flexShrink: 0,
          transition: 'opacity 200ms',
          opacity: song.preview_url ? 1 : 0.4,
        }}
        disabled={!song.preview_url}
        title={song.preview_url ? 'Play' : 'No preview available'}
        onMouseEnter={(e) => {
          if (song.preview_url) e.currentTarget.style.opacity = '0.7';
        }}
        onMouseLeave={(e) => {
          if (song.preview_url) e.currentTarget.style.opacity = '1';
        }}
      >
        {isActive ? '\u266B' : '\u25B6'}
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <p
      style={{
        fontFamily: "'Josefin Sans', sans-serif",
        fontWeight: 300,
        fontSize: '12px',
        color: WARM_GRAY,
        textAlign: 'center',
        padding: '40px 0',
        letterSpacing: '0.1em',
      }}
    >
      Loading...
    </p>
  );
}

function EmptyState({ message }) {
  return (
    <p
      style={{
        fontFamily: "'Josefin Sans', sans-serif",
        fontWeight: 300,
        fontSize: '12px',
        color: WARM_GRAY,
        textAlign: 'center',
        padding: '40px 20px',
        lineHeight: 1.6,
        letterSpacing: '0.03em',
      }}
    >
      {message}
    </p>
  );
}
