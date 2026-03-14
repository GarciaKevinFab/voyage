import { useState, useCallback, useEffect, useRef } from 'react';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  rotateMatrix,
  getRandomPiece,
} from '../utils/tetrisShapes';

function createEmptyBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array(BOARD_WIDTH).fill(null)
  );
}

/**
 * Check whether placing `shape` at (px, py) collides with board edges or
 * existing blocks.
 */
function collides(board, shape, px, py) {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = px + c;
      const ny = py + r;
      if (nx < 0 || nx >= BOARD_WIDTH || ny >= BOARD_HEIGHT) return true;
      if (ny >= 0 && board[ny][nx] !== null) return true;
    }
  }
  return false;
}

/**
 * Lock the current piece onto the board (mutates a copy).
 */
function lockPiece(board, piece) {
  const newBoard = board.map((row) => [...row]);
  const { shape, color, x, y } = piece;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const ny = y + r;
      const nx = x + c;
      if (ny >= 0 && ny < BOARD_HEIGHT && nx >= 0 && nx < BOARD_WIDTH) {
        newBoard[ny][nx] = color;
      }
    }
  }
  return newBoard;
}

/**
 * Clear completed lines and return { board, cleared }.
 */
function clearLines(board) {
  const kept = board.filter((row) => row.some((cell) => cell === null));
  const cleared = BOARD_HEIGHT - kept.length;
  const empty = Array.from({ length: cleared }, () =>
    Array(BOARD_WIDTH).fill(null)
  );
  return { board: [...empty, ...kept], cleared };
}

/**
 * Compute the ghost Y (the lowest y where the piece can go without collision).
 */
function computeGhostY(board, shape, px, py) {
  let gy = py;
  while (!collides(board, shape, px, gy + 1)) {
    gy++;
  }
  return gy;
}

const LINE_SCORES = { 1: 100, 2: 300, 3: 500, 4: 800 };

