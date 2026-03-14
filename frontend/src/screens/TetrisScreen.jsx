import React, { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useTetris from '../hooks/useTetris';
import { BOARD_WIDTH, BOARD_HEIGHT } from '../utils/tetrisShapes';

const GOLD = '#C9A96E';
const BLACK = '#0A0A0A';
const CREAM = '#F5F0E8';
const LS_KEY = 'voyage_tetris_highscore';

function getHighScore() {
  try {
    return parseInt(localStorage.getItem(LS_KEY), 10) || 0;
  } catch {
    return 0;
  }
}
function setHighScore(val) {
  try {
    localStorage.setItem(LS_KEY, String(val));
  } catch {
    // silent
  }
}

const isTouchDevice = () =>
  typeof window !== 'undefined' && 'ontouchstart' in window;

// ─── Canvas renderer ───────────────────────────────────────────────

function useCanvasRenderer(canvasRef, game) {
  const {
    board,
    currentPiece,
    ghostY,
    clearedRows,
  } = game;

  const animRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function draw() {
      const w = canvas.width;
      const h = canvas.height;
      const cellW = w / BOARD_WIDTH;
      const cellH = h / BOARD_HEIGHT;

      // 1. Background
      ctx.fillStyle = BLACK;
      ctx.fillRect(0, 0, w, h);

      // 2. Grid lines
      ctx.strokeStyle = 'rgba(201,169,110,0.06)';
      ctx.lineWidth = 1;
      for (let x = 0; x <= BOARD_WIDTH; x++) {
        ctx.beginPath();
        ctx.moveTo(x * cellW, 0);
        ctx.lineTo(x * cellW, h);
        ctx.stroke();
      }
      for (let y = 0; y <= BOARD_HEIGHT; y++) {
        ctx.beginPath();
        ctx.moveTo(0, y * cellH);
        ctx.lineTo(w, y * cellH);
        ctx.stroke();
      }

      // Helper: draw a filled block with subtle gradient
      function drawBlock(cx, cy, color, alpha = 1) {
        const px = cx * cellW;
        const py = cy * cellH;
        ctx.globalAlpha = alpha;
        // Gradient fill
        const grad = ctx.createLinearGradient(px, py, px + cellW, py + cellH);
        grad.addColorStop(0, lighten(color, 20));
        grad.addColorStop(1, color);
        ctx.fillStyle = grad;
        ctx.fillRect(px + 1, py + 1, cellW - 2, cellH - 2);
        // Subtle border highlight
        ctx.strokeStyle = lighten(color, 40);
        ctx.lineWidth = 0.5;
        ctx.strokeRect(px + 1, py + 1, cellW - 2, cellH - 2);
        ctx.globalAlpha = 1;
      }

      // 3. Placed blocks
      for (let r = 0; r < BOARD_HEIGHT; r++) {
        for (let c = 0; c < BOARD_WIDTH; c++) {
          const color = board[r][c];
          if (!color) continue;
          // Flash animation for cleared rows
          if (clearedRows.includes(r)) {
            drawBlock(c, r, GOLD, 0.8);
          } else {
            drawBlock(c, r, color);
          }
        }
      }

      // 4. Ghost piece
      if (currentPiece && ghostY !== null && ghostY !== currentPiece.y) {
        const { shape, color, x } = currentPiece;
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (!shape[r][c]) continue;
            const ny = ghostY + r;
            if (ny < 0) continue;
            drawBlock(x + c, ny, color, 0.2);
          }
        }
      }

      // 5. Current piece with glow
      if (currentPiece) {
        const { shape, color, x, y } = currentPiece;
        for (let r = 0; r < shape.length; r++) {
          for (let c = 0; c < shape[r].length; c++) {
            if (!shape[r][c]) continue;
            const ny = y + r;
            if (ny < 0) continue;
            // Subtle glow
            const px = (x + c) * cellW + cellW / 2;
            const py2 = ny * cellH + cellH / 2;
            const glowRadius = Math.max(cellW, cellH) * 0.8;
            const glow = ctx.createRadialGradient(px, py2, 0, px, py2, glowRadius);
            glow.addColorStop(0, hexToRgba(color, 0.25));
            glow.addColorStop(1, 'transparent');
            ctx.fillStyle = glow;
            ctx.fillRect(
              (x + c) * cellW - 4,
              ny * cellH - 4,
              cellW + 8,
              cellH + 8
            );
            drawBlock(x + c, ny, color);
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    animRef.current = requestAnimationFrame(draw);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [canvasRef, board, currentPiece, ghostY, clearedRows]);
}

// ─── Color helpers ──────────────────────────────────────────────────

function lighten(hex, amount) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, ((num >> 16) & 0xff) + amount);
  const g = Math.min(255, ((num >> 8) & 0xff) + amount);
  const b = Math.min(255, (num & 0xff) + amount);
  return `rgb(${r},${g},${b})`;
}

