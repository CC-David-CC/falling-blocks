# Falling Blocks coach artwork — in progress

This is original artwork authored as Rive Markup Language for Falling Blocks.
It is integrated into the local development prototype, but the game is not yet a completed integration. The source is
`scene.rml`. The reviewed runtime `build/coach.riv` is tracked so a fresh checkout can serve the coach; other build and preview files remain ignored. Rebuild it with the pinned CLI and verify its SHA-256 using `../prepare.py` before updating the asset.

The 180×180 `Main` artboard contains the `Presentation` state machine and a
looping blink. The `CoachState` view model exposes `danger` (0–1) and `combo`
(0–4 displayed, values above four clamp) as two meters. Danger also switches
between idle and alert. `celebrate` and `topOut` trigger brief reactions;
`menuState` controls a four-color status light. `reducedMotion` stops blinking
and returns an in-progress reaction to neutral; the host suppresses new reactions
while that preference is active. Rive CLI 1.8.0 render tests
cover the transitions, return to neutral, meters and all four status colors;
the blink was inspected at frames 1 and 146. The shape and color choices were created for this project;
there are no imported illustrations, fonts or audio.

The app binds these properties to its own game model and loads Rive and its
WASM from its own bundle. Browser tests cover separate windows, game-state
changes and a line-clear reaction without external requests. The host follows the device motion preference by default, with a window-level
override. Still required: physical-phone testing, performance and full game
acceptance testing. A compiling artwork file is not evidence those
requirements work. The coach ships in the live Falling Blocks preview.

Rebuild with the official Rive CLI version 1.8.0, from SIMPLIFIED:

```
rive apps/system/falling-blocks/coach --verify
rive inspect apps/system/falling-blocks/coach --summary
rive apps/system/falling-blocks/coach --once
rive apps/system/falling-blocks/coach --screenshot --data=danger=1 --data=combo=3 --advance=1
RIVE_CLI=/path/to/rive python3 apps/system/falling-blocks/coach/tests/test_render.py
```

The CLI was obtained from `https://releases.rive.app/cli/v1.8.0/rive-linux-x64.tar.gz`;
the publisher's manifest SHA-256 was
`9d67bdb77e33db2daa7ce80df51579212ff0cf55a9d6ae3696e4608a248847af`.
No account or upload was used. Check the CLI's current terms and runtime
compatibility before distributing a compiled asset.
