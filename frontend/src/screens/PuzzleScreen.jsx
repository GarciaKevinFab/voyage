import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { motion, AnimatePresence } from 'framer-motion';

import * as api from '../services/api';
import usePuzzle from '../hooks/usePuzzle';

// ── Design tokens ──────────────────────────────────────
const GOLD = '#C9A96E';
const BLACK = '#0A0A0A';
const CREAM = '#F5F0E8';
const DARK_SURFACE = '#161616';
const FONT_SERIF = "'Cormorant Garamond', serif";
const FONT_SANS = "'Josefin Sans', sans-serif";

// ── Difficulty options ─────────────────────────────────
const DIFFICULTIES = [
  { label: 'Easy', grid: 3 },
  { label: 'Medium', grid: 4 },
  { label: 'Hard', grid: 5 },
];

// ── Helpers ────────────────────────────────────────────

function formatTime(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/** Generate a simple confetti array of particles */
function generateConfetti(count = 60) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 0.6,
    duration: 1.5 + Math.random() * 1.5,
    size: 4 + Math.random() * 6,
    color: [GOLD, '#FFD700', '#E8C547', '#B8860B', CREAM][
      Math.floor(Math.random() * 5)
    ],
  }));
}

// ═══════════════════════════════════════════════════════
//  PuzzleTile — single draggable tile
// ═══════════════════════════════════════════════════════

function PuzzleTile({ tile, imageUrl, gridSize, isComplete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tile.id });

  const isCorrect = tile.currentIndex === tile.correctIndex;
  const col = tile.correctIndex % gridSize;
  const row = Math.floor(tile.correctIndex / gridSize);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 200ms ease',
    backgroundImage: `url(${imageUrl})`,
    backgroundSize: `${gridSize * 100}% ${gridSize * 100}%`,
    backgroundPosition:
      gridSize === 1
        ? '0% 0%'
        : `${col * (100 / (gridSize - 1))}% ${row * (100 / (gridSize - 1))}%`,
    borderRadius: 4,
    cursor: isComplete ? 'default' : isDragging ? 'grabbing' : 'grab',
    opacity: isDragging ? 0.75 : 1,
    zIndex: isDragging ? 50 : 1,
    boxShadow: isDragging
      ? `0 8px 24px rgba(0,0,0,0.5), 0 0 0 2px ${GOLD}`
      : isCorrect && !isComplete
        ? `inset 0 0 0 2px ${GOLD}44, 0 0 8px ${GOLD}33`
        : '0 1px 3px rgba(0,0,0,0.4)',
    border: isComplete
      ? `2px solid ${GOLD}`
      : '2px solid transparent',
    width: '100%',
    height: '100%',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    />
  );
}

// ═══════════════════════════════════════════════════════
//  PuzzleBoard — CSS Grid of sortable tiles
// ═══════════════════════════════════════════════════════

