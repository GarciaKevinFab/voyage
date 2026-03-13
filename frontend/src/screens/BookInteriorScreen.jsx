import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useBookStore from '../store/bookStore';
import useAppStore from '../store/appStore';
import usePages from '../hooks/usePages';
import * as api from '../services/api';
import PageSidebar from '../components/interior/PageSidebar';
import PagePreview from '../components/interior/PagePreview';
import MusicPanel from '../components/interior/MusicPanel';
import MapPickerPanel from '../components/interior/MapPickerPanel';

export default function BookInteriorScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentBook, setCurrentBook, setCurrentPage, currentPage } = useBookStore();
  const { sidePanel, setSidePanel, setLoading, addToast } = useAppStore();
  const { pages, createPage, updatePage, deletePage, reorderPages } = usePages(id);

  const [editingField, setEditingField] = useState(null);
  const [editValue, setEditValue] = useState('');

  // Load book on mount
  useEffect(() => {
    let cancelled = false;
    async function loadBook() {
      try {
        const book = await api.getBook(id);
        if (!cancelled) {
          setCurrentBook(book);
          // Select first page if none selected
          if (!currentPage && book) {
            const pagesData = await api.getPages(id);
            if (pagesData.length > 0 && !cancelled) {
              setCurrentPage(pagesData[0]);
            }
          }
        }
      } catch (err) {
        if (!cancelled) {
          addToast({ type: 'error', message: 'Failed to load book' });
        }
      }
    }
    loadBook();
    return () => { cancelled = true; };
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-select first page when pages load
  useEffect(() => {
    if (pages.length > 0 && !currentPage) {
      setCurrentPage(pages[0]);
    }
  }, [pages]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExportPDF = useCallback(async () => {
    setLoading(true, 'Generating PDF...');
    try {
      const blob = await api.exportPDF(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentBook?.city || 'voyage'}-book.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'PDF exported successfully' });
    } catch {
      addToast({ type: 'error', message: 'Failed to export PDF' });
    } finally {
      setLoading(false);
    }
  }, [id, currentBook, setLoading, addToast]);

  const handleExportAssouline = useCallback(async () => {
    setLoading(true, 'Exporting .assouline...');
    try {
      const blob = await api.exportAssouline(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${currentBook?.city || 'voyage'}-book.assouline`;
      a.click();
      URL.revokeObjectURL(url);
      addToast({ type: 'success', message: 'Exported successfully' });
    } catch {
      addToast({ type: 'error', message: 'Failed to export' });
    } finally {
      setLoading(false);
    }
  }, [id, currentBook, setLoading, addToast]);

  const handleGenerateEpilogue = useCallback(async () => {
    setLoading(true, 'Writing epilogue...');
    try {
      const result = await api.getEpilogue(id);
      setCurrentBook({ ...currentBook, ...result });
      addToast({ type: 'success', message: 'Epilogue generated' });
    } catch {
      addToast({ type: 'error', message: 'Failed to generate epilogue' });
    } finally {
      setLoading(false);
    }
  }, [id, currentBook, setCurrentBook, setLoading, addToast]);

  const handleInlineEdit = useCallback((field, value) => {
    setEditingField(field);
    setEditValue(value || '');
  }, []);

  const handleInlineSave = useCallback(async () => {
    if (!editingField) return;

    try {
      if (editingField === 'intro' || editingField === 'epilogue') {
        const updated = await api.updateBook(id, { [editingField]: editValue });
        setCurrentBook({ ...currentBook, ...updated });
      } else if (editingField === 'caption' && currentPage) {
        await updatePage(currentPage.id, { caption: editValue });
        setCurrentPage({ ...currentPage, caption: editValue });
      }
    } catch {
      addToast({ type: 'error', message: 'Failed to save' });
    }
    setEditingField(null);
    setEditValue('');
  }, [editingField, editValue, id, currentBook, currentPage, setCurrentBook, setCurrentPage, updatePage, addToast]);

  const formatDates = () => {
    if (!currentBook) return '';
    const start = currentBook.start_date
      ? new Date(currentBook.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    const end = currentBook.end_date
      ? new Date(currentBook.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })
      : '';
    if (start && end) return `${start} - ${end}`;
    return start || end;
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden" style={{ backgroundColor: '#F5F0E8' }}>
      {/* ── Left Sidebar ─────────────────────────────── */}
      <PageSidebar
        pages={pages}
        currentPage={currentPage}
        onSelectPage={setCurrentPage}
        onReorder={reorderPages}
        onCreatePage={createPage}
        onGenerateEpilogue={handleGenerateEpilogue}
        bookId={id}
      />

      {/* ── Main Area ────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-10 py-6 border-b" style={{ borderColor: '#E8D5A3' }}>
          <div>
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', serif",
                fontWeight: 300,
                fontSize: '1.75rem',
                letterSpacing: '0.5em',
                color: '#0A0A0A',
                lineHeight: 1.8,
                textTransform: 'uppercase',
              }}
            >
              {currentBook?.city || ''}{currentBook?.country ? `, ${currentBook.country}` : ''}
            </h1>
            <p
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 200,
                fontSize: '0.75rem',
                color: '#8A8478',
                letterSpacing: '0.2em',
                marginTop: '2px',
              }}
            >
              {formatDates()}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(`/book/${id}/read`)}
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 300,
                fontSize: '0.7rem',
                letterSpacing: '0.25em',
                color: '#0A0A0A',
                background: 'transparent',
                border: '1px solid #0A0A0A',
                padding: '8px 20px',
                cursor: 'pointer',
                transition: 'all 400ms cubic-bezier(0.645, 0.045, 0.355, 1)',
                textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#0A0A0A';
                e.currentTarget.style.color = '#F5F0E8';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#0A0A0A';
              }}
            >
              Leer
            </button>

            <button
              onClick={handleExportPDF}
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 300,
                fontSize: '0.7rem',
                letterSpacing: '0.25em',
                color: '#8A8478',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 300ms',
                textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#C9A96E'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8478'; }}
            >
              Exportar PDF
            </button>

            <button
              onClick={handleExportAssouline}
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 300,
                fontSize: '0.7rem',
                letterSpacing: '0.25em',
                color: '#8A8478',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 300ms',
                textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#C9A96E'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8478'; }}
            >
              Exportar .Assouline
            </button>

            <button
              onClick={() => navigate('/')}
              style={{
                fontFamily: "'Josefin Sans', sans-serif",
                fontWeight: 300,
                fontSize: '0.7rem',
                letterSpacing: '0.25em',
                color: '#8A8478',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                transition: 'color 300ms',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                textTransform: 'uppercase',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = '#0A0A0A'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8478'; }}
            >
              <span style={{ fontSize: '1rem' }}>&larr;</span> Volver
            </button>
          </div>
        </header>

        {/* Preview Area */}
        <div className="flex-1 overflow-auto flex items-center justify-center relative">
          {currentPage ? (
            <PagePreview
              page={currentPage}
              book={currentBook}
              onUpdatePage={updatePage}
              onDeletePage={deletePage}
              onSetCurrentPage={setCurrentPage}
              onOpenPanel={setSidePanel}
              editingField={editingField}
              editValue={editValue}
              onEditField={handleInlineEdit}
              onEditValueChange={setEditValue}
              onEditSave={handleInlineSave}
              pages={pages}
            />
          ) : (
            <div className="text-center">
              <p
                style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontWeight: 300,
                  fontSize: '1.25rem',
                  color: '#8A8478',
                  letterSpacing: '0.2em',
                }}
              >
                Add your first photo to begin
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── Side Panels ──────────────────────────────── */}
      <AnimatePresence>
        {sidePanel === 'music' && (
          <motion.div
            key="music-panel"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.645, 0.045, 0.355, 1] }}
            className="h-full"
            style={{ position: 'relative', zIndex: 30 }}
          >
            <MusicPanel
              page={currentPage}
              onUpdatePage={updatePage}
              onSetCurrentPage={setCurrentPage}
              onClose={() => setSidePanel('music')}
            />
          </motion.div>
        )}

        {sidePanel === 'map' && (
          <motion.div
            key="map-panel"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.645, 0.045, 0.355, 1] }}
            className="h-full"
            style={{ position: 'relative', zIndex: 30 }}
          >
            <MapPickerPanel
              page={currentPage}
              onUpdatePage={updatePage}
              onSetCurrentPage={setCurrentPage}
              onClose={() => setSidePanel('map')}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
