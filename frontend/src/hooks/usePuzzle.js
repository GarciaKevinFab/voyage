import { useState, useCallback, useRef } from 'react';

/**
 * Custom hook for puzzle game state management.
 *
 * @param {string} imageUrl  - URL of the image to slice into tiles
 * @param {3|4|5}  gridSize  - Number of columns/rows
 */
export default function usePuzzle(imageUrl, gridSize = 3) {
  const totalTiles = gridSize * gridSize;

  // Each tile: { id, correctIndex, currentIndex }
  const [tiles, setTiles] = useState([]);
  const [moves, setMoves] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const startTimeRef = useRef(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef(null);

  // ── Solvability helpers ───────────────────────────────

  /** Count the number of inversions in the tile order. */
  function countInversions(arr) {
    let inv = 0;
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > arr[j]) inv++;
      }
    }
    return inv;
  }

  /**
   * Check whether a flat array of tile ids (0-based) is solvable as a
   * sliding-puzzle analogue.  We treat the *last* tile as the "blank".
   *
   * Odd grid  -> inversions must be even.
   * Even grid -> inversions + row-of-blank (from bottom) must be odd.
   */
  function isSolvable(arr, size) {
    const inversions = countInversions(arr);

    if (size % 2 === 1) {
      // Odd grid: inversions must be even
      return inversions % 2 === 0;
    }

    // Even grid: find the row of the "blank" (last tile id) counting from bottom
    const blankValue = size * size - 1;
    const blankPos = arr.indexOf(blankValue);
    const blankRowFromBottom = size - Math.floor(blankPos / size);
    return (inversions + blankRowFromBottom) % 2 === 1;
  }

  /** Fisher-Yates shuffle that guarantees a solvable & non-trivial permutation. */
  function shuffleArray(size) {
    const arr = Array.from({ length: size * size }, (_, i) => i);

    const doShuffle = () => {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    };

    // Keep shuffling until we get a solvable, non-identity permutation
    let attempts = 0;
    do {
      doShuffle();
      attempts++;
    } while (
      (!isSolvable(arr, size) || arr.every((v, i) => v === i)) &&
      attempts < 1000
    );

    return arr;
  }

  // ── Timer helpers ─────────────────────────────────────

  function startTimer() {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  }

  function stopTimer() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  // ── Win check ─────────────────────────────────────────

  function checkComplete(tileList) {
    return tileList.every((t) => t.currentIndex === t.correctIndex);
  }

  // ── Public actions ────────────────────────────────────

  const initPuzzle = useCallback(() => {
    stopTimer();

    const shuffled = shuffleArray(gridSize);

    const newTiles = shuffled.map((correctId, currentIdx) => ({
      id: `tile-${correctId}`,
      correctIndex: correctId,
      currentIndex: currentIdx,
    }));

    setTiles(newTiles);
    setMoves(0);
    setIsComplete(false);
    setIsStarted(true);
    setElapsedTime(0);
    startTimer();
  }, [gridSize]);

  const swapTiles = useCallback(
    (fromIndex, toIndex) => {
      if (isComplete) return;

      setTiles((prev) => {
        const next = [...prev];
        // Find the tiles currently at fromIndex and toIndex
        const fromTileIdx = next.findIndex((t) => t.currentIndex === fromIndex);
        const toTileIdx = next.findIndex((t) => t.currentIndex === toIndex);

        if (fromTileIdx === -1 || toTileIdx === -1) return prev;

        // Swap their currentIndex values
        next[fromTileIdx] = { ...next[fromTileIdx], currentIndex: toIndex };
        next[toTileIdx] = { ...next[toTileIdx], currentIndex: fromIndex };

        // Check win
        if (checkComplete(next)) {
          setIsComplete(true);
          stopTimer();
        }

        return next;
      });

      setMoves((m) => m + 1);
    },
    [isComplete]
  );

  const reset = useCallback(() => {
    stopTimer();
    setTiles([]);
    setMoves(0);
    setIsComplete(false);
    setIsStarted(false);
    setElapsedTime(0);
  }, []);

  return {
    tiles,
    moves,
    isComplete,
    isStarted,
    elapsedTime,
    initPuzzle,
    swapTiles,
    reset,
  };
}
