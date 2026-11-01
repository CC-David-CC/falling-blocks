# Falling Blocks — development

This directory contains a development prototype labeled “Falling Blocks (preview)” in the Games menu. `model.mjs` is an independent,
deterministic rules model based on the design at
`../../../../served_apps_public/game_tree/01-phaser-arcade/falling-blocks/`.
It implements a 10×20 board with four hidden rows and a partially visible
spawn, seeded seven-piece bags,
movement, a project-defined rotation/kick table, ghost, hold, scoring, sprint,
bounded lock resets, including when a piece leaves a ledge, and a versioned exact logical snapshot. Its 60 Hz ticks are
logical; the future presentation must discard elapsed timing debt on suspension.
The rules do not claim official Tetris rotation or scoring compatibility.

Run `node tests/falling-blocks-model.test.mjs` from SIMPLIFIED. These are model tests, not evidence of physical touch, Rive or persistence.
The prototype is live in Applications → Games → Falling Blocks (preview). Phaser 4.2.1
is pinned in this app's own lockfile; its MIT license is included in the bundle.
An isolated browser harness exercises two instances, mode selection, help,
keyboard movement, an emulated touch tap, save, mutation, load, invalid save
rejection and independent disposal with a memory-only file-service stand-in at
desktop, 4K and emulated phone viewport sizes. The board also follows its
container when resized, keeping its aspect ratio; a per-window observer is
released on close. Minimizing or rolling up its desktop window pauses the game;
restoring the window requires an explicit Resume. The current prototype has no game audio and does not create
an audio context. Save location is collapsed by default, and an optional
high-contrast setting adds visible outlines; the setting currently lasts only
for the open window. Coach motion defaults to the device preference and has a
per-window override; browser tests cover still eyes, the override and live game
state while reduced motion is active. A separate isolated local-desktop test now exercises the actual account file
service, sync to account disk, recovery in a fresh browser session, isolation
from another account, unsaved-close cancellation and a same-browser stale-save
conflict. A separate-browser conflict test simulated a gateway outage in one browser,
saved different games in both, and verified the local and server copies survived
with a visible conflict notice. Saves capture the current game and destination when requested; if play continues or a new game starts while a save is waiting, the saved snapshot stays separate and newer progress remains unsaved. Phone-sized and desktop screenshots were inspected; physical touch, broader
broader layout quality and physical-device behavior remain unverified.

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
  and a lockfile, with explicit assets in each app's `app.json`. The app is registered as a preview; its full acceptance gates remain open. Phaser 4.2.1 and Rive Canvas 2.49.0 are pinned. The coach in `coach/` is
  generated from reviewed RML and its runtime, WASM and art load from the app
  bundle. Each app window owns its own coach and disposes it on close.
- `active-system/app.js` controls focus and window sizing. Keyboard handling
  must only capture focused play and must not consume input in another window;
  clear held input on pointer cancellation, blur and backgrounding. Observe
  the app container rather than the screen for rendering dimensions.

## Still required before release

Review and finish the prototype interface, phone controls, settings and tutorial;
test real cross-device operation and physical-phone operation; performance measurement; complete physical-device tests for the coach; review distribution of the final assets; and end-to-end review against the
handoff's common and game-specific acceptance cases. Never label placeholders
or these model tests as a finished game.

## Isolated browser harness

With build-time Node, the app builder dependencies and the pinned app
dependencies installed, first run `RIVE_CLI=/path/to/rive python3
apps/system/falling-blocks/prepare.py` using Rive CLI 1.8.0. Then build the app, copy `tests/falling-blocks-fixture.html`
as the build directory's `index.html`, and serve that build directory on
127.0.0.1:18334. Run `CODI_BLOCKS_MANIFEST=.build/blocks-app/apps.json node
tests/falling-blocks-browser.test.mjs` from SIMPLIFIED with Chrome debugging
available at 127.0.0.1:19255. Add `CODI_PHONE=1` for the emulated phone viewport.
The fixture's in-memory storage must never be used as production storage.

## Local desktop account test

Build `calculator files falling-blocks` into an app bundle and start
`run-simplified-local.py --isolated` with that bundle. Set `CODI_TEST_URL` and
`CODI_TEST_DATA_ROOT` to the isolated server and its `account-data` directory,
then run `node tests/falling-blocks-account.test.mjs`. The test launches the preview from the Games menu using the real app host. Never point this fixture at live data.

Saved Falling Blocks `.game.json` files can be opened from Files as well as from the game. The desktop checks the bounded file’s game identity before routing it; an unrecognized game save opens as text. The game restores paused and validates the snapshot before replacing play. Local desktop, emulated-phone and 4K and live emulated-phone account tests cover Files routing, exact paused-state recovery, unknown-game fallback, sync and fresh-session reopen.

Opening a save pauses play. When starting a new game or opening a save would
discard progress, a desktop dialog asks first; cancelling leaves the game
paused. Replacement saves also use a desktop dialog and protect a file that
changes during confirmation.
