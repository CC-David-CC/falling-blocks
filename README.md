# Falling Blocks — development

This directory is not a launchable app yet. `model.mjs` is an independent,
deterministic rules model based on the design at
`../../../../served_apps_public/game_tree/01-phaser-arcade/falling-blocks/`.
It implements a 10×20 board with four hidden rows, seeded seven-piece bags,
movement, a project-defined rotation/kick table, ghost, hold, scoring, sprint,
bounded lock resets and a versioned exact logical snapshot. Its 60 Hz ticks are
logical; the future presentation must discard elapsed timing debt on suspension.
The rules do not claim official Tetris rotation or scoring compatibility.

Run `node tests/falling-blocks-model.test.mjs` from SIMPLIFIED. These are model
tests, not evidence of a playable interface, physical touch, Rive or persistence.
The model is not registered in the desktop and is not live.

## Actual desktop integration points

- `active-system/desktop-apps.js` creates a per-window host; the loader uses
  `mount(host)` and disposes the returned view on window removal. The instance
  wrapper in `active-system/assets/desktop/app-instance.mjs` owns an abort
  signal. Return `{element, dispose}` synchronously and make disposal idempotent.
- `host.ui.make`, `textButton`, and `appInput` are existing UI constructors.
  A canvas-heavy reference is `apps/system/gcode-preview/index.mjs`: it uses a
  per-window canvas, ResizeObserver and `dispose()` to release resources.
- `host.storage.mirrorFileContext()` resolves the current account context;
  `pickFile({extensions, signal})` and `pickFolder({signal})` select paths in
  My files. Use `context.files.read(path)` and
  `context.files.write(path, bytes, expectedVersion)` with the existing
  conflict checks. Bind identity and `context.valid()` across async work;
  validate the bounded save fully before replacing the current model.
- The app builder at `active-system/scripts/build-public-apps.py` uses esbuild
  and a lockfile, with explicit assets in each app's `app.json`. App menu,
  catalog and loader registration must be added only for a working vertical
  slice. No Phaser or Rive version has been qualified or locked for this game.
- `active-system/app.js` controls focus and window sizing. Keyboard handling
  must only capture focused play and must not consume input in another window;
  clear held input on pointer cancellation, blur and backgrounding. Observe
  the app container rather than the screen for rendering dimensions.

## Still required before release

A playable Phaser interface; desktop and phone controls; start/pause/retry,
settings and tutorial; game save/load via My files with collision handling and
restored gameplay tests; two independent windows and disposal checks; browser
and physical-phone verification; performance measurement; authored original
`block-coach.riv`, qualified Rive runtime and tested artboard properties and
triggers; real asset/license provenance; and end-to-end review against the
handoff's common and game-specific acceptance cases. Never label placeholders
or these model tests as a finished game.
