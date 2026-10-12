---
title: "Keep and restore progress"
section: how-to
order: 3
description: "Store native progress with the original puzzle code."
---

## Save a game deliberately

```ts
import {newGame,turnAt,gameProgress,gameFromProgress,gameCode} from "@johnmorrisdotca/suido";
import {SUIDO_5X5} from "@johnmorrisdotca/suido/levels-5x5";
const code = SUIDO_5X5[0][0];
const game = turnAt(newGame(code)!,0);
const kept = gameProgress(game);
const restored = gameFromProgress(code,kept);
console.log(restored?.turns,restored && gameCode(restored)===gameCode(game));
```

Keep the original puzzle code alongside progress. The compact progress format preserves the game's turns and facings; `gameCode` instead describes the current board and cannot preserve the number of taps. `gameFromCode` reconstructs legal facings with `turns` set to zero. Both restore functions return `null` for incompatible input.

## Let the host own storage

The SDK returns strings; your host decides whether to offer a download or save them. The iframe stores nothing. An element's `progress` getter reads the live game and its setter restores a kept string. Listen to `suido-change` for updated progress, and keep event handling separate from board creation so a callback change does not restart play.

A hint needs a valid matching answer. Counts alone do not prove a board is solved: read [flow and validation](rules.md), then [the event contract](../embeds.md).
