import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeLayout } from '../layout.mjs';
import { createGame, command, tick } from '../model.mjs';

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

  it('verifies resizing during active gameplay preserves game state and does not corrupt tick/score', () => {
    const game = createGame({ seed: 12345, mode: 'endless' });
    command(game, 'resume');
    // Tick several times to advance active tetromino
    for (let i = 0; i < 10; i++) {
      tick(game);
    }
    const scoreBefore = game.score;
    const linesBefore = game.lines;
    const activeBefore = { ...game.active };
    const boardBefore = JSON.stringify(game.board);

    // Simulate resizing across multiple tiers mid-game
    const phoneLayout = computeLayout(375, 667, 3);
    assert.equal(phoneLayout.tier, 'phone');
    const deskLayout = computeLayout(1920, 1080, 1);
    assert.equal(deskLayout.tier, 'desktop');
    const uhdLayout = computeLayout(3840, 2160, 2);
    assert.equal(uhdLayout.tier, '4k');

    // More ticks
    for (let i = 0; i < 5; i++) {
      tick(game);
    }

    assert.equal(game.score, scoreBefore);
    assert.equal(game.lines, linesBefore);
    assert.equal(game.active.type, activeBefore.type);
    assert.ok(game.active.y >= activeBefore.y); // Piece continued falling normally
    assert.equal(JSON.stringify(game.board), boardBefore);
  });
});
