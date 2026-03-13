import React, { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import PhotoUploader from './PhotoUploader';

/* ── Sortable Thumbnail Item ────────────────────────── */
function SortablePageThumb({ page, index, isSelected, onSelect }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: page.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 300ms cubic-bezier(0.645, 0.045, 0.355, 1)',
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative group cursor-pointer"
      onClick={() => onSelect(page)}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          opacity: 0,
          transition: 'opacity 300ms',
          zIndex: 5,
          color: '#8A8478',
          fontSize: '10px',
        }}
        className="group-hover:!opacity-100"
      >
        <svg width="8" height="20" viewBox="0 0 8 20" fill="currentColor">
          <circle cx="2" cy="4" r="1.2" />
          <circle cx="6" cy="4" r="1.2" />
          <circle cx="2" cy="10" r="1.2" />
          <circle cx="6" cy="10" r="1.2" />
          <circle cx="2" cy="16" r="1.2" />
          <circle cx="6" cy="16" r="1.2" />
        </svg>
      </div>

      {/* Thumbnail image */}
      <div
        style={{
          width: '100%',
          aspectRatio: '3/4',
          overflow: 'hidden',
          border: isSelected ? '2px solid #C9A96E' : '1px solid transparent',
          transition: 'border 300ms',
          position: 'relative',
          backgroundColor: page.image ? 'transparent' : '#E8D5A3',
        }}
      >
        {page.image ? (
          <img
            src={page.image}
            alt={`Page ${index + 1}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: page.filter || 'none',
            }}
          />
        ) : (
          <div
            className="flex items-center justify-center h-full"
            style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontStyle: 'italic',
              fontSize: '0.75rem',
              color: '#8A8478',
            }}
          >
            Text
          </div>
        )}

        {/* Page number */}
        <div
          style={{
            position: 'absolute',
            bottom: '4px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 200,
            fontSize: '0.6rem',
            color: '#FAFAF7',
            letterSpacing: '0.15em',
            textShadow: '0 1px 3px rgba(0,0,0,0.6)',
          }}
        >
          {index + 1}
        </div>

        {/* Indicators */}
        <div style={{ position: 'absolute', top: '4px', right: '4px', display: 'flex', gap: '3px' }}>
          {page.song && (
            <span
              style={{
                fontSize: '0.55rem',
                background: 'rgba(10,10,10,0.5)',
                color: '#C9A96E',
                padding: '1px 4px',
                lineHeight: 1.4,
              }}
            >
              &#9833;
            </span>
          )}
          {page.location && (
            <span
              style={{
                fontSize: '0.55rem',
                background: 'rgba(10,10,10,0.5)',
                color: '#C9A96E',
                padding: '1px 4px',
                lineHeight: 1.4,
              }}
            >
              &#128205;
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Main Sidebar ──────────────────────────────────── */
export default function PageSidebar({
  pages,
  currentPage,
  onSelectPage,
  onReorder,
  onCreatePage,
  onGenerateEpilogue,
  bookId,
}) {
  const [tocOpen, setTocOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = useCallback(
    (event) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = pages.findIndex((p) => p.id === active.id);
      const newIndex = pages.findIndex((p) => p.id === over.id);
      const reordered = arrayMove(pages, oldIndex, newIndex);
      onReorder(reordered.map((p) => p.id));
    },
    [pages, onReorder]
  );

  return (
    <div
      style={{
        width: '280px',
        minWidth: '280px',
        height: '100%',
        borderRight: '1px solid #E8D5A3',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#FAFAF7',
        overflow: 'hidden',
      }}
    >
      {/* Sidebar header */}
      <div
        style={{
          padding: '20px 16px 12px',
          borderBottom: '1px solid #E8D5A3',
        }}
      >
        <h2
          style={{
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 300,
            fontSize: '0.65rem',
            letterSpacing: '0.3em',
            color: '#8A8478',
            textTransform: 'uppercase',
          }}
        >
          Pages
        </h2>
      </div>

      {/* Scrollable page list */}
      <div className="flex-1 overflow-y-auto" style={{ padding: '12px' }}>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {pages.map((page, i) => (
                <SortablePageThumb
                  key={page.id}
                  page={page}
                  index={i}
                  isSelected={currentPage?.id === page.id}
                  onSelect={onSelectPage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Photo uploader */}
        <div style={{ marginTop: '12px' }}>
          <PhotoUploader bookId={bookId} onCreatePage={onCreatePage} />
        </div>
      </div>

      {/* Collapsible TOC */}
      <div style={{ borderTop: '1px solid #E8D5A3' }}>
        <button
          onClick={() => setTocOpen(!tocOpen)}
          style={{
            width: '100%',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 300,
            fontSize: '0.6rem',
            letterSpacing: '0.25em',
            color: '#8A8478',
            textTransform: 'uppercase',
            transition: 'color 300ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#0A0A0A'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8A8478'; }}
        >
          <span>Table of Contents</span>
          <span style={{ fontSize: '0.7rem', transform: tocOpen ? 'rotate(180deg)' : 'none', transition: 'transform 300ms' }}>
            &#9660;
          </span>
        </button>

        <AnimatePresence>
          {tocOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: '0 16px 12px', maxHeight: '180px', overflowY: 'auto' }}>
                {pages.map((page, i) => (
                  <button
                    key={page.id}
                    onClick={() => onSelectPage(page)}
                    style={{
                      display: 'block',
                      width: '100%',
                      textAlign: 'left',
                      padding: '4px 0',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      fontFamily: "'Josefin Sans', sans-serif",
                      fontWeight: currentPage?.id === page.id ? 400 : 200,
                      fontSize: '0.65rem',
                      color: currentPage?.id === page.id ? '#C9A96E' : '#8A8478',
                      letterSpacing: '0.1em',
                      transition: 'color 300ms',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {String(i + 1).padStart(2, '0')} &mdash; {page.caption?.slice(0, 40) || (page.image ? 'Photo' : 'Text page')}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Generate Epilogue button */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #E8D5A3' }}>
        <button
          onClick={onGenerateEpilogue}
          style={{
            width: '100%',
            padding: '10px 0',
            backgroundColor: '#C9A96E',
            color: '#FAFAF7',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: 300,
            fontSize: '0.65rem',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
            transition: 'all 400ms cubic-bezier(0.645, 0.045, 0.355, 1)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#A07840'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#C9A96E'; }}
        >
          Generar Epilogo
        </button>
      </div>
    </div>
  );
}
