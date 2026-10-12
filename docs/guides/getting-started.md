---
title: "Getting started"
section: tutorial
order: 1
description: "Read a fixed level, turn a piece and validate its answer."
---

## Read one fixed puzzle

Install `@johnmorrisdotca/suido` with npm. The root entry contains pure board rules; the individual level entry carries just that size's boards. Start with a shipped row rather than making a new puzzle.

```ts
import {decodeLayout, newGame, turnAt, flowOfGame, checkSuidoAnswer} from "@johnmorrisdotca/suido";
import {levelAnswer} from "@johnmorrisdotca/suido/levels-info";
import {SUIDO_5X5} from "@johnmorrisdotca/suido/levels-5x5";
const row = SUIDO_5X5[0];
const layout = decodeLayout(row[0])!;
const game = turnAt(newGame(row[0])!,0);
console.log(layout.width,layout.height,game.turns,flowOfGame(game).solved);
console.log(checkSuidoAnswer(row[0],levelAnswer(row)!));
```

The non-null assertions here apply to shipped, tested rows. Validate host input and branch on `null`; never assert an arbitrary pasted code is valid. A tap returns a new game. Its water state describes progress, and `solved` applies the board's own rule.

## Put it in a page

Use the [native element](embeds.md) for a playable board, or [SVG drawing](drawing.md) for an image. The [level guide](levels.md) explains lazy loading and daily selection. All public calls have standalone examples in the [root reference](entry:main).
