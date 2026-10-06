<h1 align="center">Suido <sub>水道</sub></h1>

<p align="center"><strong>A pipe puzzle for JavaScript and TypeScript.</strong><br>
Turn the pieces until the water from the pump reaches every drain and nothing is left open. 3,520 fixed levels from easy to hard, in 5×5 to 28×28 and four long pipe shapes, each with exactly one answer, with walls, locked pieces, wrap-around edges, several pumps, drains and inlet-to-outlet paths, and boards of your own with big pieces that fill four squares and squares of four pieces that turn together. Boards as short codes, a solver that counts answers, a seeded generator whose every board has exactly one, a difficulty from 1 to 100 within each size, and the water drawn as SVG that flows along the pipes as they join, played by tap, mouse and keyboard in any page with one call or one tag. No dependencies.</p>

<p align="center">
  <a href="https://github.com/johnmorrisdotca/suido/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/johnmorrisdotca/suido/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/suido"><img alt="npm" src="https://img.shields.io/npm/v/@johnmorrisdotca/suido?color=2f5d4a"></a>
  <a href="./LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-2f5d4a"></a>
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-2f5d4a">
  <img alt="TypeScript" src="https://img.shields.io/badge/types-TypeScript-3178c6">
</p>

<p align="center"><a href="https://johnmorrisdotca.github.io/suido/"><strong>Play the levels →</strong></a> · <a href="https://johnmorrisdotca.github.io/suido/api.html">API reference</a> · <a href="docs/API.md">Every export</a></p>

<table align="center">
<tr>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/hero-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/hero-desk-light.webp" alt="Level 95 of the 9 by 9 levels, solved, on a desk: the page's header with its language chooser and cloth swatches, the difficulty marks and the lesson of the level above the board, and a square of pale tiles with blue pipes and round drains, every pipe filled with water running from the pump at the top across the dashed rim to every drain, and the buttons under it." width="720">
</picture>
<br><em>A solved level on a desk: the water from the pump has reached every drain.</em>
</td>
<td align="center" valign="top">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/hero-phone-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/hero-phone-light.webp" alt="A long 8 by 14 level on a phone, in Japanese: the pipes part way filled with water, a padlock on one piece, a few open ends still leaking, and under the board the twist chip and the lines of what is wanted." width="220">
</picture>
<br><em>A long level on a phone, in Japanese, in the device's light or dark.</em>
</td>
</tr>
</table>

