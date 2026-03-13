import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FILTERS } from '../../utils/constants';
import LayoutSelector from './LayoutSelector';

/* ── Filter Label Map ────────────────────────────────── */
const FILTER_LABELS = {
  original: 'Original',
  noir: 'Noir',
  vintage: 'Vintage',
  fade: 'Fade',
};

/* ── Layout Templates ────────────────────────────────── */

function TemplateA({ page, renderCaption }) {
  // Editorial Split: photo left, text right
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      <div style={{ flex: '1 1 50%', overflow: 'hidden', position: 'relative' }}>
        {page.image && (
          <img
            src={page.image}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: FILTERS[page.filter] || 'none',
              transition: 'filter 500ms',
            }}
          />
        )}
      </div>
      <div
        style={{
          flex: '1 1 50%',
          padding: '48px 40px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          backgroundColor: '#F5F0E8',
        }}
      >
        {renderCaption()}
        {page.song && (
          <p
            style={{
              fontFamily: "'Josefin Sans', sans-serif",
              fontWeight: 200,
              fontSize: '0.6rem',
              color: '#8A8478',
              letterSpacing: '0.15em',
              marginTop: '24px',
            }}
          >
            &#9833; {page.song.name} &mdash; {page.song.artist}
          </p>
        )}
      </div>
    </div>
  );
}

function TemplateB({ page, renderCaption }) {
  // Immersive Full Bleed: photo fills, caption bottom-left with blend
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      {page.image && (
        <img
          src={page.image}
          alt=""
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: FILTERS[page.filter] || 'none',
            transition: 'filter 500ms',
          }}
        />
      )}
      <div
        style={{
          position: 'absolute',
          bottom: '32px',
          left: '32px',
          maxWidth: '50%',
          mixBlendMode: 'screen',
          backgroundColor: 'rgba(10, 10, 10, 0.4)',
          padding: '20px 24px',
        }}
      >
        {renderCaption({ color: '#FAFAF7' })}
      </div>
    </div>
  );
}

function TemplateC({ page, renderCaption }) {
  // Magazine: cream bg, photo centered 60% upper half, caption below
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#F5F0E8',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
      }}
    >
      {page.image && (
        <div style={{ width: '60%', marginBottom: '32px', overflow: 'hidden' }}>
          <img
            src={page.image}
            alt=""
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              filter: FILTERS[page.filter] || 'none',
              transition: 'filter 500ms',
            }}
          />
        </div>
      )}
      <div style={{ textAlign: 'center', maxWidth: '70%' }}>
        {renderCaption({ textAlign: 'center' })}
      </div>
    </div>
  );
}

function TemplateD({ page, renderCaption }) {
  // Text Only: cream bg, centered text
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: '#F5F0E8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 80px',
      }}
    >
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        {renderCaption({
          fontSize: '20px',
          lineHeight: 2.2,
          textAlign: 'center',
        })}
      </div>
    </div>
  );
}

const TEMPLATE_MAP = { A: TemplateA, B: TemplateB, C: TemplateC, D: TemplateD };

/* ── Filter Selector Popover ─────────────────────────── */
function FilterSelector({ currentFilter, onSelect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.25 }}
      style={{
        position: 'absolute',
        top: '100%',
        left: '50%',
        transform: 'translateX(-50%)',
        marginTop: '8px',
        backgroundColor: '#FAFAF7',
        border: '1px solid #E8D5A3',
        padding: '8px 0',
        zIndex: 20,
        minWidth: '120px',
      }}
    >
      {Object.entries(FILTER_LABELS).map(([key, label]) => (
        <button
          key={key}
          onClick={() => { onSelect(key); onClose(); }}
          style={{
            display: 'block',
            width: '100%',
            padding: '6px 16px',
            textAlign: 'left',
            background: key === currentFilter ? '#F5F0E8' : 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontFamily: "'Josefin Sans', sans-serif",
            fontWeight: key === currentFilter ? 400 : 200,
            fontSize: '0.65rem',
            letterSpacing: '0.15em',
            color: key === currentFilter ? '#C9A96E' : '#0A0A0A',
            transition: 'all 300ms',
          }}
        >
          {label}
        </button>
      ))}
    </motion.div>
  );
}