export default function useTetris() {
  const [board, setBoard] = useState(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState(null);
  const [nextPiece, setNextPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [gameState, setGameState] = useState('idle'); // idle | playing | paused | gameOver
  const [clearedRows, setClearedRows] = useState([]); // rows currently flashing

  // Refs so the interval callback always sees latest state
  const boardRef = useRef(board);
  const currentPieceRef = useRef(currentPiece);
  const nextPieceRef = useRef(nextPiece);
  const gameStateRef = useRef(gameState);
  const scoreRef = useRef(score);
  const levelRef = useRef(level);
  const linesClearedRef = useRef(linesCleared);

  boardRef.current = board;
  currentPieceRef.current = currentPiece;
  nextPieceRef.current = nextPiece;
  gameStateRef.current = gameState;
  scoreRef.current = score;
  levelRef.current = level;
  linesClearedRef.current = linesCleared;

  // --------------- spawning ---------------

  const spawnPiece = useCallback((piece) => {
    const cols = piece.shape[0].length;
    const x = Math.floor((BOARD_WIDTH - cols) / 2);
    const y = -piece.shape.length + 1; // start partially above the board
    return { ...piece, x, y };
  }, []);

  const spawnNext = useCallback(() => {
    const next = nextPieceRef.current || getRandomPiece();
    const spawned = spawnPiece(next);

    // Check game over: if spawning already collides
    if (collides(boardRef.current, spawned.shape, spawned.x, spawned.y)) {
      setGameState('gameOver');
      return;
    }

    setCurrentPiece(spawned);
    setNextPiece(getRandomPiece());
  }, [spawnPiece]);

  // --------------- lock + clear ---------------

  const lock = useCallback(() => {
    const piece = currentPieceRef.current;
    if (!piece) return;

    let newBoard = lockPiece(boardRef.current, piece);

    // Detect which rows are full for flash animation
    const fullRows = [];
    for (let r = 0; r < BOARD_HEIGHT; r++) {
      if (newBoard[r].every((cell) => cell !== null)) {
        fullRows.push(r);
      }
    }

    if (fullRows.length > 0) {
      setClearedRows(fullRows);
      // Flash briefly, then actually clear
      setBoard(newBoard);
      setTimeout(() => {
        const { board: clearedBoard, cleared } = clearLines(newBoard);
        const lvl = levelRef.current;
        const addScore = (LINE_SCORES[cleared] || 0) * lvl;
        const newLines = linesClearedRef.current + cleared;
        const newLevel = Math.floor(newLines / 10) + 1;

        setBoard(clearedBoard);
        setScore((s) => s + addScore);
        setLinesCleared(newLines);
        setLevel(newLevel);
        setClearedRows([]);
        spawnNext();
      }, 200);
    } else {
      setBoard(newBoard);
      spawnNext();
    }
  }, [spawnNext]);

  // --------------- movement ---------------

  const moveLeft = useCallback(() => {
    const p = currentPieceRef.current;
    if (!p || gameStateRef.current !== 'playing') return;
    if (!collides(boardRef.current, p.shape, p.x - 1, p.y)) {
      setCurrentPiece({ ...p, x: p.x - 1 });
    }
  }, []);

  const moveRight = useCallback(() => {
    const p = currentPieceRef.current;
    if (!p || gameStateRef.current !== 'playing') return;
    if (!collides(boardRef.current, p.shape, p.x + 1, p.y)) {
      setCurrentPiece({ ...p, x: p.x + 1 });
    }
  }, []);

  const rotate = useCallback(() => {
    const p = currentPieceRef.current;
    if (!p || gameStateRef.current !== 'playing') return;
    const rotated = rotateMatrix(p.shape);
    // Try normal, then wall-kick left/right
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!collides(boardRef.current, rotated, p.x + kick, p.y)) {
        setCurrentPiece({ ...p, shape: rotated, x: p.x + kick });
        return;
      }
    }
  }, []);

  const softDrop = useCallback(() => {
    const p = currentPieceRef.current;
    if (!p || gameStateRef.current !== 'playing') return;
    if (!collides(boardRef.current, p.shape, p.x, p.y + 1)) {
      setCurrentPiece({ ...p, y: p.y + 1 });
      setScore((s) => s + 1);
    } else {
      lock();
    }
  }, [lock]);

  const hardDrop = useCallback(() => {
    const p = currentPieceRef.current;
    if (!p || gameStateRef.current !== 'playing') return;
    const gy = computeGhostY(boardRef.current, p.shape, p.x, p.y);
    const dropped = gy - p.y;
    setCurrentPiece({ ...p, y: gy });
    setScore((s) => s + dropped * 2);
    // Lock immediately on next tick so the piece renders at bottom for one frame
    setTimeout(() => lock(), 0);
  }, [lock]);

  // --------------- game controls ---------------

  const start = useCallback(() => {
    const b = createEmptyBoard();
    setBoard(b);
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
    setClearedRows([]);
    const first = getRandomPiece();
    const second = getRandomPiece();
    setNextPiece(second);
    const spawned = spawnPiece(first);
    setCurrentPiece(spawned);
    setGameState('playing');
  }, [spawnPiece]);

  const pause = useCallback(() => {
    if (gameStateRef.current === 'playing') setGameState('paused');
  }, []);

  const resume = useCallback(() => {
    if (gameStateRef.current === 'paused') setGameState('playing');
  }, []);

  const reset = useCallback(() => {
    setBoard(createEmptyBoard());
    setCurrentPiece(null);
    setNextPiece(null);
    setScore(0);
    setLevel(1);
    setLinesCleared(0);
    setClearedRows([]);
    setGameState('idle');
  }, []);

  // --------------- gravity interval ---------------

  useEffect(() => {
    if (gameState !== 'playing') return;

    const speed = Math.max(100, 1000 - level * 80);
    const id = setInterval(() => {
      const p = currentPieceRef.current;
      if (!p) return;
      if (!collides(boardRef.current, p.shape, p.x, p.y + 1)) {
        setCurrentPiece((prev) => (prev ? { ...prev, y: prev.y + 1 } : prev));
      } else {
        lock();
      }
    }, speed);

    return () => clearInterval(id);
  }, [gameState, level, lock]);

  // --------------- keyboard ---------------

  useEffect(() => {
    function handleKey(e) {
      if (gameStateRef.current === 'idle' || gameStateRef.current === 'gameOver') return;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotate();
          break;
        case 'ArrowDown':
          e.preventDefault();
          softDrop();
          break;
        case ' ':
          e.preventDefault();
          hardDrop();
          break;
        case 'p':
        case 'P':
        case 'Escape':
          e.preventDefault();
          if (gameStateRef.current === 'playing') pause();
          else if (gameStateRef.current === 'paused') resume();
          break;
        default:
          break;
      }
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [moveLeft, moveRight, rotate, softDrop, hardDrop, pause, resume]);

  // --------------- ghost Y ---------------

  const ghostY =
    currentPiece && gameState === 'playing'
      ? computeGhostY(board, currentPiece.shape, currentPiece.x, currentPiece.y)
      : null;

  return {
    board,
    currentPiece,
    nextPiece,
    score,
    level,
    linesCleared,
    gameState,
    ghostY,
    clearedRows,
    start,
    pause,
    resume,
    reset,
    moveLeft,
    moveRight,
    rotate,
    softDrop,
    hardDrop,
  };
}
