import React, { useState, useCallback, useRef, useEffect } from 'react';
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
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';

import useBookStore from '../store/bookStore';
import useAppStore from '../store/appStore';
import useBooks from '../hooks/useBooks';
import * as api from '../services/api';

import ParticleField from '../components/bookshelf/ParticleField';
import ShelfBase from '../components/bookshelf/ShelfBase';
import BookSpine from '../components/bookshelf/BookSpine';
import BookCreatorScreen from './BookCreatorScreen';

const pulseKeyframes = `
@keyframes empty-pulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
`;

export default function BookshelfScreen() {
  const navigate = useNavigate();
  const { books, setBooks, setCurrentBook } = useBookStore();
  const { addToast, setLoading, setLoadingMessage } = useAppStore();
  const { books: loadedBooks, createBook, deleteBook, reorderBooks } = useBooks();

  const [showCreator, setShowCreator] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [addBtnHovered, setAddBtnHovered] = useState(false);
  const [globeHovered, setGlobeHovered] = useState(false);
  const [importHovered, setImportHovered] = useState(false);
  const [puzzleHovered, setPuzzleHovered] = useState(false);
  const [tetrisHovered, setTetrisHovered] = useState(false);

  const fileInputRef = useRef(null);

  // Close context menu on outside click
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', handleClick);
      return () => window.removeEventListener('click', handleClick);
    }
  }, [contextMenu]);

  // ── DnD sensors ─────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = useCallback(
    async (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = books.findIndex((b) => b.id === active.id);
      const newIndex = books.findIndex((b) => b.id === over.id);
      const newOrder = arrayMove(books, oldIndex, newIndex);

      setBooks(newOrder);

      try {
        await reorderBooks(newOrder.map((b) => b.id));
      } catch (err) {
        // reorderBooks already shows a toast
      }
    },
    [books, setBooks, reorderBooks]
  );

  // ── Spine click ─────────────────────────────────────────
  const handleSpineClick = useCallback(
    (book) => {
      setCurrentBook(book);
      navigate(`/book/${book.id}`);
    },
    [setCurrentBook, navigate]
  );

  // ── Context menu ────────────────────────────────────────
  const handleContextMenu = useCallback((e, book) => {
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      book,
    });
  }, []);

  const handleRename = useCallback(() => {
    if (!contextMenu) return;
    const book = contextMenu.book;
    const newName = prompt('New country name:', book.country);
    if (newName && newName.trim()) {
      api
        .updateBook(book.id, { country: newName.trim() })
        .then((updated) => {
          setBooks(books.map((b) => (b.id === book.id ? { ...b, ...updated } : b)));
          addToast({ type: 'success', message: 'Book renamed' });
        })
        .catch(() => addToast({ type: 'error', message: 'Failed to rename' }));
    }
    setContextMenu(null);
  }, [contextMenu, books, setBooks, addToast]);

  const handleDuplicate = useCallback(async () => {
    if (!contextMenu) return;
    const book = contextMenu.book;
    setContextMenu(null);
    try {
      setLoading(true, 'Duplicating book...');
      const newBook = await api.createBook({
        country: `${book.country} (Copy)`,
        city: book.city,
        start_date: book.start_date,
        end_date: book.end_date,
        subtitle: book.subtitle,
        spine_color: book.spine_color,
      });
      setBooks([...books, newBook]);
      addToast({ type: 'success', message: 'Book duplicated' });
    } catch {
      addToast({ type: 'error', message: 'Failed to duplicate' });
    } finally {
      setLoading(false);
    }
  }, [contextMenu, books, setBooks, addToast, setLoading]);

  const handleExportAssouline = useCallback(async () => {
    if (!contextMenu) return;
    const book = contextMenu.book;
    setContextMenu(null);
    try {
      const blob = await api.exportAssouline(book.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${book.country}-${book.city}.assouline`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'Exported successfully' });
    } catch {
      addToast({ type: 'error', message: 'Failed to export' });
    }
  }, [contextMenu, addToast]);

  const handleDelete = useCallback(async () => {
    if (!contextMenu) return;
    const book = contextMenu.book;
    setContextMenu(null);
    if (!confirm(`Delete "${book.country} - ${book.city}"? This cannot be undone.`)) return;
    try {
      await deleteBook(book.id);
    } catch {
      // deleteBook already shows a toast
    }
  }, [contextMenu, deleteBook]);

  // ── Import ──────────────────────────────────────────────
  const handleImport = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      e.target.value = '';

      try {
        setLoading(true, 'Importing book...');
        const imported = await api.importAssouline(file);
        setBooks([...books, imported]);
        addToast({ type: 'success', message: 'Book imported successfully' });
      } catch {
        addToast({ type: 'error', message: 'Failed to import book' });
      } finally {
        setLoading(false);
      }
    },
    [books, setBooks, addToast, setLoading]
  );

  // ── Book created callback ──────────────────────────────
  const handleBookCreated = useCallback(
    (newBook) => {
      setShowCreator(false);
      // Reload books to get the fresh list
      api
        .getBooks()
        .then((data) => setBooks(data))
        .catch(() => {
          // Fallback: just append
          setBooks([...books, newBook]);
        });
    },
    [books, setBooks]
  );

  // ── Context menu item styles ───────────────────────────
  const menuItemStyle = {
    padding: '10px 20px',
    cursor: 'pointer',
    fontFamily: "'Josefin Sans', sans-serif",
    fontWeight: 300,
    fontSize: '12px',
    letterSpacing: '0.15em',
    color: '#F5F0E8',
    transition: 'background-color 300ms ease',
    whiteSpace: 'nowrap',
  };

  return (
    <>
      <style>{pulseKeyframes}</style>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: '#0A0A0A',
          overflow: 'hidden',
        }}
      >
        {/* Particles */}
        <ParticleField />

        {/* ── Header ─────────────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '40px',
          }}
        >
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 300,
              fontSize: '42px',
              letterSpacing: '0.8em',
              color: '#C9A96E',
              textTransform: 'uppercase',
              marginRight: '-0.8em', // compensate letter-spacing
            }}
          >
            VOYAGE
          </h1>
          <p
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 200,
              fontSize: '11px',
              letterSpacing: '0.4em',
              color: '#8A8478',
              textTransform: 'uppercase',
              marginTop: '8px',
              marginRight: '-0.4em',
            }}
          >
            YOUR TRAVEL LIBRARY
          </p>
        </div>

        {/* ── Top-right icons ────────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            top: '28px',
            right: '28px',
            zIndex: 20,
            display: 'flex',
            gap: '16px',
            alignItems: 'center',
          }}
        >
          {/* Import button */}
          <button
            onClick={handleImport}
            onMouseEnter={() => setImportHovered(true)}
            onMouseLeave={() => setImportHovered(false)}
            title="Import .assouline"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              transition: 'opacity 300ms ease',
              opacity: importHovered ? 1 : 0.5,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke={importHovered ? '#C9A96E' : '#8A8478'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'stroke 300ms ease' }}
            >
              <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>

          {/* Puzzle */}
          <button
            onClick={() => navigate('/puzzle')}
            onMouseEnter={() => setPuzzleHovered(true)}
            onMouseLeave={() => setPuzzleHovered(false)}
            title="Puzzle"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              transition: 'opacity 300ms ease',
              opacity: puzzleHovered ? 1 : 0.5,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={puzzleHovered ? '#C9A96E' : '#8A8478'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'stroke 300ms ease' }}
            >
              <rect x="2" y="2" width="9" height="9" rx="1" />
              <rect x="13" y="2" width="9" height="9" rx="1" />
              <rect x="2" y="13" width="9" height="9" rx="1" />
              <rect x="13" y="13" width="9" height="9" rx="1" />
              <line x1="11" y1="6.5" x2="13" y2="6.5" />
              <line x1="6.5" y1="11" x2="6.5" y2="13" />
              <line x1="17.5" y1="11" x2="17.5" y2="13" />
              <line x1="11" y1="17.5" x2="13" y2="17.5" />
            </svg>
          </button>

          {/* Tetris */}
          <button
            onClick={() => navigate('/tetris')}
            onMouseEnter={() => setTetrisHovered(true)}
            onMouseLeave={() => setTetrisHovered(false)}
            title="Tetris"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              transition: 'opacity 300ms ease',
              opacity: tetrisHovered ? 1 : 0.5,
            }}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={tetrisHovered ? '#C9A96E' : '#8A8478'}
              style={{ transition: 'fill 300ms ease' }}
            >
              <rect x="4" y="2" width="7" height="7" rx="1" />
              <rect x="13" y="2" width="7" height="7" rx="1" />
              <rect x="4" y="11" width="7" height="7" rx="1" />
              <rect x="13" y="15" width="7" height="7" rx="1" />
            </svg>
          </button>

          {/* Globe → Dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            onMouseEnter={() => setGlobeHovered(true)}
            onMouseLeave={() => setGlobeHovered(false)}
            title="Dashboard"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              transition: 'opacity 300ms ease',
              opacity: globeHovered ? 1 : 0.5,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke={globeHovered ? '#C9A96E' : '#8A8478'}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ transition: 'stroke 300ms ease' }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
            </svg>
          </button>
        </div>

        {/* Hidden file input for import */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".assouline"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* ── Book spines area ───────────────────────────── */}
        <div
          style={{
            position: 'absolute',
            bottom: '80px',
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '4px',
            padding: '0 40px',
            zIndex: 5,
          }}
        >
          {books.length === 0 ? (
            /* ── Empty state — rich landing ── */
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2 }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '75vh',
                gap: '40px',
                textAlign: 'center',
                padding: '0 24px',
              }}
            >
              {/* Decorative gold line */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 60 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                style={{ height: '1px', backgroundColor: '#C9A96E' }}
              />

              {/* Main message */}
              <div>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  style={{
                    fontFamily: "'Cormorant Garamond', serif",
                    fontWeight: 300,
                    fontSize: '28px',
                    color: '#F5F0E8',
                    letterSpacing: '0.15em',
                    margin: 0,
                    lineHeight: 1.4,
                  }}
                >
                  Tu primera aventura te espera
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.7 }}
                  style={{
                    fontFamily: "'Josefin Sans', sans-serif",
                    fontWeight: 200,
                    fontSize: '12px',
                    letterSpacing: '0.35em',
                    textTransform: 'uppercase',
                    color: '#8A8478',
                    marginTop: '16px',
                  }}
                >
                  Crea tu primer album o explora los juegos
                </motion.p>
              </div>

              {/* CTA button */}
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9 }}
                onClick={() => setShowCreator(true)}
                style={{
                  fontFamily: "'Josefin Sans', sans-serif",
                  fontWeight: 300,
                  fontSize: '12px',
                  letterSpacing: '0.35em',
                  textTransform: 'uppercase',
                  color: '#0A0A0A',
                  backgroundColor: '#C9A96E',
                  border: 'none',
                  padding: '14px 40px',
                  cursor: 'pointer',
                  transition: 'all 400ms cubic-bezier(0.645, 0.045, 0.355, 1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#D4B87A';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(201,169,110,0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#C9A96E';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                + Crear Album
              </motion.button>

              {/* Quick links row */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 1.1 }}
                style={{
                  display: 'flex',
                  gap: '32px',
                  alignItems: 'center',
                }}
              >
                {[
                  { label: 'Puzzle', route: '/puzzle', icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="9" height="9" rx="1" />
                      <rect x="13" y="2" width="9" height="9" rx="1" />
                      <rect x="2" y="13" width="9" height="9" rx="1" />
                      <rect x="13" y="13" width="9" height="9" rx="1" />
                    </svg>
                  )},
                  { label: 'Tetris', route: '/tetris', icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="4" y="2" width="7" height="7" rx="1" />
                      <rect x="13" y="2" width="7" height="7" rx="1" />
                      <rect x="4" y="11" width="7" height="7" rx="1" />
                      <rect x="13" y="15" width="7" height="7" rx="1" />
                    </svg>
                  )},
                  { label: 'Dashboard', route: '/dashboard', icon: (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
                    </svg>
                  )},
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={() => navigate(item.route)}
                    style={{
                      background: 'none',
                      border: '1px solid rgba(201,169,110,0.2)',
                      cursor: 'pointer',
                      padding: '12px 20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      color: '#8A8478',
                      fontFamily: "'Josefin Sans', sans-serif",
                      fontWeight: 300,
                      fontSize: '11px',
                      letterSpacing: '0.2em',
                      textTransform: 'uppercase',
                      transition: 'all 400ms ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#C9A96E';
                      e.currentTarget.style.color = '#C9A96E';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)';
                      e.currentTarget.style.color = '#8A8478';
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </motion.div>

              {/* Bottom decorative line */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: 40 }}
                transition={{ duration: 0.6, delay: 1.3 }}
                style={{ height: '1px', backgroundColor: 'rgba(201,169,110,0.3)' }}
              />
            </motion.div>
          ) : (
            /* ── Sortable spines ── */
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={books.map((b) => b.id)}
                strategy={horizontalListSortingStrategy}
              >
                {books.map((book) => (
                  <BookSpine
                    key={book.id}
                    book={book}
                    onClick={handleSpineClick}
                    onContextMenu={handleContextMenu}
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>

        {/* ── Shelf base ─────────────────────────────────── */}
        <ShelfBase />

        {/* ── Add button ─────────────────────────────────── */}
        <button
          onClick={() => setShowCreator(true)}
          onMouseEnter={() => setAddBtnHovered(true)}
          onMouseLeave={() => setAddBtnHovered(false)}
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            width: '56px',
            height: '56px',
            borderRadius: '2px',
            border: '1px solid #C9A96E',
            backgroundColor: addBtnHovered ? '#C9A96E' : 'transparent',
            color: addBtnHovered ? '#0A0A0A' : '#C9A96E',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 200,
            transition: 'all 300ms cubic-bezier(0.645, 0.045, 0.355, 1.000)',
            zIndex: 20,
            lineHeight: 1,
          }}
        >
          +
        </button>

        {/* ── Context Menu ───────────────────────────────── */}
        <AnimatePresence>
          {contextMenu && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              style={{
                position: 'fixed',
                top: contextMenu.y,
                left: contextMenu.x,
                backgroundColor: 'rgba(20, 16, 10, 0.95)',
                border: '1px solid rgba(201, 169, 110, 0.3)',
                borderRadius: '2px',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                zIndex: 200,
                overflow: 'hidden',
                minWidth: '180px',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {[
                { label: 'Rename', action: handleRename },
                { label: 'Duplicate', action: handleDuplicate },
                { label: 'Export .assouline', action: handleExportAssouline },
                { divider: true },
                { label: 'Delete', action: handleDelete, danger: true },
              ].map((item, i) =>
                item.divider ? (
                  <div
                    key={`div-${i}`}
                    style={{
                      height: '1px',
                      backgroundColor: 'rgba(201, 169, 110, 0.15)',
                      margin: '4px 0',
                    }}
                  />
                ) : (
                  <div
                    key={item.label}
                    onClick={item.action}
                    style={{
                      ...menuItemStyle,
                      color: item.danger ? '#C0392B' : '#F5F0E8',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = item.danger
                        ? 'rgba(192, 57, 43, 0.15)'
                        : 'rgba(201, 169, 110, 0.1)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    {item.label}
                  </div>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Book Creator Modal ──────────────────────────── */}
        <BookCreatorScreen
          isOpen={showCreator}
          onClose={() => setShowCreator(false)}
          onBookCreated={handleBookCreated}
        />
      </div>
    </>
  );
}
