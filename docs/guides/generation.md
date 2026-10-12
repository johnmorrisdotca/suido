---
title: "Generate and verify a puzzle"
section: how-to
order: 5
description: "Use reproducible seeds and distinguish a proof from an exhausted search."
---

## Make a reproducible board

```ts no-run
import {makeSuido,checkSuidoAnswer,solve} from "@johnmorrisdotca/suido";
const made = makeSuido({size:5,seed:42,kind:"network",difficulty:50,attempts:3});
const proof = solve(made.layout,2,20000);
console.log(made.seed,made.difficulty,checkSuidoAnswer(made.code,made.answer));
console.log(proof.complete && proof.count===1);
```

Generation is synchronous and may pause the caller, particularly on large or wrapped boards. Use a worker for host workloads that must keep input responsive. Difficulty targeting tries candidates and returns the nearest found within the attempt limit; it is not a promise of an exact score. Keep the returned seed and the same options/version to reproduce a selected candidate.

## Treat the search result carefully

`solve` reports both `count` and `complete`. One found solution after exhausting a budget is not a uniqueness proof. Ask for a limit of two, and require `complete && count === 1`. `countSolutions` returns only a count, so use the richer result for proof decisions. `checkSuidoAnswer` validates a supplied answer without proving uniqueness.

Locks, walls, wrap, big pieces and block turns are encoded board rules, not UI decorations. See [generation costs](../GENERATOR.md), [twists](../TWISTS.md) and [difficulty](../DIFFICULTY.md) before choosing expensive options.