function hexToRgba(hex, alpha) {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = (num >> 16) & 0xff;
  const g = (num >> 8) & 0xff;
  const b = num & 0xff;
  return `rgba(${r},${g},${b},${alpha})`;
}

// ─── Next piece preview ─────────────────────────────────────────────

function NextPiecePreview({ piece }) {
  if (!piece) return null;
  const { shape, color } = piece;
  const rows = shape.length;
  const cols = shape[0].length;
  const cellSize = 22;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gap: 2,
        justifyContent: 'center',
      }}
    >
      {shape.flatMap((row, r) =>
        row.map((cell, c) => (
          <div
            key={`${r}-${c}`}
            style={{
              width: cellSize,
              height: cellSize,
              borderRadius: 3,
              background: cell ? color : 'transparent',
              border: cell ? `1px solid ${lighten(color, 30)}` : 'none',
            }}
          />
        ))
      )}
    </div>
  );
}

// ─── Touch button ────────────────────────────────────────────────────

function TouchButton({ label, onAction, style }) {
  return (
    <button
      onTouchStart={(e) => {
        e.preventDefault();
        onAction();
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        onAction();
      }}
      style={{
        width: 60,
        height: 60,
        borderRadius: 12,
        border: `1.5px solid ${GOLD}`,
        background: 'rgba(201,169,110,0.08)',
        color: GOLD,
        fontSize: 22,
        fontFamily: '"Josefin Sans", sans-serif',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        userSelect: 'none',
        WebkitTapHighlightColor: 'transparent',
        ...style,
      }}
    >
      {label}
    </button>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────

export default function TetrisScreen() {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 300, h: 600 });
  const [highScore, setHigh] = useState(getHighScore);
  const showTouch = useMemo(() => isTouchDevice(), []);

  const game = useTetris();
  const {
    nextPiece,
    score,
    level,
    linesCleared,
    gameState,
    start,
    reset,
    pause,
    resume,
    moveLeft,
    moveRight,
    rotate,
    hardDrop,
  } = game;

  // Persist high score
  useEffect(() => {
    if (score > highScore) {
      setHigh(score);
      setHighScore(score);
    }
  }, [score, highScore]);

  // Responsive canvas sizing
  useEffect(() => {
    function resize() {
      const maxH = window.innerHeight - (showTouch ? 260 : 160);
      const maxW = window.innerWidth < 640 ? window.innerWidth - 24 : 360;
      const ratio = BOARD_WIDTH / BOARD_HEIGHT; // 0.5
      let h = Math.min(maxH, 640);
      let w = h * ratio;
      if (w > maxW) {
        w = maxW;
        h = w / ratio;
      }
      setCanvasSize({ w: Math.floor(w), h: Math.floor(h) });
    }
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [showTouch]);

  useCanvasRenderer(canvasRef, game);

  const handleStartRestart = () => {
    if (gameState === 'idle' || gameState === 'gameOver') {
      start();
    } else {
      reset();
    }
  };

  return (
    <div
      ref={containerRef}
      style={{
        minHeight: '100vh',
        width: '100%',
        background: BLACK,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        fontFamily: '"Josefin Sans", sans-serif',
        color: CREAM,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          width: '100%',
          maxWidth: 720,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px 8px',
          boxSizing: 'border-box',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            color: GOLD,
            fontSize: 14,
            fontFamily: '"Josefin Sans", sans-serif',
            letterSpacing: 2,
            cursor: 'pointer',
            textTransform: 'uppercase',
          }}
        >
          &larr; Back
        </button>
        <h1
          style={{
            fontFamily: '"Cormorant Garamond", serif',
            fontSize: 22,
            fontWeight: 400,
            color: GOLD,
            letterSpacing: 6,
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Voyage Tetris
        </h1>
        <div style={{ width: 60 }} />
      </div>

      {/* ── Main area ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 24,
          flexWrap: 'wrap',
          padding: '8px 12px',
          flex: 1,
        }}
      >
        {/* Canvas */}
        <div style={{ position: 'relative' }}>
          <canvas
            ref={canvasRef}
            width={canvasSize.w}
            height={canvasSize.h}
            style={{
              border: `1px solid rgba(201,169,110,0.25)`,
              borderRadius: 4,
              display: 'block',
            }}
          />

          {/* Pause overlay */}
          {gameState === 'paused' && (
            <div style={overlayStyle}>
              <p style={overlayTitle}>Paused</p>
              <button onClick={resume} style={overlayButton}>
                Resume
              </button>
            </div>
          )}

          {/* Game over overlay */}
          {gameState === 'gameOver' && (
            <div style={overlayStyle}>
              <p style={overlayTitle}>Game Over</p>
              <p style={{ ...overlayText, fontSize: 18 }}>
                Score: {score.toLocaleString()}
              </p>
              <p style={overlayText}>Level {level}</p>
              <button onClick={start} style={overlayButton}>
                Play Again
              </button>
            </div>
          )}
        </div>

        {/* Side panel */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
            minWidth: 130,
          }}
        >
          {/* Next piece */}
          <div>
            <p style={labelStyle}>Next</p>
            <div
              style={{
                background: 'rgba(201,169,110,0.05)',
                border: `1px solid rgba(201,169,110,0.15)`,
                borderRadius: 8,
                padding: 12,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 70,
              }}
            >
              <NextPiecePreview piece={nextPiece} />
            </div>
          </div>

          {/* Score */}
          <div>
            <p style={labelStyle}>Score</p>
            <p style={valueStyle}>{score.toLocaleString()}</p>
          </div>

          {/* Level */}
          <div>
            <p style={labelStyle}>Level</p>
            <p style={{ ...valueStyle, fontSize: 20 }}>{level}</p>
          </div>

          {/* Lines */}
          <div>
            <p style={labelStyle}>Lines</p>
            <p style={{ ...valueStyle, fontSize: 20 }}>{linesCleared}</p>
          </div>

          {/* High Score */}
          <div>
            <p style={labelStyle}>High Score</p>
            <p style={{ ...valueStyle, fontSize: 18, color: GOLD }}>
              {highScore.toLocaleString()}
            </p>
          </div>

          {/* Start / Restart */}
          {(gameState === 'idle' || gameState === 'gameOver') && (
            <button onClick={handleStartRestart} style={startButton}>
              {gameState === 'idle' ? 'Start' : 'Restart'}
            </button>
          )}

          {gameState === 'playing' && (
            <button onClick={pause} style={{ ...startButton, fontSize: 13 }}>
              Pause (P)
            </button>
          )}
        </div>
      </div>

      {/* ── Touch controls ── */}
      {showTouch && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 16,
            padding: '12px 0 24px',
          }}
        >
          <TouchButton label="&#x25C0;" onAction={moveLeft} />
          <TouchButton label="&#x25B6;" onAction={moveRight} />
          <TouchButton label="&#x21BB;" onAction={rotate} />
          <TouchButton label="&#x25BC;" onAction={hardDrop} />
        </div>
      )}
    </div>
  );
}

