---
title: "Architecture and difficulty"
section: explanation
order: 8
description: "Keep pure rules separate from rendering and interpret difficulty scores."
---

## Source organization

The rules, the solver and the generator are plain functions over short codes, with no
DOM. The drawing is a separate entry.

The file-by-file tree, with a line on each source file, is in [docs/ARCHITECTURE.md](../ARCHITECTURE.md): the rules and the solver (`layout`, `solve`, `flow`, `game`), the generator and the difficulty (`generate`, `difficulty`, `deduce`), the levels (`levels*`, `marks`, `daily`), the drawing (`draw`), and the page (`mount`, `element`, `view`). Tests sit beside the code they test (`*.test.ts`), and the solver is held to
`brute.fixture.ts`, which tries every way of facing every piece, on small boards, with locked pieces,
walls and an inlet and outlet among them. `levels.<size>.test.ts` proves every level of a size again
(`levelSuite.fixture.ts`). `scripts/` builds the demo, makes the difficulty reference sets and the levels,
and checks the package as npm packs it; `demo/` is the playable page and `e2e/` plays it in real browsers.

## Difficulty within a size

Classic difficulty ranks obscure starts, deduction rounds, unsettled pieces, guessing and spares against reference quantiles of the same size, kind and wrap. A score of 50 is a middling board in that reference group, not a time estimate or an across-size comparison. Big-piece levels use a separate cross-size score that blends used-piece size and tangle. Native marks divide scores into five bands.

Generated level arrays are owned by their writers. `scripts/suido-level-docs.ts --refresh` refreshes documentation comments through the same helper without regenerating boards, quantiles or ordering. A full generation uses the helper too. For the detailed formulas and measures, see [difficulty](../DIFFICULTY.md); for the physical source tree, see [architecture](../ARCHITECTURE.md).