Suido is the old pipe-rotating puzzle, played with a tap. Every cell holds a
piece of pipe that cannot be moved, only turned. Water comes from a pump,
flows through every opening that meets another, and runs out of any opening
that meets nothing. You win when the water reaches everything it should and
nothing leaks. It is in [the demo](https://johnmorrisdotca.github.io/suido/),
with nothing to install.

## In 30 seconds

```sh
npm install @johnmorrisdotca/suido
```

```ts
import { checkSuidoAnswer, flowOf, makeSuido, newGame, turnAt } from "@johnmorrisdotca/suido";
import { drawSuido } from "@johnmorrisdotca/suido/draw";
import { levelAnswer, loadSuidoLevels } from "@johnmorrisdotca/suido/levels";

const made = makeSuido({ size: 8, difficulty: 70, seed: 7 });   // a board with exactly one answer, about as hard as 70 of 100
made.code;                       // "8x8:…": the board as it is first shown, every piece turned at random
made.difficulty;                 // 1 to 100 among 8×8 boards

let game = newGame(made.code)!;  // a game: how every piece faces now, and how far each has been turned
game = turnAt(game, 12);         // a tap on a cell: a quarter turn clockwise (turnAt(game, 12, -1) the other way)
flowOf(game.start, game.masks);  // where the water has got to, in what order, and where it runs out

checkSuidoAnswer(made.code, made.answer);   // { ok: true }, in O(cells), for a server to trust
const svg = drawSuido(game.start, { masks: game.masks });   // the board as SVG text

const rows = await loadSuidoLevels("8x8");                  // the 256 levels of a size, easiest first, loaded when asked for
checkSuidoAnswer(rows[11][0], levelAnswer(rows[11])!);      // level 12: its board and its one answer
makeSuido({ size: 8, kind: "inlet-outlet", locked: 3, walls: 4, seed: 7 });   // a board of your own, with twists
```

## Who it is for

- **Puzzle sites and apps** that want the puzzle with the rules already right:
  boards that can be made on the fly from a seed and are each guaranteed one
  answer, a check a server can trust, and a drawing whose water flows.
- **Anyone making pipe puzzles of their own**, who wants a solver that counts
  answers, a generator that makes boards with exactly one, and a measure of how
  hard each is.

## Features

- **Fixed, numbered levels.** Thousands of boards in sixteen sizes (5×5 to 14×14, three long pipe shapes, and the huge 20×20, 28×28 and long 20×50), each with exactly one answer, easy to hard, in blocks of sixteen that open one after another. A level keeps its number, so a time on it can be compared with anybody's. See [Levels](#levels).
- **Huge boards, played on a phone.** Up to 1,000 pieces, drawn as SVG that flows, zoomed and moved about by a pinch, a drag, the wheel and three buttons, with a tap still a tap. See [Playing it in a page](#playing-it-in-a-page).
- **A level of the day**, the same for everybody, from the date alone: `dailySuidoLevel(size, date)`. No server, no seed.
- **Twists a level declares**: drains, several pumps, locked pieces, walls, wrap-around edges and inlet-to-outlet paths, as options of the generator too.
- **Big pieces and blocks that turn as one**, in boards of your own: a big piece fills four squares and has up to eight openings; a block is four ordinary pieces that a tap turns together, each moving round to the next place as it turns. Each has exactly one answer, like every board.
- **A generator and a solver.** A seeded generator whose every board has exactly one answer, a solver that counts answers, and a difficulty from 1 to 100 within each size.
- **A check a server can trust.** `checkSuidoAnswer` reads a finished board in O(cells), with no search, and says the first thing wrong.
- **Boards and games as short strings**, so a board, its answer and a game half played can be kept in a database column.
- **The water flows.** The board is drawn as SVG text in an entry of its own, and painted in place so the water is seen to run along the pipes as they join and to run back out of one turned away.
- **Played in any page** by tap, mouse and keyboard, with a hint, Start over and the twists as chips, as one function call (`mountSuido`) or one tag (`<suido-board>`).
- **English and Japanese**, in the board's words and the demo.
- **No dependencies**, no network requests, no sound, and nothing stored outside the page it is in.

### What's in it

Each picture is a numbered level, drawn by the package's `drawSuido` and painted with `paintSuido`, taken from [the demo](https://johnmorrisdotca.github.io/suido/) with `pnpm screenshots:readme`, in light and dark. A level's water is shown by solving a share of it in the order the water would flow, so the same pictures come again. The levels that teach the twists are the 31st, 47th, 63rd, 79th, 95th and 111th of every size.

<table>
<tr>
<td align="center" valign="top" width="33%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/network-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/network-desk-light.webp" alt="A network level: blue water running part way from its pump through pale tiles of pipe, the rest of the pipes still dry and grey." width="300">
</picture>
<br><em><strong>A network</strong>: every piece must be wet and nothing may run out.</em>
</td>
<td align="center" valign="top" width="33%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/drains-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/drains-desk-light.webp" alt="A drains level: a sparse board of a few pipes and round drains with bare ground between, the water running from the pump to each drain." width="300">
</picture>
<br><em><strong>Drains</strong>: only the drains must be reached; spare pieces may face any way.</em>
</td>
<td align="center" valign="top" width="33%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/several-pumps-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/several-pumps-desk-light.webp" alt="A level with several pumps, each a drop in a dark blue disc, each feeding its own blue pipes." width="300">
</picture>
<br><em><strong>Several pumps</strong>: each feeds its own pipes.</em>
</td>
</tr>
<tr>
<td align="center" valign="top" width="33%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/locked-pieces-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/locked-pieces-desk-light.webp" alt="A level with locked pieces: blue pipes, and a small padlock on each piece that cannot be turned." width="300">
</picture>
<br><em><strong>Locked pieces</strong> cannot be turned; a padlock marks each.</em>
</td>
<td align="center" valign="top" width="33%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/walls-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/walls-desk-light.webp" alt="A level with walls: thick dark bars across some edges between cells, which the water cannot cross, the blue pipes filled up to them." width="300">
</picture>
<br><em><strong>Walls</strong>: water cannot cross some edges.</em>
</td>
<td align="center" valign="top" width="33%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/wrap-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/wrap-desk-light.webp" alt="A level with wrap-around edges, drawn with a dashed red rim: blue pipes leave one side of the board and come in at the other." width="300">
</picture>
<br><em><strong>Wrap</strong>: a pipe leaving one side comes in at the other.</em>
</td>
</tr>
<tr>
<td align="center" valign="top" width="33%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/inlet-to-outlet-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/inlet-to-outlet-desk-light.webp" alt="An inlet-to-outlet level: one pump at the top left, one drain at the bottom right, a single blue path between them and decoys left dry." width="300">
</picture>
<br><em><strong>Inlet to outlet</strong>: one path, no branch; decoys stay dry.</em>
</td>
<td align="center" valign="top" width="33%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/long-board-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/long-board-desk-light.webp" alt="A long board of eight columns and fourteen rows, the water partly run through its pipes." width="300">
</picture>
<br><em><strong>A long board</strong>: 8×14, one of four long shapes.</em>
</td>
<td align="center" valign="top" width="33%">
<picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/huge-board-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/huge-board-desk-light.webp" alt="A huge board of twenty by twenty pieces, four hundred small cells of pipe, none yet turned." width="300">
</picture>
<br><em><strong>A huge board</strong>: up to 1,000 pieces, zoomed by a pinch.</em>
</td>
</tr>
</table>

## Use it in your project

### Install

```sh
npm install @johnmorrisdotca/suido
```

```sh
pnpm add @johnmorrisdotca/suido
```

```sh
yarn add @johnmorrisdotca/suido
```

A page with no bundler loads the board as a tag from a CDN, naming the major version so that a release that changes what you use is one you choose:

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/suido@1/dist/element-define.js"></script>
```

Suido is three things, each usable without the others: **the puzzle** (boards, rules, solver, generator and levels, as plain functions over strings), **the drawing** (SVG text and the painter of the water), and **the page** (a mounted board or a tag). The table under [Playing it in a page](#playing-it-in-a-page) says which entry holds which. The examples play 7×7, level 12.

### 1. The API alone, on a server

```ts no-check
import { checkSuidoAnswer } from "@johnmorrisdotca/suido";
import { dailySuidoLevel, levelAnswer, loadSuidoLevels } from "@johnmorrisdotca/suido/levels";

const rows = await loadSuidoLevels("7x7");
const today = dailySuidoLevel("7x7", new Date());   // the level of the day at 7×7: 1 to 256
const row = rows[today! - 1];                       // send row[0], the board, to the browser; keep the answer
checkSuidoAnswer(row[0], answerFromThePlayer);      // { ok: true } or { ok: false, reason }, in O(cells)
levelAnswer(row);                                   // what the player's answer must come to
```

Importing the main entry on a server is safe: it touches no page.

### 2. One tag, no bundler

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/suido@1/dist/element-define.js"></script>
<suido-board size="7x7" level="12" chips hints></suido-board>
<script>
  document.querySelector("suido-board").addEventListener("suido-solve", (event) => console.log(event.detail.code));
</script>
```

### 3. A bundler, and a framework

`import "@johnmorrisdotca/suido/element/define"` once, in code that runs in the browser, and `<suido-board>` is a tag like any other. The tag draws itself in the page's own DOM, so the page's CSS reaches it. Its attributes are read again when they change, and it speaks through DOM events (`suido-change`, `suido-turn`, `suido-hint`, `suido-turning`, `suido-solve`) that carry a `detail`.

```jsx
// React 19
import { useEffect, useRef } from "react";
import "@johnmorrisdotca/suido/element/define";

export function Level({ size, level, onSolved }) {
  const board = useRef(null);
  useEffect(() => {
    const listen = (event) => onSolved(event.detail.code, event.detail.turns);
    board.current?.addEventListener("suido-solve", listen);
    return () => board.current?.removeEventListener("suido-solve", listen);
  }, [onSolved]);
  return <suido-board ref={board} size={size} level={String(level)} hints />;
}
```

```vue
<!-- Vue 3: tell the compiler the tag is not a Vue component -->
<script setup>
import "@johnmorrisdotca/suido/element/define";
defineProps({ size: String, level: Number });
</script>
<template>
  <suido-board :size="size" :level="level" hints @suido-solve="(event) => console.log(event.detail.code)" />
</template>
<!-- in vite.config: vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("suido-") } } }) -->
```

```svelte
<!-- Svelte 5 -->
<script>
  import "@johnmorrisdotca/suido/element/define";
  let { size, level } = $props();
  let board;
  $effect(() => {
    const listen = (event) => console.log(event.detail.code);
    board.addEventListener("suido-solve", listen);
    return () => board.removeEventListener("suido-solve", listen);
  });
</script>
<suido-board bind:this={board} size={size} level={level} hints></suido-board>
```

```ts no-check
// Angular: a standalone component with CUSTOM_ELEMENTS_SCHEMA
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import "@johnmorrisdotca/suido/element/define";

@Component({
  selector: "app-level",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<suido-board size="7x7" level="12" hints (suido-solve)="solved($event)"></suido-board>`,
})
export class Level {
  solved(event: Event) { console.log((event as CustomEvent).detail.code); }
}
```

In Next.js or any server-rendering framework, import the define entry from a client component, so the tag is defined in the browser. Or skip the tag and call `mountSuido(element, options)` from `@johnmorrisdotca/suido/play` in an effect: the handle it returns has `destroy()`.

`pnpm test:frameworks` builds these recipes from the packed tarball in a scratch project for each of the five and solves a level in each, in Chromium and WebKit; it needs the network and a few minutes, so it is run before a release and in CI rather than with `pnpm check`.

### What a developer gets

- **Typed results**, with a doc comment on every export. Every function is pure and returns new values.
- **No dependencies.** ES modules, an entry per concern, and `sideEffects` set so that only the define entry has an effect.
- **Where it runs.** See [Browser support](#browser-support).

The cookbook, with the output of each example, is under [Examples](#examples).

## Examples

Every TypeScript and JavaScript block that can run is type-checked against the built package and run by `pnpm test:readme`, so the output after `// →` is what the code prints. The puzzle needs no page and no network, so most of these run under Node.

### A page with nothing else

Save this as a file and open it: one script and one tag. Level 12 of the 7×7 levels is the same board for every player on every day:

```html
<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>A pipe puzzle</title>
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/suido@1/dist/element-define.js"></script>
<suido-board size="7x7" level="12" chips hints></suido-board>
```

### Make a board

`makeSuido` makes a board from a seed with exactly one answer, and says how hard it is among the boards of its size. The same options and seed make the same board in every browser and every Node:

```ts
import { makeSuido } from "@johnmorrisdotca/suido";

const made = makeSuido({ size: 5, difficulty: 40, seed: 7 });
console.log(made.code);          // → 5x5:Eba3C3c9955C6abcdc3ckac3I
console.log(made.difficulty);    // → 44
console.log(made.answer);        // → 5x5:CeacE696955E3ad3bc69ia93I
```

### Play it, a tap at a time

A game is plain data. A tap turns a piece a quarter; the water is worked out from the pieces as they face now. Following the package's hints, one tap at a time, solves the board:

```ts
import { flowOf, hintFor, isGameSolved, makeSuido, newGame, tapsToAnswer, turnAt } from "@johnmorrisdotca/suido";

const made = makeSuido({ size: 5, difficulty: 40, seed: 7 });
let game = newGame(made.code)!;
console.log(isGameSolved(game), flowOf(game.start, game.masks).wet.filter(Boolean).length);   // → false 1
console.log(tapsToAnswer(game, made.solution));                                              // → 20
for (let hint = hintFor(game, made.solution); hint !== null; hint = hintFor(game, made.solution)) game = turnAt(game, hint);
console.log(isGameSolved(game), game.turns);                                                  // → true 28
```

`tapsToAnswer` is the par: the fewest taps from where the board stands. The hints do not know it, and take a few more.

### Check an answer on a server

`checkSuidoAnswer` reads a finished board in O(cells), with no search, and says the first thing wrong. A server holds the board's code, and trusts nothing the browser says about how it was played:

```ts
import { checkSuidoAnswer, gameCode, makeSuido, newGame } from "@johnmorrisdotca/suido";

const made = makeSuido({ size: 5, difficulty: 40, seed: 7 });
console.log(checkSuidoAnswer(made.code, made.answer));              // → { ok: true }
console.log(checkSuidoAnswer(made.code, gameCode(newGame(made.code)!)));
// → { ok: false, reason: 'the water runs out of an open end' }
console.log(checkSuidoAnswer(made.code, "nonsense"));               // → { ok: false, reason: 'the answer is not a Suido code' }
```

### A fixed level, and its one answer

The levels are fixed and numbered, so a time on level 12 of a size can be compared with anybody's. A size is its own import, loaded when asked for; a row is `[board, turns, twists]`:

```ts
import { checkSuidoAnswer } from "@johnmorrisdotca/suido";
import { levelAnswer, loadSuidoLevels, SUIDO_LEVEL_COUNTS } from "@johnmorrisdotca/suido/levels";

const rows = await loadSuidoLevels("7x7");
console.log(rows.length, SUIDO_LEVEL_COUNTS["7x7"]);                 // → 256 256
const row = rows[11];                                                // level 12
console.log(checkSuidoAnswer(row[0], levelAnswer(row)!));            // → { ok: true }
```

### Today's level

A pure function of the date and the size, the same for everybody on every machine, with no server and no seed. A day is counted in UTC:

```ts
import { dailySuidoLevel, suidoDay } from "@johnmorrisdotca/suido/levels";

console.log(dailySuidoLevel("7x7", "2026-10-06"), dailySuidoLevel("7x7", "2026-10-07"));   // → 4 101
console.log(suidoDay(new Date("2026-10-06T23:30:00Z")));                                     // → 2026-10-06
```

### A board with twists

A board of your own can combine the twists a level declares, and `twistsOf` reads them back:

```ts
import { makeSuido, twistsOf } from "@johnmorrisdotca/suido";

const made = makeSuido({ size: 6, kind: "inlet-outlet", locked: 2, walls: 3, seed: 3 });
console.log(twistsOf(made.layout));                // → [ 'locked', 'walls', 'inlet-outlet' ]
console.log(made.code.slice(0, 6));                // → 6x6i:
```

### The board as an image

`drawSuido` returns SVG text; `paintSuido` writes the water onto it in place, so the water is seen to run:

```ts
import { makeSuido, newGame } from "@johnmorrisdotca/suido";
import { drawSuido } from "@johnmorrisdotca/suido/draw";

const game = newGame(makeSuido({ size: 5, seed: 7 }).code)!;
const svg = drawSuido(game.start, { masks: game.masks });
console.log(svg.startsWith("<svg"), svg.length > 1000);     // → true true
```

### Keep a game half played

`gameProgress` is a short string a database column can hold, and `gameFromProgress` is the game it comes back as:

```ts
import { gameFromProgress, gameProgress, makeSuido, newGame, turnAt } from "@johnmorrisdotca/suido";

const made = makeSuido({ size: 5, difficulty: 40, seed: 7 });
const game = turnAt(newGame(made.code)!, 3);
const kept = gameProgress(game);
console.log(kept);                                          // → 0001000000000000000000000:1
console.log(gameFromProgress(made.code, kept)?.turns);      // → 1
```

### Mount a board and listen

`mountSuido` is the tag as a function call; it keeps the turns, the hint, Start over and the chips for you, and says what happens as events. A board is its code, and its one answer is what Hint and the par need:

```ts no-run
import { mountSuido } from "@johnmorrisdotca/suido/play";
import { levelAnswer, loadSuidoLevels } from "@johnmorrisdotca/suido/levels";

const rows = await loadSuidoLevels("8x8");
const row = rows[30];                                  // level 31: the level that teaches drains
const board = mountSuido(document.getElementById("board")!, {
  code: row![0],
  answer: levelAnswer(row!)!,
  hints: true,
  chips: true,
  onSolve: ({ code, turns }) => fetch("/solves", { method: "POST", body: JSON.stringify({ code, turns }) }),
});
board?.restart();                                      // the same board again, fresh
```

### A look of your own

