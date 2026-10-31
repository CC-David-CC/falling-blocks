# Falling Blocks coach artwork — in progress

This is original artwork authored as Rive Markup Language for Falling Blocks.
It is not yet part of the game or a completed Rive integration. The source is
`scene.rml`; generated `.riv` and preview files are ignored build outputs.

The 180×180 `Main` artboard contains the `Presentation` state machine and a
looping blink. The `CoachState` view model exposes `danger` (0–1) and `combo`
(0–4 displayed, values above four clamp) as two meters. Both properties were
rendered with Rive CLI 1.8.0 and verified visually; the blink was inspected at
frames 1 and 146. The shape and color choices were created for this project;
there are no imported illustrations, fonts or audio.

Still required: `menuState`, `celebrate` and `topOut` behavior, visible idle,
alert, celebration and disappointed states, actual app-owned data binding,
reduced-motion behavior, runtime/asset packaging, independent instances and
browser/phone/lifecycle tests. A compiling artwork file is not evidence those
requirements work. No runtime asset is shipped yet.

Rebuild with the official Rive CLI version 1.8.0, from SIMPLIFIED:

```
rive apps/system/falling-blocks/coach --verify
rive inspect apps/system/falling-blocks/coach --summary
rive apps/system/falling-blocks/coach --once
rive apps/system/falling-blocks/coach --screenshot --data=danger=1 --data=combo=3 --advance=1
```

The CLI was obtained from `https://releases.rive.app/cli/v1.8.0/rive-linux-x64.tar.gz`;
the publisher's manifest SHA-256 was
`9d67bdb77e33db2daa7ce80df51579212ff0cf55a9d6ae3696e4608a248847af`.
No account or upload was used. Check the CLI's current terms and runtime
compatibility before distributing a compiled asset.
