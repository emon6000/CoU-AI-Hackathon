import React from 'react';

// Deterministic matrix generator for crisp SVG QR code display
export const QRCodeSVG: React.FC<{
  value: string;
  size?: number;
  className?: string;
  fgColor?: string;
  bgColor?: string;
}> = ({ value, size = 180, className = '', fgColor = '#0a0618', bgColor = '#ffffff' }) => {
  // Simple deterministic 25x25 grid generator based on hash of string
  const gridSize = 25;
  const modules: boolean[][] = Array.from({ length: gridSize }, () => Array(gridSize).fill(false));

  // Helper to draw finder pattern (7x7 box)
  const drawFinder = (row: number, col: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        if (
          r === 0 ||
          r === 6 ||
          c === 0 ||
          c === 6 ||
          (r >= 2 && r <= 4 && c >= 2 && c <= 4)
        ) {
          modules[row + r][col + c] = true;
        }
      }
    }
  };

  // 3 Finder patterns
  drawFinder(0, 0); // top-left
  drawFinder(0, gridSize - 7); // top-right
  drawFinder(gridSize - 7, 0); // bottom-left

  // Timing patterns
  for (let i = 8; i < gridSize - 8; i++) {
    modules[6][i] = i % 2 === 0;
    modules[i][6] = i % 2 === 0;
  }

  // Hash the value into pseudo-random grid data
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Don't overwrite finders or timing
      const inTopLeftFinder = r < 8 && c < 8;
      const inTopRightFinder = r < 8 && c >= gridSize - 8;
      const inBottomLeftFinder = r >= gridSize - 8 && c < 8;
      const isTiming = r === 6 || c === 6;

      if (!inTopLeftFinder && !inTopRightFinder && !inBottomLeftFinder && !isTiming) {
        const seed = Math.sin(hash * 0.01 + r * 17 + c * 31);
        modules[r][c] = (seed - Math.floor(seed)) > 0.46;
      }
    }
  }

  return (
    <div
      className={`inline-block p-3 rounded-xl shadow-lg border border-purple-200/50 ${className}`}
      style={{ backgroundColor: bgColor }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${gridSize} ${gridSize}`}
        className="shape-rendering-crisp"
        role="img"
        aria-label={`QR Code for ${value}`}
      >
        <rect width={gridSize} height={gridSize} fill={bgColor} />
        {modules.map((row, r) =>
          row.map((active, c) =>
            active ? (
              <rect
                key={`${r}-${c}`}
                x={c}
                y={r}
                width={1}
                height={1}
                fill={fgColor}
              />
            ) : null
          )
        )}
      </svg>
    </div>
  );
};
