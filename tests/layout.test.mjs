import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { HIDDEN, WIDTH, HEIGHT } from '../model.mjs';

function computeLayout(w, h, dpr = 1) {
  const visibleRows = HEIGHT - HIDDEN; // 20
  const cellW = Math.floor((w - 16) / WIDTH);
  const cellH = Math.floor((h - 16) / visibleRows);
  const cellSize = Math.max(8, Math.min(cellW, cellH));
  const boardW = cellSize * WIDTH;
  const boardH = cellSize * visibleRows;
  const offsetX = Math.floor((w - boardW) / 2);
  const offsetY = Math.floor((h - boardH) / 2);
  const tier = w < 768 ? 'phone' : (w >= 2560 || (w >= 1920 && dpr >= 2)) ? '4k' : 'desktop';
  return { w, h, dpr, tier, cellSize, boardW, boardH, offsetX, offsetY };
}

describe('Falling Blocks responsive layout metrics', () => {
  it('computes compact metrics for phone viewports (< 768px)', () => {
    const layout = computeLayout(360, 640, 3);
    assert.equal(layout.tier, 'phone');
    assert.ok(layout.cellSize >= 8, 'cell size should be viable for mobile');
    assert.ok(layout.offsetX >= 0, 'no left overflow');
    assert.ok(layout.offsetY >= 0, 'no top overflow');
    assert.ok(layout.boardW <= 360, 'board width fits viewport');
    assert.ok(layout.boardH <= 640, 'board height fits viewport');
  });

  it('computes comfortable metrics for 1080p desktop', () => {
    const layout = computeLayout(1024, 768, 1);
    assert.equal(layout.tier, 'desktop');
    assert.ok(layout.cellSize >= 30, 'desktop should have spacious cells');
    assert.ok(layout.boardW <= 1024);
    assert.ok(layout.boardH <= 768);
    assert.ok(layout.offsetX > 0);
  });

  it('computes crisp metrics for 4K UHD viewports (>= 2560px)', () => {
    const layout = computeLayout(3840, 2160, 2);
    assert.equal(layout.tier, '4k');
    assert.ok(layout.cellSize >= 90, '4K cells should be ultra-high resolution');
    assert.ok(layout.offsetX >= 0);
    assert.ok(layout.offsetY >= 0);
    assert.ok(layout.boardW <= 3840);
    assert.ok(layout.boardH <= 2160);
  });
});