function PuzzleBoard({ tiles, imageUrl, gridSize, isComplete, onDragEnd }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Build a sorted array of tile ids in their current display order
  const sortedTiles = useMemo(() => {
    const ordered = [...tiles].sort((a, b) => a.currentIndex - b.currentIndex);
    return ordered;
  }, [tiles]);

  const tileIds = useMemo(
    () => sortedTiles.map((t) => t.id),
    [sortedTiles]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={tileIds} strategy={rectSortingStrategy}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${gridSize}, 1fr)`,
            gap: 2,
            width: '100%',
            height: '100%',
            background: '#222',
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          {sortedTiles.map((tile) => (
            <PuzzleTile
              key={tile.id}
              tile={tile}
              imageUrl={imageUrl}
              gridSize={gridSize}
              isComplete={isComplete}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

// ═══════════════════════════════════════════════════════
//  Victory Overlay
// ═══════════════════════════════════════════════════════

function VictoryOverlay({ moves, elapsedTime, onPlayAgain, onExit }) {
  const confetti = useMemo(() => generateConfetti(60), []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        zIndex: 100,
      }}
    >
      {/* Confetti */}
      {confetti.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -20, x: `${p.x}vw`, opacity: 1 }}
          animate={{ y: '110vh', opacity: 0 }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'linear',
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: p.size,
            height: p.size,
            borderRadius: p.size > 7 ? '50%' : 1,
            background: p.color,
            pointerEvents: 'none',
          }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        style={{
          background: DARK_SURFACE,
          border: `2px solid ${GOLD}`,
          borderRadius: 16,
          padding: '48px 56px',
          textAlign: 'center',
          zIndex: 101,
          maxWidth: 400,
        }}
      >
        <h2
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 36,
            color: GOLD,
            margin: 0,
            letterSpacing: 4,
          }}
        >
          COMPLETE!
        </h2>
        <div
          style={{
            fontFamily: FONT_SANS,
            color: CREAM,
            fontSize: 16,
            marginTop: 24,
            lineHeight: 1.8,
          }}
        >
          <p style={{ margin: 0 }}>
            Time: <strong style={{ color: GOLD }}>{formatTime(elapsedTime)}</strong>
          </p>
          <p style={{ margin: 0 }}>
            Moves: <strong style={{ color: GOLD }}>{moves}</strong>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 32, justifyContent: 'center' }}>
          <button
            onClick={onPlayAgain}
            style={{
              fontFamily: FONT_SANS,
              fontSize: 14,
              padding: '10px 24px',
              background: GOLD,
              color: BLACK,
              border: 'none',
              borderRadius: 6,
              cursor: 'pointer',
              letterSpacing: 1,
              fontWeight: 600,
            }}
          >
            PLAY AGAIN
          </button>
          <button
            onClick={onExit}
            style={{
              fontFamily: FONT_SANS,
              fontSize: 14,
              padding: '10px 24px',
              background: 'transparent',
              color: CREAM,
              border: `1px solid ${CREAM}44`,
              borderRadius: 6,
              cursor: 'pointer',
              letterSpacing: 1,
            }}
          >
            EXIT
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════
//  PuzzleScreen — main export
// ═══════════════════════════════════════════════════════

export default function PuzzleScreen() {
  const navigate = useNavigate();

  // ── Selection state ────────────────────────────────
  const [phase, setPhase] = useState('selecting'); // 'selecting' | 'playing'
  const [books, setBooks] = useState([]);
  const [selectedBook, setSelectedBook] = useState(null);
  const [pages, setPages] = useState([]);
  const [loadingPages, setLoadingPages] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [gridSize, setGridSize] = useState(3);

  // ── Puzzle hook ────────────────────────────────────
  const puzzle = usePuzzle(selectedImage, gridSize);

  // ── Load books ─────────────────────────────────────
  useEffect(() => {
    api.getBooks().then(setBooks).catch(() => {});
  }, []);

  // ── Load pages when book selected ──────────────────
  useEffect(() => {
    if (!selectedBook) {
      setPages([]);
      return;
    }
    setLoadingPages(true);
    api
      .getPages(selectedBook.id)
      .then((data) => {
        setPages(data);
        setLoadingPages(false);
      })
      .catch(() => setLoadingPages(false));
  }, [selectedBook]);

  // ── Collect photo URLs from pages ─────────────────
  const photos = useMemo(() => {
    const urls = [];
    pages.forEach((p) => {
      if (p.photo_url) urls.push(p.photo_url);
      if (p.photo_url_2) urls.push(p.photo_url_2);
    });
    // Also add book cover if available
    if (selectedBook?.cover_url) {
      urls.unshift(selectedBook.cover_url);
    }
    return urls;
  }, [pages, selectedBook]);

  // ── Start the game ────────────────────────────────
  const startGame = useCallback(() => {
    if (!selectedImage) return;
    setPhase('playing');
    // Small delay so the component mounts first
    setTimeout(() => puzzle.initPuzzle(), 50);
  }, [selectedImage, puzzle]);

  // ── Handle drag end — swap tiles ──────────────────
  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      // Find current indices of the two tiles
      const activeTile = puzzle.tiles.find((t) => t.id === active.id);
      const overTile = puzzle.tiles.find((t) => t.id === over.id);
      if (!activeTile || !overTile) return;

      puzzle.swapTiles(activeTile.currentIndex, overTile.currentIndex);
    },
    [puzzle]
  );

  // ── Back from playing ─────────────────────────────
  const handleBackToSelect = useCallback(() => {
    puzzle.reset();
    setPhase('selecting');
  }, [puzzle]);

  // ════════════════════════════════════════════════════
  //  RENDER — Selecting Phase
  // ════════════════════════════════════════════════════

  if (phase === 'selecting') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: BLACK,
          color: CREAM,
          fontFamily: FONT_SANS,
          padding: '24px 32px',
          boxSizing: 'border-box',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 40,
          }}
        >
          <button
            onClick={() => navigate('/')}
            style={{
              background: 'none',
              border: 'none',
              color: CREAM,
              fontSize: 24,
              cursor: 'pointer',
              padding: '4px 8px',
            }}
            aria-label="Back"
          >
            &#8592;
          </button>
          <h1
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 32,
              color: GOLD,
              margin: 0,
              letterSpacing: 6,
              fontWeight: 400,
            }}
          >
            PUZZLE
          </h1>
        </div>

        {/* Step 1: Choose a book */}
        <section style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontFamily: FONT_SERIF,
              fontSize: 18,
              color: GOLD,
              letterSpacing: 3,
              marginBottom: 16,
              fontWeight: 400,
            }}
          >
            1. CHOOSE A BOOK
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 16,
            }}
          >
            {books.map((book) => (
              <button
                key={book.id}
                onClick={() => {
                  setSelectedBook(book);
                  setSelectedImage(null);
                }}
                style={{
                  background:
                    selectedBook?.id === book.id ? DARK_SURFACE : '#111',
                  border:
                    selectedBook?.id === book.id
                      ? `2px solid ${GOLD}`
                      : '2px solid #333',
                  borderRadius: 8,
                  padding: 0,
                  cursor: 'pointer',
                  overflow: 'hidden',
                  textAlign: 'center',
                  transition: 'border-color 0.2s',
                }}
              >
                {book.cover_url ? (
                  <img
                    src={book.cover_url}
                    alt={book.city}
                    style={{
                      width: '100%',
                      aspectRatio: '3/4',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      aspectRatio: '3/4',
                      background: book.spine_color || '#333',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      padding: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: FONT_SERIF,
                        fontSize: 16,
                        color: CREAM,
                      }}
                    >
                      {book.city}
                    </span>
                    <span
                      style={{
                        fontFamily: FONT_SANS,
                        fontSize: 11,
                        color: `${CREAM}99`,
                        marginTop: 4,
                      }}
                    >
                      {book.country}
                    </span>
                  </div>
                )}
              </button>
            ))}
            {books.length === 0 && (
              <p style={{ color: `${CREAM}66`, gridColumn: '1/-1' }}>
                No books yet. Create one first from the bookshelf.
              </p>
            )}
          </div>
        </section>

        {/* Step 2: Choose a photo */}
        {selectedBook && (
          <section style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 18,
                color: GOLD,
                letterSpacing: 3,
                marginBottom: 16,
                fontWeight: 400,
              }}
            >
              2. CHOOSE A PHOTO
            </h2>
            {loadingPages ? (
              <p style={{ color: `${CREAM}66` }}>Loading photos...</p>
            ) : photos.length === 0 ? (
              <p style={{ color: `${CREAM}66` }}>
                No photos in this book. Add some first.
              </p>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                  gap: 12,
                }}
              >
                {photos.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(url)}
                    style={{
                      padding: 0,
                      border:
                        selectedImage === url
                          ? `3px solid ${GOLD}`
                          : '3px solid transparent',
                      borderRadius: 6,
                      cursor: 'pointer',
                      overflow: 'hidden',
                      background: '#111',
                      transition: 'border-color 0.2s',
                    }}
                  >
                    <img
                      src={url}
                      alt={`Photo ${idx + 1}`}
                      style={{
                        width: '100%',
                        aspectRatio: '1',
                        objectFit: 'cover',
                        display: 'block',
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Step 3: Difficulty + Start */}
        {selectedImage && (
          <section style={{ marginBottom: 40 }}>
            <h2
              style={{
                fontFamily: FONT_SERIF,
                fontSize: 18,
                color: GOLD,
                letterSpacing: 3,
                marginBottom: 16,
                fontWeight: 400,
              }}
            >
              3. DIFFICULTY
            </h2>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {DIFFICULTIES.map((d) => (
                <button
                  key={d.grid}
                  onClick={() => setGridSize(d.grid)}
                  style={{
                    fontFamily: FONT_SANS,
                    fontSize: 14,
                    padding: '10px 28px',
                    background: gridSize === d.grid ? GOLD : 'transparent',
                    color: gridSize === d.grid ? BLACK : GOLD,
                    border: `2px solid ${GOLD}`,
                    borderRadius: 6,
                    cursor: 'pointer',
                    letterSpacing: 2,
                    fontWeight: 600,
                    transition: 'all 0.2s',
                  }}
                >
                  {d.label} ({d.grid}x{d.grid})
                </button>
              ))}
            </div>

            <button
              onClick={startGame}
              style={{
                marginTop: 32,
                fontFamily: FONT_SERIF,
                fontSize: 20,
                padding: '14px 48px',
                background: GOLD,
                color: BLACK,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
                letterSpacing: 4,
                fontWeight: 600,
              }}
            >
              START PUZZLE
            </button>
          </section>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════
  //  RENDER — Playing Phase
  // ════════════════════════════════════════════════════

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        background: BLACK,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        boxSizing: 'border-box',
      }}
    >
      {/* Top bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          flexShrink: 0,
        }}
      >
        <button
          onClick={handleBackToSelect}
          style={{
            background: 'none',
            border: 'none',
            color: CREAM,
            fontSize: 22,
            cursor: 'pointer',
            padding: '4px 8px',
          }}
          aria-label="Back"
        >
          &#8592;
        </button>

        <h1
          style={{
            fontFamily: FONT_SERIF,
            fontSize: 22,
            color: GOLD,
            margin: 0,
            letterSpacing: 6,
            fontWeight: 400,
          }}
        >
          PUZZLE
        </h1>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            fontFamily: FONT_SANS,
            fontSize: 14,
            color: CREAM,
          }}
        >
          <span style={{ letterSpacing: 1 }}>
            {formatTime(puzzle.elapsedTime)}
          </span>
          <span style={{ color: GOLD, letterSpacing: 1 }}>
            {puzzle.moves} moves
          </span>
        </div>
      </div>

      {/* Puzzle board — centered, square, responsive */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          style={{
            width: 'min(80vw, 80vh)',
            height: 'min(80vw, 80vh)',
          }}
        >
          {puzzle.tiles.length > 0 && (
            <PuzzleBoard
              tiles={puzzle.tiles}
              imageUrl={selectedImage}
              gridSize={gridSize}
              isComplete={puzzle.isComplete}
              onDragEnd={handleDragEnd}
            />
          )}
        </div>
      </div>

      {/* Victory overlay */}
      <AnimatePresence>
        {puzzle.isComplete && (
          <VictoryOverlay
            moves={puzzle.moves}
            elapsedTime={puzzle.elapsedTime}
            onPlayAgain={() => puzzle.initPuzzle()}
            onExit={handleBackToSelect}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
