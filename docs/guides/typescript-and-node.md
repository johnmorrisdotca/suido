---
title: TypeScript and Node
section: how-to
order: 15
description: Use the package's types, and run the rules on a server with no DOM.
---

The package ships its own types, for each entry point. The rules are plain functions over strings and numbers, so the same call gives the same answer in Node, Deno, Bun, a worker and a browser. This file type-checks, then runs under Node 22.18 or later, which strips the types.

```ts
import { checkSuidoAnswer, type SuidoCheck } from "@johnmorrisdotca/suido";
import { levelAnswer, loadSuidoLevels } from "@johnmorrisdotca/suido/levels";

const rows = await loadSuidoLevels("7x7");
const row = rows[11]!; // level 12
const check: SuidoCheck = checkSuidoAnswer(row[0], levelAnswer(row)!);
console.log(check.ok, rows.length);

// @ts-expect-error a list of levels is not a board
const wrong: string = rows;
console.log(typeof wrong);
```

`@ts-expect-error` is there to show that the compiler refuses the wrong type.

## On a server

A server needs no DOM. It checks what the player sent against the same rules.

```mjs
// A server checks an answer with the same rules the board plays by: pure functions, no DOM, no browser globals.
import { checkSuidoAnswer } from "@johnmorrisdotca/suido";
import { dailySuidoLevel, levelAnswer, loadSuidoLevels } from "@johnmorrisdotca/suido/levels";

const rows = await loadSuidoLevels("7x7");
const today = dailySuidoLevel("7x7", new Date()); // the level of the day at 7×7: 1 to 256
const row = rows[today - 1]; // send row[0], the board, to the browser; keep the answer
console.log(checkSuidoAnswer(row[0], levelAnswer(row)), rows.length); // { ok: true } 256
```

See [getting started](getting-started.md) for mounting the board in a page.
