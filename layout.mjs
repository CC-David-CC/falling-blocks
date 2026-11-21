import { HIDDEN, WIDTH, HEIGHT } from './model.mjs';

export function computeLayout(containerW, containerH, dpr = 1) {
  const w = Math.max(180, containerW || 300);
  const h = Math.max(260, containerH || 600);
  const visibleRows = HEIGHT - HIDDEN;
  const cellW = Math.floor((w - 16) / WIDTH);
  const cellH = Math.floor((h - 16) / visibleRows);
  const cellSize = Math.max(8, Math.min(cellW, cellH));
  const boardW = cellSize * WIDTH;
  const boardH = cellSize * visibleRows;
  const offsetX = Math.floor((w - boardW) / 2);
  const offsetY = Math.floor((h - boardH) / 2);
  const tier = w < 768 ? 'phone' : (w >= 2560 || (w >= 1920 && dpr >= 2)) ? '4k' : 'desktop';
  const targetBufferW = Math.round(w * dpr);
  const targetBufferH = Math.round(h * dpr);

  return {
    w,
    h,
    dpr,
    tier,
    cellSize,
    boardW,
    boardH,
    offsetX,
    offsetY,
    targetBufferW,
    targetBufferH,
    visibleRows,
  };
}
