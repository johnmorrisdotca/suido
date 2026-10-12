---
title: "Troubleshooting and FAQ"
section: troubleshooting
order: 9
description: "Explain null returns, loading order and invalid saved states."
---

## A decoder or restorer returned null

`decodeLayout` rejects invalid dimensions, unknown pipe characters, missing sources and invalid source/drain placements. `newGame` inherits that validation. `gameFromProgress` also checks the progress belongs to that board; `gameFromCode` rejects changes to shapes, locked pieces, endpoints or block integrity. Keep the original code with saved progress. `levelSolution` and `levelAnswer` return `null` when a row's code or turn digits cannot be read.

## A metadata call returned null

Unknown levels have no size, score, marks or piece count. A level may legitimately have no teaching/testing role. `firstUnsolvedLevel` returning `null` means completion of the supplied set. `hintFor` returning `null` means no answer-facing piece remains to correct. `quartersBetween`, `tapsBetween` and `blockQuartersBetween` return `null` for incompatible shapes or turns. An unknown guide/shape identifier returns `undefined`, not `null`.

## Loading and search questions

A supported size must load before `suidoLevelsOf`, and the big collection before `suidoBigLevelsLoaded`; otherwise they throw. Invalid daily dates throw rather than rolling into the next month. For an inconclusive solver budget, inspect `complete` and increase the budget deliberately; never interpret one found answer as a proof.

A mount returning `null` needs a valid board and compatible answer/progress. If the board is only an image, use `/play` for controls. `grid` and display `size` have different jobs; see [embeds](embeds.md) and [the full contract](../embeds.md).