// ─── Inline styles ───────────────────────────────────────────────────

const labelStyle = {
  margin: 0,
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: 3,
  color: 'rgba(245,240,232,0.5)',
  fontFamily: '"Josefin Sans", sans-serif',
};

const valueStyle = {
  margin: '4px 0 0',
  fontFamily: '"Cormorant Garamond", serif',
  fontSize: 28,
  fontWeight: 400,
  color: CREAM,
};

const overlayStyle = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(10,10,10,0.85)',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: 4,
};

const overlayTitle = {
  fontFamily: '"Cormorant Garamond", serif',
  fontSize: 36,
  fontWeight: 400,
  color: GOLD,
  letterSpacing: 6,
  textTransform: 'uppercase',
  margin: '0 0 12px',
};

const overlayText = {
  fontFamily: '"Josefin Sans", sans-serif',
  fontSize: 14,
  color: CREAM,
  margin: '4px 0',
};

const overlayButton = {
  marginTop: 20,
  padding: '10px 32px',
  border: `1.5px solid ${GOLD}`,
  borderRadius: 8,
  background: 'transparent',
  color: GOLD,
  fontFamily: '"Josefin Sans", sans-serif',
  fontSize: 14,
  letterSpacing: 3,
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'background 0.3s cubic-bezier(0.645,0.045,0.355,1)',
};

const startButton = {
  padding: '10px 0',
  border: `1.5px solid ${GOLD}`,
  borderRadius: 8,
  background: 'rgba(201,169,110,0.08)',
  color: GOLD,
  fontFamily: '"Josefin Sans", sans-serif',
  fontSize: 14,
  letterSpacing: 3,
  textTransform: 'uppercase',
  cursor: 'pointer',
  transition: 'background 0.3s cubic-bezier(0.645,0.045,0.355,1)',
};
