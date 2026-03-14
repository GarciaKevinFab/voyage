// Tetris piece definitions using VOYAGE gold/cream/brown palette
// Each piece has a shape (2D array) and a color (hex string)

export const SHAPES = {
  I: { shape: [[1, 1, 1, 1]], color: '#C9A96E' },
  O: { shape: [[1, 1], [1, 1]], color: '#D4C5A0' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: '#A07840' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: '#B8956A' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: '#8B6914' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: '#6B4226' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: '#3E2723' },
};

export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

const SHAPE_KEYS = Object.keys(SHAPES);

/**
 * Rotate a matrix 90 degrees clockwise.
 * Transpose then reverse each row.
 */
export function rotateMatrix(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = [];
  for (let c = 0; c < cols; c++) {
    const newRow = [];
    for (let r = rows - 1; r >= 0; r--) {
      newRow.push(matrix[r][c]);
    }
    rotated.push(newRow);
  }
  return rotated;
}

/**
 * Return a random Tetris piece (deep-copied shape + color).
 */
export function getRandomPiece() {
  const key = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
  const piece = SHAPES[key];
  return {
    shape: piece.shape.map((row) => [...row]),
    color: piece.color,
  };
}
