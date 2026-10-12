---
title: "Load fixed and daily levels"
section: how-to
order: 2
description: "Load only one size and select the shared UTC daily puzzle."
---

## Load before reading

```ts
import {loadSuidoLevels,suidoLevelsOf,dailySuidoLevel,firstUnsolvedSuidoLevel} from "@johnmorrisdotca/suido/levels";
await loadSuidoLevels("5x5");
const daily = dailySuidoLevel("5x5","2026-10-12")!;
console.log(daily,suidoLevelsOf("5x5")[daily-1][0]);
console.log(firstUnsolvedSuidoLevel("5x5",new Set([1,2])));
```

The loader caches a size after its first load. `suidoLevelsOf` throws if that size has not loaded; it never silently invents a list. A direct `/levels-5x5` import needs no loader. `/levels-info` reads counts, blocks, marks and daily numbers without loading board data; importing `/levels` makes every dynamically reachable size available to a bundler.

## Keep numbering clear

Public level numbers start at 1; array positions and block indices start at 0. Blocks contain sixteen levels and open according to the solved-number set you supply. `firstUnsolvedSuidoLevel` returns `null` when all are solved. The separate big-piece collection has 64 levels and its own loader and metadata.

## Choose a day

Daily dates are valid `YYYY-MM-DD` strings or `Date` moments interpreted in UTC. Everyone gets the same level at a size on a day, regardless of unlocked blocks. Unknown sizes return `null`; invalid dates throw. See [the complete level rules](../LEVELS.md) and [dailySuidoLevel](api:dailySuidoLevel).
