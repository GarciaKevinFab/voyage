import { useState, useCallback, useEffect } from 'react';

/**
 * Hook managing the flipbook spread state and navigation.
 *
 * @param {number} totalPages - Total number of pages in the book.
 * @param {object} options
 * @param {function} options.onFlip - Callback when a page flip completes.
 * @param {function} options.onExit - Callback when Escape is pressed (e.g., navigate back).
 *
 * Returns { currentSpread, totalSpreads, goNext, goPrev, goToSpread, isTurning, progress }
 */
export default function usePageFlip(totalPages, { onFlip, onExit } = {}) {
  // Each spread shows 2 pages (left + right), except possibly the first/last.
  const totalSpreads = Math.max(1, Math.ceil(totalPages / 2));

  const [currentSpread, setCurrentSpread] = useState(0);
  const [isTurning, setIsTurning] = useState(false);

  const TURN_DURATION = 600; // ms, matches CSS transition

  const flip = useCallback(
    (nextSpread) => {
      if (isTurning) return;
      if (nextSpread < 0 || nextSpread >= totalSpreads) return;

      setIsTurning(true);
      setCurrentSpread(nextSpread);

      onFlip?.(nextSpread);

      setTimeout(() => setIsTurning(false), TURN_DURATION);
    },
    [isTurning, totalSpreads, onFlip]
  );

  const goNext = useCallback(() => {
    flip(currentSpread + 1);
  }, [currentSpread, flip]);

  const goPrev = useCallback(() => {
    flip(currentSpread - 1);
  }, [currentSpread, flip]);

  const goToSpread = useCallback(
    (index) => {
      flip(index);
    },
    [flip]
  );

  // ── Keyboard navigation ─────────────────────────────
  useEffect(() => {
    function handleKeyDown(e) {
      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          goNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          goPrev();
          break;
        case 'Escape':
          e.preventDefault();
          onExit?.();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev, onExit]);

  const progress = totalSpreads > 1 ? currentSpread / (totalSpreads - 1) : 1;

  return {
    currentSpread,
    totalSpreads,
    goNext,
    goPrev,
    goToSpread,
    isTurning,
    progress,
  };
}