Every colour is a CSS variable on `.suido`, set by the page; the table is under [Theming](#theming):

```css
suido-board .suido {
  --sd-water: #1f8fd0;
  --sd-pipe: #394b59;
}
```

## The puzzle

A board is a grid of cells. Each holds a piece, which opens on some of its four
sides: an **end** (one side), a **straight** (two opposite), an **elbow** (two
that meet), a **T** (three) or a **cross** (four), or is bare ground. A tap turns
a piece a quarter, clockwise or the other way; a piece is never moved or
changed. Water comes in at the **pumps**. It goes from a piece into the next
wherever the two openings meet, and **runs out** of any opening of a wet piece
that meets nothing: the edge of the board, bare ground, or a piece that does not
open back. The board is solved when the water reaches what its kind asks and
nothing runs out.

- **Network** (the default): every piece must be wet, and nothing may run out.
  Every cell holds a piece.
- **Drains**: every drain must be reached, and nothing wet may run out. Pieces the
  water does not reach are *spares*: they may be left dry and face any way, so a
  spare is a thing to see past. A drains board has bare ground too.

Either way a board has **exactly one answer**: the generator makes only boards the
solver proves have one (for a drains board, one network of wet pieces; a spare
facing another way is not another answer).

Options, any of which may be combined (each is a *twist*, and a level declares the ones it has: see [Levels](#levels)):

- **Drains**: the kind above, where only the drains must be reached.
- **Several pumps**: each feeds its own pipes, which may meet.
- **Locked pieces**: some pieces cannot be turned. They are given facing the way the answer has them, and a padlock marks each.
- **Walls**: water cannot cross some of the edges between cells, so a pipe open towards one runs out of it.
- **Wrap**: the edges join, so a pipe leaving one side comes in at the other.
- **Inlet to outlet**: the third kind. One pump at the top left and one drain at the bottom right, and the water must run between them in one path with no branch (every wet piece opens on two sides); the other pieces are decoys and stay dry.
- **Big pieces**: some pieces are big. A big piece fills four squares, a two-by-two, and has up to eight openings, two on each side, joined inside by one of five kinds (`BIG_KINDS`): an end, a hairpin, two pipes side by side, two pipes bending one inside the other, and a straight pipe with a branch. A tap turns the whole piece a quarter, where it stands.
- **Block turns**: some squares of four ordinary pieces turn as one. A tap on any of the four turns all four a quarter: each piece moves round to the next place and turns with it, and none can be turned alone. A ring where the four meet says so.
- **Any shape**: boards from 2×2 to 64×64, and not only square.
- **A difficulty**, 1 to 100 among the boards of the size.

What other pipe games do, and which of it Suido took and left, is in [docs/TWISTS.md](docs/TWISTS.md).

## Levels

```ts no-check
import { loadSuidoLevels, SUIDO_SIZES, SUIDO_LEVEL_COUNTS, openSuidoLevels } from "@johnmorrisdotca/suido/levels";
```

Like its sibling [Tsunagi](https://github.com/johnmorrisdotca/tsunagi), Suido has fixed, numbered levels: level 12 at 7×7 is one board for every player on every day, so a time on it can be compared with anybody's.

- **Sizes**: `5x5` to `14x14`, then three pipe shapes, `5x7`, `6x10` and `8x14` (width by height), then the huge boards: `20x20`, `28x28` and the long `20x50`. `SUIDO_SIZES` lists them and `SUIDO_LEVEL_COUNTS` says how many levels each has: 256 each for the thirteen of 14×14 and under, sixty-four (four blocks) for each huge one, 3,520 in all.
- **Each size is its own import**, loaded when asked for (`loadSuidoLevels("8x8")`), or directly as `@johnmorrisdotca/suido/levels-8x8`, so a page playing 5×5 carries none of the others. A size's file is 8 KB to 51 KB gzipped (5×5 to 14×14), and the huge ones are 26 KB (20×20), 49 KB (28×28) and about 60 KB (20×50) gzipped, for sixty-four levels each: a level is its board code, one digit for each cell for its answer, and its twists.
- **A row** is `[board, turns, twists]`: the board as a code, the answer as one digit a cell (the quarter turns clockwise from the way the board gives the piece to the way the answer has it), and the twists it declares, as kebab-case words (`"wrap locked"`; `""` for a plain level). `levelAnswer(row)` is the answer as a code, which `checkSuidoAnswer(row[0], answer)` accepts; `levelBoard(row)` and `levelSolution(row)` give the layout and the pieces of the answer; `declaredTwists(row)` the twists.
- **Easy to hard.** Every level is no easier than the one before, by `exactDifficultyOf` (its place among boards of its size, kind and wrap, from 1 to 100). Level 1 of a size is among the easiest boards of it and level 256 among the hardest. `suidoMarks(size, level)` is the difficulty as 1 to 5 (the score in steps of twenty), read without loading the size.
- **Blocks of sixteen.** A block opens once every level of the block before is solved (`openSuidoLevels(size, solved)`, `nextSuidoLevel`, `blockOf`, `blockRange`). The first block is plain. From the second, the 15th level of a block *teaches* a twist and the 16th *tests* it (`suidoRole(size, level)`): drains, then pumps, locked pieces, walls, wrap, and inlet to outlet. From the eighth block the twists are combined (wrap with locks, walls with locks, pumps with drains, and on to a block with wrap, drains and walls together), and from then on the other places of a block carry twists too.
- **Proved on every build.** Each level is solved from scratch and must have exactly one answer, the stored one; its declared twists must be the twists its board has; no two are the same board turned or mirrored (`symmetryKey`); and the order, the marks and the lessons are checked against the measure.
- **Made on a desk**, never on a site: `node scripts/suido-levels.ts` makes a pool of boards of each kind from seeds taken from the size, the kind and a number (so the same run writes the same files), measures each, and takes the board nearest each level's aim that is no easier than the one before. About 18 minutes in all on one laptop, one process a size (7 s at 5×5 to 5 minutes at 14×14).

`twistsOf(layout)` reads the twists a board has (`drains`, `pumps`, `locked`, `walls`, `wrap`, `inlet-outlet`), for a chip on a level or a filter on a list.

To offer the levels on a site: pick a size and a level number, load the size, read the row, play the board, and check what the player ends with against the row:

```ts no-check
const rows = await loadSuidoLevels("7x7");
const [board, , twists] = rows[11];               // level 12
const game = newGame(board)!;                     // play it; gameCode(game) is what the player ends with
checkSuidoAnswer(board, gameCode(game));          // { ok: true } when it is solved
```

A level is addressed by its size and its number (`"7x7"`, 12); a solve is kept by its board code, so it stays true if levels are ever added. A turn count to compare is `game.turns`, and `tapsToAnswer(newGame(board)!, levelSolution(row)!)` is the par.

### The level of the day

```ts
import { dailySuidoLevel, suidoDay } from "@johnmorrisdotca/suido/levels";

dailySuidoLevel("7x7", new Date());      // a level number, 1 to 256: today's at 7×7
dailySuidoLevel("7x7", "2026-10-01");    // the same level for that day, from its text
suidoDay(new Date());                    // "2026-10-01": the day, counted in UTC
```

The levels are fixed, so the level of the day needs no seed and no server: it is a pure function of the date and the size, the same for everybody on every machine, which is what lets two people compare a time on it. A day is counted in UTC, so it turns over at the same moment worldwide. Each size has a level of its own, and every level of a size comes up once before any comes up again (the size's count of levels, in days). It ignores which blocks a player has opened: today's level is open to everybody. The demo's **Today** button opens it.

## Board codes

A board is one short string, and so is its answer:

```text
7x7dw:0b3a…      7 by 7, kind drains (d), edges join (w), then one character for each cell, row by row
```

A cell's character says which sides its piece opens on, as the number 0–15 (north 1,
east 2, south 4, west 8): `0`–`9`, `a`–`f`. The same sixteen pieces are written `g`–`v`
where the cell has a **pump**, and `A`–`P` where it has a **drain**. A code written
from how the pieces face when the board is solved is the board's answer, and a
site checks a solve by being sent that code.

The flags are `d` (drains), `i` (inlet to outlet) and `w` (wrap), the kind's letter first. After the cells come four optional lists, in this order:

```text
7x7dw:0b3a…;l3,17,22;w4,9      locked pieces by cell number (;l), then walls by edge number (;w)
8x8:0b3a…;b9,40;k21            big pieces (;b) and blocks that turn as one (;k), each by the number of its top left cell
```

A big piece or a block is a square of four cells, named by its top left cell, and cannot cross the edge of the board, overlap another, or hold a pump, a drain or a locked piece; a big piece is joined inside (where two of its cells meet, either both open towards each other or neither does), only a network has them, and a wall cannot stand between two of a block's cells.

An edge is `cell * 2` for the wall on the east side of a cell and `cell * 2 + 1` for the one on its south side (on a board that wraps the east of the last column and the south of the last row are real edges).

## Drawing

```ts
import { cellStates, drawSuido, paintSuido, SUIDO_STYLE } from "@johnmorrisdotca/suido/draw";
```

`drawSuido` returns SVG text: ground, pipes, pumps and drains, and the water in them.
It is a separate entry, so a server that only checks an answer never loads it.
`SUIDO_STYLE` is the CSS that turns it into water. Put it in the page once; every
colour is a custom property on `.suido`, and the board is dark when the device is.
A wall is a bar across its edge, a locked piece a frame and a padlock, and a board that wraps a dashed rim. A big piece has a solid plate under its four cells and a block that turns as one a dashed rim round them, each with a ring and an arrow where its four cells meet; a tap on any of the four turns the whole. A piece in a block is named by the cell it was given in and carried round by the block, so `cellStates` reads its water where it is now.
`drawSuidoThumb(layout, { masks })` draws a board small, in a few dozen elements however big it is, for a page that
shows a whole block of levels at once; with the pieces of the answer as `masks` the water is in it.

The water **flows**. After a tap, call `paintSuido(svg, layout, masks, quarters)` with how the
pieces face now and how far each has been turned in all: it writes what changed onto the
drawing in place, and the style's transitions do the rest. The pipes turn, the water runs
out along the network from the pump one cell after another, and runs back out of a pipe
turned away from it. An open end shows a drip. With reduced motion asked for, it all
happens at once. Only what has changed since the last tap is written, which on a board of a thousand pieces is a few dozen.

Nothing on the board can be selected, dragged or double-tapped, and a piece is a rotation
about the middle of its cell. Everything is drawn in code: no images, no fonts, no
script in the drawing.

## Playing it in a page

```ts no-check
import { mountSuido } from "@johnmorrisdotca/suido/play";
import { levelAnswer, loadSuidoLevels } from "@johnmorrisdotca/suido/levels";

const rows = await loadSuidoLevels("7x7");
const board = mountSuido(document.getElementById("here")!, {
  code: rows[11]![0], answer: levelAnswer(rows[11]!)!,   // level 12: its board, and its one answer for the hint and the par
  hints: true, chips: true,
  onSolve: ({ code, turns }) => send(code, turns),     // `code` is what checkSuidoAnswer takes, with the board's own code
});
board?.restart(); board?.load({ code: other.code, answer: other.answer });
```

A tap turns a piece a quarter clockwise; shift with a tap, or a right click, turns it the other way (or the other way round, with `turning: "anticlockwise"`); the arrows move between pieces and enter or space turns one, with shift the other way. A locked piece, bare ground and a cross are not turned. The water is drawn dry and then painted on the next frame, so the first flow is seen, and it runs back out of a pipe turned away. The board is one box in the board's own shape, and the lines of words under it keep the room they need, so nothing moves as pieces are turned or messages come and go.

**A big board is zoomed and moved about.** Where the pieces would be smaller than 22 pixels across the box they are in (20×20 and bigger on a phone, 28×28 on a desk), a row of three buttons, **Zoom out**, **Zoom in** and **Whole board**, sits under the board, and the board itself answers a pinch of two fingers, a drag once it is zoomed in, and the wheel with control held (a trackpad's pinch is that) or, zoomed in, the wheel alone. A press that moved is not a tap: the click that ends a drag is swallowed, so the piece under a finger that panned the board is not turned. The view is the drawing's own `viewBox`, so the pipes stay crisp however far in it is, and the arrow keys bring the piece they move to into view. `zoom: "off"` leaves the board as it is. `view()` and `zoom("in" | "out" | "fit")` are on the handle, and `attachSuidoView(box, svg, layout)` (in `@johnmorrisdotca/suido/draw`) does the same for a board you draw yourself, with `clampView`, `zoomAbout`, `panView`, `viewShowing`, `viewBoxOf` and `needsZoom` as the arithmetic.

Under the board, unless `controls: false`: a line saying how far the water has got and how many ends leak, or that it is solved; a line of turns, par (if there is an `answer`) and hints; a line for what a hint says; and **Start over**, **Hint** (if `hints` is on and there is an `answer`, which lights a piece to turn) and the direction a tap turns. `chips` adds a row with each twist the board has, or Plain, each with the line that explains it as its hover text. Everything a button does is also a method on the handle (`restart`, `hint`, `turn`, `load`, `set`, `view`, `zoom`, `destroy`).

| Option | What it does |
| --- | --- |
| `code`, `answer` | the board, and its one answer; the answer is needed for Hint and the par, and is ignored if it is not an answer to the board |
| `progress` | a game half played, as `gameProgress` or an event's `progress` wrote it |
| `shown` | open on the answer, saying it was solved before, until the next turn |
| `turning` | `clockwise` (default) or `anticlockwise` |
| `hints` | offer Hint (default off) |
| `controls`, `chips` | the buttons and words under the board (default on), and the twists as chips (default off) |
| `zoom` | `auto` (default): a board too big for a thumb can be zoomed and moved about; `off`: never |
| `language` | `en` or `ja`; left out, the host's `lang` or the page's, and it follows the page's |
| `onChange`, `onTurn`, `onHint`, `onTurning`, `onSolve` | callbacks, and the same as DOM events on the host: `suido-change`, `suido-turn`, `suido-hint`, `suido-turning`, `suido-solve`. A `detail` has `code` (the game as a code), `progress` (to keep the game), `turns`, `hints`, `solved` and, for a turn or a hint, `cell` |

### The element

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/suido@1/dist/element-define.js"></script>
<suido-board size="7x7" level="12"></suido-board>
<suido-board code="5x5:…" answer="5x5:…" turning="anticlockwise" chips hints></suido-board>
```

Or `import "@johnmorrisdotca/suido/element/define"` in a bundle. Attributes, each read again when it changes: `size` with `level` (the package's own levels, fetched when asked) or `code` with `answer`; `progress`; `shown`; `turning`; `hints`; `controls="off"`; `chips`; `zoom="off"`; `lang`. A change of `turning`, `hints` or `lang` applies at once; a new board starts again. It fires the events above and has the methods `restart()` and `hint()`. Importing either entry on a server is safe.

## Difficulty

```ts no-check
difficultyOf(layout, solution);   // 1 (the plainest of its size) to 100
makeSuido({ size: 12, difficulty: 90 });
```

A board is measured five ways, each something a player meets (how little is plain at the first look, how many looks it takes, how much is still open when looking forces nothing more, how much the solver had to try and, in a drains board, how many spares), and each is ranked among a reference set of boards of the same size, kind and wrap, so a score is a board's place among its size's boards: about one in a hundred is each score, and 50 is a middling board. It does not compare across sizes. The measures, the weights and the reference sets are in [docs/DIFFICULTY.md](docs/DIFFICULTY.md).

`makeSuido` with a `difficulty` makes boards, each from its own seed, until one is within
`tolerance` (4) of it, or `attempts` (60) have been made, and gives the nearest; its `seed`
is the one that made the board, so `makeSuido({ ...options, seed: made.seed })` makes it again.

## API

The [API reference](https://johnmorrisdotca.github.io/suido/api.html) lists every export of every entry point with its signature and its doc comment. It is made from the source by `pnpm site`, so it cannot fall behind the code.

### The calls to learn first

| Call | What it does |
| --- | --- |
| `makeSuido(options)` | A new board with exactly one answer, and how hard it is |
| `newGame(code)`, `turnAt(game, cell, by)` | A game in play, and a tap, as pure functions that return new games |
| `flowOf(layout, masks)`, `isGameSolved(game)` | The water: which cells are wet, and whether the board is solved |
| `checkSuidoAnswer(board, answer)` | Whether an answer solves a board, in O(cells), for a server to trust |
| `loadSuidoLevels(size)`, `levelAnswer(row)`, `dailySuidoLevel(size, date)` | The fixed, numbered levels, one size at a time, and the level of the day |
| `hintFor(game, answer)`, `tapsToAnswer(game, answer)` | A piece to turn, and the par |
| `drawSuido(layout, options)`, `paintSuido(svg, layout, masks, quarters)` | The board as SVG text, and the water written onto it in place |
| `mountSuido(host, options)` and `<suido-board>` | A board played in an element, or in one tag |

### Entry points

| Import | What it holds |
| --- | --- |
| `@johnmorrisdotca/suido` | the rules, the solver, the generator, the difficulty and the game |
| `@johnmorrisdotca/suido/draw` | the drawing, its style and the painter |
| `@johnmorrisdotca/suido/play` | `mountSuido`: a board played in any element by tap, mouse and keyboard, with its buttons, words, chips and events |
| `@johnmorrisdotca/suido/element` | the `SuidoBoard` class behind `<suido-board>`, to extend or to define under another name |
| `@johnmorrisdotca/suido/element/define` | defines `<suido-board>` on the page, for its effect |
| `@johnmorrisdotca/suido/levels` | the levels loader, the counts, the blocks, the level of the day and what a level declares |
| `@johnmorrisdotca/suido/levels-info` | all of that but the loader: the counts, the blocks, which levels are open, a row read, the marks and lessons and the level of the day, with no board in it, for a server that must not carry every size's data |
| `@johnmorrisdotca/suido/levels-5x5`, `@johnmorrisdotca/suido/levels-6x6`, `@johnmorrisdotca/suido/levels-7x7`, `@johnmorrisdotca/suido/levels-8x8`, `@johnmorrisdotca/suido/levels-9x9`, `@johnmorrisdotca/suido/levels-10x10`, `@johnmorrisdotca/suido/levels-11x11`, `@johnmorrisdotca/suido/levels-12x12`, `@johnmorrisdotca/suido/levels-13x13`, `@johnmorrisdotca/suido/levels-14x14` | one square size's levels, as the data (`SUIDO_5X5` …), with nothing else loaded |
| `@johnmorrisdotca/suido/levels-5x7`, `@johnmorrisdotca/suido/levels-6x10`, `@johnmorrisdotca/suido/levels-8x14`, `@johnmorrisdotca/suido/levels-20x50` | one pipe shape's levels (`SUIDO_5X7` …) |
| `@johnmorrisdotca/suido/levels-20x20`, `@johnmorrisdotca/suido/levels-28x28` | one huge size's levels (`SUIDO_20X20`, `SUIDO_28X28`) |
| `@johnmorrisdotca/suido/marks` | every level's difficulty marks and lessons, as data |

### Every export

The table of every function, constant and type, with what each does, is in [docs/API.md](docs/API.md), and every export of every entry point, with its signature and doc comment, is in the [API reference](https://johnmorrisdotca.github.io/suido/api.html).

## Theming

Nothing here is branded. The drawing and the playable board are coloured by custom properties, and a page sets only the ones it wants different. The colours follow the device's light or dark setting; `data-theme="light"` or `"dark"` on `<html>` forces one.

**The drawing** (`drawSuido`, `drawSuidoThumb`), custom properties on `.suido`:

| Property | What it colours | Light | Dark |
| --- | --- | --- | --- |
| `--sd-line` | the board behind the cells, which shows as the lines between them | `#d9d1bf` | `#171a18` |
| `--sd-ground` | a cell's ground | `#fbf8f1` | `#262a27` |
| `--sd-edge` | the dark outline round a pipe | `#3b4148` | `#0c0f11` |
| `--sd-pipe` | a pipe with no water in it | `#aeb7c0` | `#838c95` |
| `--sd-water` | the water | `#1b8fe3` | `#4db6ff` |
| `--sd-source` | a pump | `#1b5fa6` | `#2f7fcf` |
| `--sd-bowl` | a drain's bowl | `#3b6a7e` | `#6aa4bd` |
| `--sd-leak` | an open end, and the dashed rim of a board that wraps | `#e04a2f` | `#ff6a4d` |
| `--sd-focus` | the ring on a piece the keyboard is on | `#b5452c` | `#ffb199` |
| `--sd-hint` | the ground of the piece a hint lit | `#f6dc8a` | `#5a4a1a` |
| `--sd-solved` | the ground of a solved board | `#e8f3ec` | `#20332a` |
| `--sd-wall` | a wall | `#7a4f2c` | `#c99a64` |
| `--sd-lock` | a padlock and the frame of a locked piece | `#8a6a2e` | `#d9b565` |
| `--sd-plate` | the plate under a big piece | `#ebe2cc` | `#323830` |
| `--sd-plate-edge` | the rim of a plate, solid or dashed | `#8d8467` | `#7d8a75` |
| `--sd-plate-solved` | the plate of a big piece on a solved board | `#dcebdc` | `#2b4034` |
| `--sd-pivot` | the ring and arrow where a block turns | `#b5452c` | `#ff8a6b` |
| `--sd-step` | how long the water takes through one cell: a time, not a colour, and set for you from the board's depth | `80ms` | the same |

**The playable board** (`mountSuido` and `<suido-board>`) wears the drawing's properties, and six of its own on `.suido-play`:

| Property | What it colours | Light | Dark |
| --- | --- | --- | --- |
| `--sdp-ink` | text and the pressed button | `#1f2320` | `#ece8dc` |
| `--sdp-muted` | the line of turns, par and hints | `#6b6f68` | `#a09d93` |
| `--sdp-rule` | borders | `#ddd6c6` | `#3a3d38` |
| `--sdp-surface` | the buttons and chips | `#fbf8f1` | `#1d201e` |
| `--sdp-accent` | what a hint says | `#b5452c` | `#ff8a6b` |
| `--sdp-good` | the status line once the board is solved | `#2f7a4f` | `#6fcf97` |

```css
suido-board, .suido, .suido-play { --sd-water: #0f7fd0; --sd-leak: #c2331a; --sdp-accent: #8a1c1c; }
```

The demo's own page is the worked example: its green felt and its cloth patches are the family's stylesheet, [`demo/family.css`](./demo/family.css), which is the same file byte for byte in every sibling's demo, and a test holds it to its hash. The drawing's parts carry classes and data attributes (`sd-cell`, `sd-pipe`, `sd-wall`, `sd-lock`, `sd-plate`, `sd-pivot`, `data-wet`, `data-role`, `data-locked`, `data-block`) for anything a property cannot reach.

## Limits

All of these are held by tests, and the ones with a name are exported.

| Limit | Value | Where |
| --- | --- | --- |
| Sizes of a level | the sixteen of `SUIDO_SIZES`: 5×5 to 14×14, 5×7, 6×10 and 8×14, and the huge 20×20, 28×28 and 20×50 | `SUIDO_SIZES`, `SUIDO_LEVEL_COUNTS` |
| Levels | each size's own, in blocks of sixteen: 256 a size, sixty-four for a huge one | `SUIDO_LEVEL_COUNTS`, `SUIDO_BLOCK` |
| A board's side | 2 to 64 cells, and not below 3 for a board that wraps or an inlet-outlet one | `MAX_SIDE` |
| Big pieces and blocks | a square of four cells, never across an edge, overlapping or holding a pump; only a network has them | `bigs` and `blocks` options |
| Zoom | up to six times the whole board, offered where a piece is under 22 pixels across | `SUIDO_MOST_ZOOM`, `needsZoom` |
| Pumps | at least one, and no more than one for every six cells; an inlet-outlet board has exactly one | the `sources` option |
| Difficulty | 1 to 100 among the boards of the size, kind and wrap | `difficultyOf` |
| Making to a difficulty | up to 60 boards, until one is within 4 of it | the `attempts` and `tolerance` options |
| A seed | any whole number; it is read as an unsigned 32-bit one | `seededRandom` |
| Answers counted | two, so that "many" costs no more than "two" | the `limit` argument of `solve` and `countSolutions` |
| The solver's work | 200,000 positions, then it says it cannot say | the `budget` argument of `solve` and `countSolutions` |
| A day | `YYYY-MM-DD`, counted in UTC | `isSuidoDay` |

A generator never runs on a server unless you ask it to. The check never searches: it is linear in the size of the board.

## Accessibility

A pipe puzzle is played by sight, by touch and by keyboard, and the mounted board and the tag carry all three.

- **The keyboard plays it.** Every piece is a focusable cell with a name: Tab lands on one piece, the arrow keys move between pieces, and Enter or Space turns one a quarter (with Shift, the other way). The ring on the piece the keyboard is on is `--sd-focus`. A locked piece is `aria-disabled`.
- **A screen reader hears every cell.** Each piece's label says its row and column and what it is and does (its pipe, whether it is wet, locked, a pump or a drain), in English or Japanese by the page's `lang`; the board is labelled with its size ("Suido board, 6 by 6"); and the status and the note under it are polite live regions that say what a tap did and when the board is solved.
- **Not by colour alone.** Water is blue and dry pipe grey, and so is distinguished by lightness as well; an open end shows a drip, a locked piece a padlock, a wall a bar, a drain a bowl and a pump a drop, so no state rests on hue.
- **Motion.** The water runs along the pipes at a pace set from the board's depth. Under a request for reduced motion the water is stilled (`--sd-step: 0ms`, with no transition), and the board is correct at once.
- **Large boards.** Where the pieces would be under 22 pixels across, a Zoom out, Zoom in and Whole board button bar appears, and the board answers a pinch, a drag and the wheel; a tap is still a tap.
- **Touch targets.** The board's own buttons are large; the pieces of a very large board are small, and that is what the zoom bar is for.
- **Colour and contrast.** Every colour is a CSS variable with a light and a dark default (see [Theming](#theming)), so a page can raise contrast. The defaults have not been measured against a contrast standard.
- **Known to fall short.** A screen reader hears the board as a grid of buttons, and not as a picture of the whole; the Japanese words have not been read by a native reader ([Languages](#languages)).

## Browser support

Any browser with ES2020 modules, custom elements, SVG and CSS `aspect-ratio`: Chrome and Edge 88, Safari 15, Firefox 89, all from 2021 on. The element draws in the page's own DOM, with no shadow DOM and no CSS the page cannot reach. The demo is played in a real Chromium at a phone's width (with touch) and a desk's, and in WebKit, Safari's engine, at a phone's width; Firefox is not in that run. The package itself (everything but the drawing and the page) needs no DOM: it runs in Node 22 or later (CI tests 22 and 24). Deno and Bun are not tested. With reduced motion asked for, the water and the turns happen at once.

## Languages

English and Japanese, chosen by the `language` option, the host's `lang` or the page's, and followed when the page's `lang` changes. The demo has a chooser of its own and takes the browser's language on a first visit. The board's words (`SUIDO_STRINGS`, read with `suidoSay`) are in both. **Japanese: included; not yet reviewed by a native reader. Corrections welcome.** Every string is listed beside its English in [docs/strings-ja.md](./docs/strings-ja.md), and there is an [issue template](https://github.com/johnmorrisdotca/suido/issues/new?template=fix-a-translation.md) for fixing one. Any other language is a table of your own, passed beside these two.

## Roadmap

Not here yet, and each welcome as an [issue](https://github.com/johnmorrisdotca/suido/issues):

- A command line: make a board, check an answer, solve a code, and print a board as text.

Left out on purpose: levels made from a seed when the page opens, because a fixed level is what lets times be compared (the generator is there for a board of your own); and any account, ranking or storage. A page keeps its own games: the events hand them over.

## Making boards

A new board is a random spanning forest of pipes grown from the pumps, scrambled, and
kept only if the solver proves it has one answer; where it finds a second, the cells the
two answers disagree on are where a pipe is moved (or a spare taken off) until it does.
Seeded, so the same options and seed make the same board in every browser and every Node, and
the boards of 1.0.0 are still the boards of every later version (`seeded.test.ts` holds them).
Where `walls` or `locked` are asked for, they are what is built first: a wall across an edge that only the
second answer uses, or a lock on a piece the two answers face differently, makes the board have one answer
before any pipe is moved. An inlet-outlet board is a random spanning tree's path from the top left to the
bottom right with decoys everywhere else, mended the same way.

The time to make one board is under a millisecond to a few milliseconds up to 12×12 and about a tenth of a second at 16×16 with a difficulty asked for, and the huge sizes take from 4 milliseconds (a 20×20 network) to two seconds (a 28×28 drains board), on a laptop; the tables, and how big pieces and blocks are placed, are in [docs/GENERATOR.md](docs/GENERATOR.md).

## Architecture

The rules, the solver and the generator are plain functions over short codes, with no
DOM. The drawing is a separate entry.

The file-by-file tree, with a line on each source file, is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md): the rules and the solver (`layout`, `solve`, `flow`, `game`), the generator and the difficulty (`generate`, `difficulty`, `deduce`), the levels (`levels*`, `marks`, `daily`), the drawing (`draw`), and the page (`mount`, `element`, `view`). Tests sit beside the code they test (`*.test.ts`), and the solver is held to
`brute.fixture.ts`, which tries every way of facing every piece, on small boards, with locked pieces,
walls and an inlet and outlet among them. `levels.<size>.test.ts` proves every level of a size again
(`levelSuite.fixture.ts`). `scripts/` builds the demo, makes the difficulty reference sets and the levels,
and checks the package as npm packs it; `demo/` is the playable page and `e2e/` plays it in real browsers.

## The name

*Suido* (水道) is Japanese for "waterworks", the pipes and channels that carry water: 水 (*sui*)
is water and 道 (*dō*) a way or a road, so it is, literally, a water way. It is said in three
beats, *su-i-do*. In the puzzle water is led along a way of pipes from a pump to where it is
wanted.

## Where it comes from, and where it is used

Suido was built for [Itsutsu](https://itsutsu.com), a site for board games, puzzles, card games and dice games played at your own pace. *Itsutsu* (五つ) is Japanese for "five", after five in a row, the game the site began with. The pipe puzzle was made there, board by board, each proved to have one answer and each checked on a server in O(cells); once it stood alone it seemed worth sharing.

### Used by

- [Itsutsu](https://itsutsu.com), for its Suido puzzle, every level and the check.

Using Suido in something? Open an *Add my project* issue and we will add you.

### The family

<!-- family:start (made by scripts/family-readme.mjs from scripts/family-template.mjs; change those, not this) -->
Suido is one of twenty-four packages, each made for the same site, each at
[github.com/johnmorrisdotca](https://github.com/johnmorrisdotca). The code of every one is MIT.

- [Korokoro](https://github.com/johnmorrisdotca/korokoro) (コロコロ): dice, with notation, exact odds, real sounds and the dice of many games. [Demo](https://johnmorrisdotca.github.io/korokoro/).
- [Kyuubu](https://github.com/johnmorrisdotca/kyuubu) (キューブ): a turning cube for the browser, 2×2 to 7×7, with record solves to replay. [Demo](https://johnmorrisdotca.github.io/kyuubu/).
- [Hitotsu](https://github.com/johnmorrisdotca/hitotsu) (一つ): a colour-card shedding game for two to eight, with the house rules people play. [Demo](https://johnmorrisdotca.github.io/hitotsu/).
- [Toranpu](https://github.com/johnmorrisdotca/toranpu) (トランプ): a deck of playing cards, card games with computer players, and solitaires. [Demo](https://johnmorrisdotca.github.io/toranpu/).
- [Tane](https://github.com/johnmorrisdotca/tane) (種): seeded random numbers and daily seeds, the same in every browser and on every server. [Demo](https://johnmorrisdotca.github.io/tane/).
- [Narabe](https://github.com/johnmorrisdotca/narabe) (並べ): one rules engine for abstract board games, from gomoku and Reversi to Go and checkers. [Demo](https://johnmorrisdotca.github.io/narabe/).
- [Tenka](https://github.com/johnmorrisdotca/tenka) (天下): world conquest for two to six, on a map of the real world. [Demo](https://johnmorrisdotca.github.io/tenka/).
- [Kumimoji](https://github.com/johnmorrisdotca/kumimoji) (組み文字): a crossword tile race, in English and Japanese kana. [Demo](https://johnmorrisdotca.github.io/kumimoji/).
- [Tsunagi](https://github.com/johnmorrisdotca/tsunagi) (繋ぎ): a line-joining logic puzzle whose every level has exactly one answer. [Demo](https://johnmorrisdotca.github.io/tsunagi/).
- [Jarajara](https://github.com/johnmorrisdotca/jarajara) (ジャラジャラ): mahjong tiles drawn as SVG, stacked layouts, and the matching solitaire Awase. [Demo](https://johnmorrisdotca.github.io/jarajara/).
- [Suido](https://github.com/johnmorrisdotca/suido) (水道): a pipe puzzle: turn the pieces until the water reaches every drain. [Demo](https://johnmorrisdotca.github.io/suido/).
- [Domino](https://github.com/johnmorrisdotca/domino) (ドミノ): dominoes and Mexican Train. [Demo](https://johnmorrisdotca.github.io/domino/).
- [Kotoba](https://github.com/johnmorrisdotca/kotoba) (言葉): word lists and word-game rules in English, French, German and Japanese. [Demo](https://johnmorrisdotca.github.io/kotoba/).
- [Sugoroku](https://github.com/johnmorrisdotca/sugoroku) (双六): backgammon and its variants, with the doubling cube and match play. [Demo](https://johnmorrisdotca.github.io/sugoroku/).
- [Kazu](https://github.com/johnmorrisdotca/kazu) (数): grid number puzzles: Sudoku and its variants, Futoshiki and Skyscrapers. [Demo](https://johnmorrisdotca.github.io/kazu/).
- [Meikyuu](https://github.com/johnmorrisdotca/meikyuu) (迷宮): mazes on squares, hexagons, triangles and circles, made from a seed and drawn through with a finger or the mouse. [Demo](https://johnmorrisdotca.github.io/meikyuu/).
- [Hikidashi](https://github.com/johnmorrisdotca/hikidashi) (引き出し): a drawer of small Japanese text tools: era dates, kanji numerals, readings and sentence difficulty. [Demo](https://johnmorrisdotca.github.io/hikidashi/).
- [Chizu](https://github.com/johnmorrisdotca/chizu) (地図): maps of the world and of countries' regions, in English and Japanese, with a quiz and callouts. [Demo](https://johnmorrisdotca.github.io/chizu/).
- [Bushu](https://github.com/johnmorrisdotca/bushu) (部首): find a kanji by the parts it is made of. [Demo](https://johnmorrisdotca.github.io/bushu/).
- [Tobiishi](https://github.com/johnmorrisdotca/tobiishi) (飛び石): peg solitaire with nine boards and seeded solvable challenges. [Demo](https://johnmorrisdotca.github.io/tobiishi/).
- [Jirai](https://github.com/johnmorrisdotca/jirai) (地雷): minesweeper on shaped grids with verified no-guess boards. [Demo](https://johnmorrisdotca.github.io/jirai/).
- [Gunjin](https://github.com/johnmorrisdotca/gunjin) (軍人): five hidden-rank strategy games with pass-the-device play. [Demo](https://johnmorrisdotca.github.io/gunjin/).
- [Karakuri](https://github.com/johnmorrisdotca/karakuri) (からくり): eight hyper-casual puzzle games, some of them physics: draw a shield, pull pins, cut ropes, slide blocks, pour tubes. [Demo](https://johnmorrisdotca.github.io/karakuri/).
- [Houseki](https://github.com/johnmorrisdotca/houseki) (宝石): gem and stone matching puzzles: falling triplets, stone collapse, colour chains and gem swap. [Demo](https://johnmorrisdotca.github.io/houseki/).

**This package is Suido.** The demos of all twenty-four share one header and footer, so each links the rest.
<!-- family:end -->

## Development

```sh
pnpm install --frozen-lockfile
pnpm check          # lint, types and every test
pnpm test:package   # pack, install and import it as somebody who installed it would
pnpm site           # build the demo into site/, as the Pages workflow publishes it
node scripts/suido-levels.ts 7x7   # make a size's levels again (about 18 minutes for every size); --marks writes the marks
pnpm test:demo      # play the demo in Chromium and WebKit
pnpm test:frameworks  # the README's React, Vue, Svelte, Angular and plain-page examples, built from the tarball and played (needs the network)
pnpm docs:make      # rewrite docs/strings-ja.md after changing a word of the board
pnpm test:readme    # every TypeScript and JavaScript example in this README, type-checked and run
pnpm screenshots:readme   # retake the README's pictures into docs/images (builds the demo first)
```

The pictures are taken on the maintainer's Mac and are retaken only when the look changes; they are in `docs/images` and are not in the package that npm installs.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md). The commands are under [Development](#development).

Please follow the [code of conduct](./CODE_OF_CONDUCT.md). A way to make the check or the solver run for long, or markup that gets out of the drawing, is for the [security policy](./SECURITY.md), not a public issue.

## Changes

See [CHANGELOG.md](./CHANGELOG.md).

The latest release is 1.4.2: the README takes the family's full layout, with pictures of the twists and examples that are run.

## Licence

MIT, © John Morris. The pieces are drawn in code and there is no sound. The levels are made by the package's own generator, and no data of anyone else's ships.
