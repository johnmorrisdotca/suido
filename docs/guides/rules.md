---
title: "Pipe masks and water rules"
section: explanation
order: 7
description: "Understand cell indices, masks, spare pipes and block rotations."
---

## Masks and positions

A pipe mask uses four bits: north 1, east 2, south 4, west 8. `turn` rotates those bits; `opposite` instead accepts a side index from 0 to 3. Cells are zero-based in row-major order. A native code includes dimensions, masks, sources, drains and twists, so a code is more than an image of pipes.

```ts
import {NORTH,EAST,turn,opposite,shapeOf} from "@johnmorrisdotca/suido";
const elbow = NORTH | EAST;
console.log(elbow,turn(elbow),shapeOf(elbow),opposite(0));
```

## The board's kind decides completion

A network must wet every pipe with no leak. A drains board must reach every drain with no leak from its wet pipes; spare dry pipes need not be used. An inlet-outlet board asks for one unbranched path between its endpoints. `flowOf` exposes wet cells, traversal depths and spills, and `isSolved` uses these native rules. Matching two adjacent openings alone is insufficient.

A big piece occupies a 2×2 square. A block turn moves all four cells around the square and turns their masks together; it is not four independent rotations. Locked cells and walls constrain legal answers. The shipped classic ladder stays fixed; the separate big-piece set supplies its own boards. See [the pieces](../PIECES.md), [twists](../TWISTS.md) and [architecture](architecture.md).
