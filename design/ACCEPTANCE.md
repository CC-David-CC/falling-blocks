> Original design reference from 2026-10-30. This describes intended behavior, not current implementation or qualification. The current app README is authoritative for status. Pseudocode and template JSON here are documentation, not build entries.

# Acceptance — Falling Blocks

**All runtime cases are NOT RUN.** This file is a plan; document checks are not gameplay evidence.

Apply all C01–C24 in [common acceptance](../../../../../docs/games/design-reference/ACCEPTANCE-COMMON.md). No immersive support is claimed or required for this flat-screen app.

## Game-specific cases

| ID | Experiment / invariant | Status |
|---|---|---|
| falling-blocks-G01 | Four lines clear exactly once and score once. | not_run |
| falling-blocks-G02 | Repeated wall rotation never places a piece outside the grid. | not_run |
| falling-blocks-G03 | Hard-drop plus held touch cannot spawn a second drop. | not_run |
| falling-blocks-G04 | Save mid-lock restores counters and bag, not only the settled grid. | not_run |
| falling-blocks-G05 | Top-out and hidden-row behavior are covered. | not_run |
| falling-blocks-G06 | Touch release outside canvas stops repeat. | not_run |

## Release evidence

Record rules/content and dependency versions, actual asset names/hashes, desktop browser, real phone and (where required) Galaxy XR build, commands/logs, complete-playthrough result, save restoration result, multiwindow/late-disposal behavior, frame timing and unresolved defects. Exercise actual Rive properties and texture input rather than substituting an HTML mock.

A pure rules unit test, a visual smoke test and a hardware XR test are different evidence. Preserve that distinction. All promised features must be demonstrated or explicitly left incomplete; do not relabel a generic engine scene as the finished game.