/* ── Main PagePreview ────────────────────────────────── */
export default function PagePreview({
  page,
  book,
  onUpdatePage,
  onDeletePage,
  onSetCurrentPage,
  onOpenPanel,
  editingField,
  editValue,
  onEditField,
  onEditValueChange,
  onEditSave,
  pages,
}) {
  const [hovered, setHovered] = useState(false);
  const [showLayoutSelector, setShowLayoutSelector] = useState(false);
  const [showFilterSelector, setShowFilterSelector] = useState(false);
  const textareaRef = useRef(null);

  // Focus textarea when editing caption
  useEffect(() => {
    if (editingField === 'caption' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [editingField]);

  const handleLayoutChange = async (layout) => {
    await onUpdatePage(page.id, { layout });
    onSetCurrentPage({ ...page, layout });
    setShowLayoutSelector(false);
  };

  const handleFilterChange = async (filter) => {
    await onUpdatePage(page.id, { filter });
    onSetCurrentPage({ ...page, filter });
  };

  const handleDelete = async () => {
    const idx = pages.findIndex((p) => p.id === page.id);
    await onDeletePage(page.id);
    // Select adjacent page
    const remaining = pages.filter((p) => p.id !== page.id);
    if (remaining.length > 0) {
      const nextIdx = Math.min(idx, remaining.length - 1);
      onSetCurrentPage(remaining[nextIdx]);
    } else {
      onSetCurrentPage(null);
    }
  };

  const renderCaption = (overrideStyles = {}) => {
    const isEditing = editingField === 'caption';
    const captionText = isEditing ? editValue : (page.caption || '');

    if (isEditing) {
      return (
        <textarea
          ref={textareaRef}
          value={editValue}
          onChange={(e) => onEditValueChange(e.target.value)}
          onBlur={onEditSave}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onEditSave();
            }
            if (e.key === 'Escape') {
              onEditField(null, '');
            }
          }}
          style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontStyle: 'italic',
            fontWeight: 300,
            fontSize: overrideStyles.fontSize || '0.95rem',
            lineHeight: overrideStyles.lineHeight || 1.8,
            color: overrideStyles.color || '#0A0A0A',
            background: 'rgba(201, 169, 110, 0.08)',
            border: '1px solid #C9A96E',
            padding: '8px 12px',
            width: '100%',
            minHeight: '80px',
            resize: 'vertical',
            outline: 'none',
            textAlign: overrideStyles.textAlign || 'left',
          }}
        />
      );
    }

    return (
      <p
        onClick={() => onEditField('caption', page.caption || '')}
        style={{
          fontFamily: "'Cormorant Garamond', serif",
          fontStyle: 'italic',
          fontWeight: 300,
          fontSize: overrideStyles.fontSize || '0.95rem',
          lineHeight: overrideStyles.lineHeight || 1.8,
          color: overrideStyles.color || '#0A0A0A',
          cursor: 'text',
          textAlign: overrideStyles.textAlign || 'left',
          transition: 'color 300ms',
          minHeight: '20px',
        }}
        title="Click to edit caption"
      >
        {captionText || (
          <span style={{ color: '#8A8478', fontWeight: 200 }}>Click to add caption...</span>
        )}
      </p>
    );
  };

  const layout = page.layout || 'A';
  const TemplateComponent = TEMPLATE_MAP[layout] || TemplateA;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowFilterSelector(false); }}
      style={{ transform: 'scale(0.85)', transformOrigin: 'center' }}
    >
      {/* Page spread container */}
      <div
        style={{
          width: '900px',
          height: '600px',
          backgroundColor: '#FAFAF7',
          boxShadow: '0 4px 40px rgba(10, 10, 10, 0.08), 0 1px 8px rgba(10, 10, 10, 0.04)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <TemplateComponent page={page} renderCaption={renderCaption} />
      </div>

      {/* Floating controls */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            style={{
              position: 'absolute',
              bottom: '-48px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              gap: '4px',
              backgroundColor: '#FAFAF7',
              border: '1px solid #E8D5A3',
              padding: '6px 8px',
            }}
          >
            {/* Layout */}
            <div style={{ position: 'relative' }}>
              <ControlButton
                label="Layout"
                active={showLayoutSelector}
                onClick={() => { setShowLayoutSelector(!showLayoutSelector); setShowFilterSelector(false); }}
              />
              <AnimatePresence>
                {showLayoutSelector && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      marginBottom: '8px',
                      zIndex: 20,
                    }}
                  >
                    <LayoutSelector
                      currentLayout={layout}
                      onSelect={handleLayoutChange}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Filter */}
            <div style={{ position: 'relative' }}>
              <ControlButton
                label="Filter"
                active={showFilterSelector}
                onClick={() => { setShowFilterSelector(!showFilterSelector); setShowLayoutSelector(false); }}
              />
              <AnimatePresence>
                {showFilterSelector && (
                  <FilterSelector
                    currentFilter={page.filter || 'original'}
                    onSelect={handleFilterChange}
                    onClose={() => setShowFilterSelector(false)}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Music */}
            <ControlButton
              label="Music"
              onClick={() => onOpenPanel('music')}
            />

            {/* Map */}
            <ControlButton
              label="Map"
              onClick={() => onOpenPanel('map')}
            />

            {/* Delete */}
            <ControlButton
              label="Delete"
              danger
              onClick={handleDelete}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Reusable Control Button ─────────────────────────── */
function ControlButton({ label, onClick, active, danger }) {
  const [hover, setHover] = useState(false);

  let color = '#8A8478';
  if (active) color = '#C9A96E';
  if (hover && !danger) color = '#0A0A0A';
  if (danger && hover) color = '#c0392b';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        fontFamily: "'Josefin Sans', sans-serif",
        fontWeight: 300,
        fontSize: '0.6rem',
        letterSpacing: '0.15em',
        color,
        padding: '4px 10px',
        textTransform: 'uppercase',
        transition: 'color 300ms',
        whiteSpace: 'nowrap',
      }}
    >
      {label}
    </button>
  );
}
