# Falling Blocks — development

This directory contains an unregistered development prototype. `model.mjs` is an independent,
deterministic rules model based on the design at
`../../../../served_apps_public/game_tree/01-phaser-arcade/falling-blocks/`.
It implements a 10×20 board with four hidden rows, seeded seven-piece bags,
movement, a project-defined rotation/kick table, ghost, hold, scoring, sprint,
bounded lock resets, including when a piece leaves a ledge, and a versioned exact logical snapshot. Its 60 Hz ticks are
logical; the future presentation must discard elapsed timing debt on suspension.
The rules do not claim official Tetris rotation or scoring compatibility.

Run `node tests/falling-blocks-model.test.mjs` from SIMPLIFIED. These are model tests, not evidence of physical touch, Rive or persistence.
The prototype is not registered in the desktop and is not live. Phaser 4.2.1
is pinned in this app's own lockfile; its MIT license is included in the bundle.
An isolated browser harness exercises two instances, mode selection, help,
keyboard movement, an emulated touch tap, save, mutation, load, invalid save
rejection and independent disposal with a memory-only file-service stand-in at
desktop, 4K and emulated phone viewport sizes. The board also follows its
container when resized, keeping its aspect ratio; a per-window observer is
released on close. Minimizing or rolling up its desktop window pauses the game;
restoring the window requires an explicit Resume. The current prototype has no game audio and does not create
an audio context. A separate isolated local-desktop test now exercises the actual account file
service, sync to account disk, recovery in a fresh browser session, isolation
from another account, unsaved-close cancellation and a same-browser stale-save
conflict. A separate-browser conflict test simulated a gateway outage in one browser,
saved different games in both, and verified the local and server copies survived
with a visible conflict notice. Physical touch, layout quality, Rive and live-site
behavior remain unverified.

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
  slice. Phaser 4.2.1 is pinned and runs in the isolated harness; Rive has not yet been qualified or locked.
- `active-system/app.js` controls focus and window sizing. Keyboard handling
  must only capture focused play and must not consume input in another window;
  clear held input on pointer cancellation, blur and backgrounding. Observe
  the app container rather than the screen for rendering dimensions.

## Still required before release

Review and finish the prototype interface, phone controls, settings and tutorial;
test real cross-device operation and physical-phone operation; performance measurement; authored original
`block-coach.riv`, qualified Rive runtime and tested artboard properties and
triggers; real asset/license provenance; and end-to-end review against the
handoff's common and game-specific acceptance cases. Never label placeholders
or these model tests as a finished game.

## Isolated browser harness

With build-time Node, the app builder dependencies and the pinned app
dependencies installed, build the app, copy `tests/falling-blocks-fixture.html`
as the build directory's `index.html`, and serve that build directory on
127.0.0.1:18334. Run `CODI_BLOCKS_MANIFEST=.build/blocks-app/apps.json node
tests/falling-blocks-browser.test.mjs` from SIMPLIFIED with Chrome debugging
available at 127.0.0.1:19255. Add `CODI_PHONE=1` for the emulated phone viewport.
The fixture's in-memory storage must never be used as production storage.

## Local desktop account test

Build `calculator files falling-blocks` into an app bundle and start
`run-simplified-local.py --isolated` with that bundle. Set `CODI_TEST_URL` and
`CODI_TEST_DATA_ROOT` to the isolated server and its `account-data` directory,
then run `node tests/falling-blocks-account.test.mjs`. This mounts the prototype
into a Calculator window with the real app host as a test-only adapter; the
public menu does not yet include the game. Never point this fixture at live data.
