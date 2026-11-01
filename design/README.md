# Falling Blocks

**Tetris-type falling-block puzzle · Phaser · single-player · phone required · flat-screen app**

> Planned design, not implemented or browser-tested. `index.pseudo.mjs` is an explanatory entry point, not a playable game.

## Experience

A crisp single-player line-clearing game with its own visual identity, readable ghost placement and a satisfying short sprint.

## What this demonstrates

- Discrete board logic independent of frame rate
- Phaser scenes, batched sprites and particles
- Rive coach and animated results

## Rules and complete loop

- A 10×20 visible board plus four hidden spawn rows; seeded seven-piece bag; explicit rotation/kick table authored and tested in this project.
- Move, rotate, soft-drop and hard-drop. Hold is allowed once per lock. Lock delay is bounded and cannot be extended indefinitely.
- Sprint ends at 40 cleared lines; Endless ends on blocked spawn. Clearing, scoring and next spawn are one ordered state transition.

## Bounded polished release

One tutorial, a 40-line sprint and an endless mode. One original theme; two contrast presets. No online leaderboard.

- Clear line anticipation without delaying input
- Reduced-motion mode removes board shake
- Visible next queue and ghost; muted-by-default audio until Play

No multiplayer, accounts, server simulation or generic editor is required. Start, rules/help, play/activity, pause, outcome/goal feedback and retry must all be complete. Settings include volume/mute, reduced motion, contrast and game-specific options where meaningful. State changes occur in the game model; animations illustrate them.

## Rive inside this app

Small coach beside board; menu and score reactions, never obstructing falling pieces. The requested asset is `block-coach.riv`; it is **not included**. See [RIVE.md](RIVE.md) for the authoring/integration contract. A placeholder or unrelated animated logo does not satisfy this requirement.

## Save behavior

Exact logical snapshot at a tick boundary; no engine object serialization. See [SAVE.md](SAVE.md). Loading starts paused; resume is explicit. Restart and load cancel stale callbacks and any owned AI work.

## Build sequence

Implement the rule loop in [gameplay.pseudo.txt](gameplay.pseudo.txt); bind the exact app lifecycle from [index.pseudo.mjs](index.pseudo.mjs); complete [CONTROLS.md](CONTROLS.md); author/integrate [RIVE.md](RIVE.md); then satisfy [ACCEPTANCE.md](ACCEPTANCE.md). Do not add XR or a 3D engine solely to widen the technology list.

Target wave: **1**. Integrator first reads [AGENTS.md](../../AGENTS.md); do not guess host APIs from symbolic helper names.

No copyrighted logos, copied skins, music or branded packaging. Tetris-type describes mechanics, not affiliation.
