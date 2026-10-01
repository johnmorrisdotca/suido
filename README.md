<h1 align="center">Suido <sub>水道</sub></h1>

<p align="center"><strong>A pipe puzzle for JavaScript and TypeScript.</strong><br>
Turn the pieces until the water from the pump reaches every drain and nothing is left open. Boards as short codes, a solver that counts answers, a seeded generator whose every board has exactly one, a difficulty from 1 to 100 within each size, boards that wrap, several pumps, spare pieces, and the water drawn as SVG that flows along the pipes as they join. No dependencies.</p>

<p align="center">
  <a href="https://github.com/johnmorrisdotca/suido/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/johnmorrisdotca/suido/actions/workflows/ci.yml/badge.svg"></a>
  <a href="https://www.npmjs.com/package/@johnmorrisdotca/suido"><img alt="npm" src="https://img.shields.io/npm/v/@johnmorrisdotca/suido?color=2f5d4a"></a>
  <a href="./LICENSE"><img alt="MIT licence" src="https://img.shields.io/badge/licence-MIT-2f5d4a"></a>
  <img alt="No dependencies" src="https://img.shields.io/badge/dependencies-0-2f5d4a">
</p>

<p align="center"><a href="https://johnmorrisdotca.github.io/suido/"><strong>Play a board →</strong></a></p>

<p align="center">
  <img src="docs/desktop.jpg" alt="A 9×9 board solved: the water from the pump runs through every pipe to every drain, each drain filled" width="620">
  <img src="docs/phone.jpg" alt="A 7×7 board half solved on a phone in dark mode, with Japanese words: two pumps, the water part-way along the pipes, and a few open ends still leaking" width="200">
</p>

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

const made = makeSuido({ size: 8, difficulty: 70, seed: 7 });   // a board with exactly one answer, about as hard as 70 of 100
made.code;                       // "8x8:…": the board as it is first shown, every piece turned at random
made.difficulty;                 // 1 to 100 among 8×8 boards

let game = newGame(made.code)!;  // a game: how every piece faces now, and how far each has been turned
game = turnAt(game, 12);         // a tap on a cell: a quarter turn clockwise (turnAt(game, 12, -1) the other way)
flowOf(game.start, game.masks);  // where the water has got to, in what order, and where it runs out

checkSuidoAnswer(made.code, made.answer);   // { ok: true }, in O(cells), for a server to trust
const svg = drawSuido(game.start, { masks: game.masks });   // the board as SVG text
```

## Who it is for

- **Puzzle sites and apps** that want the puzzle with the rules already right:
  boards that can be made on the fly from a seed and are each guaranteed one
  answer, a check a server can trust, and a drawing whose water flows.
- **Anyone making pipe puzzles of their own**, who wants a solver that counts
  answers, a generator that makes boards with exactly one, and a measure of how
  hard each is.

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

Options, any of which may be combined:

- **Wrap**: the edges join, so a pipe leaving one side comes in at the other.
- **Several pumps**: each feeds its own pipes, which may meet.
- **Any shape**: boards from 2×2 to 40×40, and not only square.
- **A difficulty**, 1 to 100 among the boards of the size.

The demo offers 5×5 to 14×14, and a timer.

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

## Drawing

```ts
import { cellStates, drawSuido, paintSuido, SUIDO_STYLE } from "@johnmorrisdotca/suido/draw";
```

`drawSuido` returns SVG text: ground, pipes, pumps and drains, and the water in them.
It is a separate entry, so a server that only checks an answer never loads it.
`SUIDO_STYLE` is the CSS that turns it into water. Put it in the page once; every
colour is a custom property on `.suido`, and the board is dark when the device is.

The water **flows**. After a tap, call `paintSuido(svg, layout, masks, quarters)` with how the
pieces face now and how far each has been turned in all: it writes what changed onto the
drawing in place, and the style's transitions do the rest. The pipes turn, the water runs
out along the network from the pump one cell after another, and runs back out of a pipe
turned away from it. An open end shows a drip. With reduced motion asked for, it all
happens at once.

Nothing on the board can be selected, dragged or double-tapped, and a piece is a rotation
about the middle of its cell. Everything is drawn in code: no images, no fonts, no
script in the drawing.

## Difficulty

```ts
difficultyOf(layout, solution);   // 1 (the plainest of its size) to 100
makeSuido({ size: 12, difficulty: 90 });
```

A board is measured five ways, each something a player meets: **obscure** (how little is
plain at the first look), **rounds** (how many looks it takes: each fixes what is now
forced, and the next has more to go on), **unsettled** (the share still open when looking
forces nothing more), **guessing** (how much the solver had to try) and, in a drains board,
**spares**. Each is a percentile among a reference set of boards of the same size, kind and
wrap, the percentiles are blended by `DIFFICULTY_WEIGHTS`, and the blend is itself ranked
among the set's blends, so a score is a board's place among its size's boards: about one in
a hundred is each score, and 50 is a middling board. It does not compare across sizes. The
reference sets (600 boards for each of 12 sizes, 2 kinds and wrap or not) are made by
`scripts/suido-reference.ts` from the package's own generator.

`makeSuido` with a `difficulty` makes boards, each from its own seed, until one is within
`tolerance` (4) of it, or `attempts` (60) have been made, and gives the nearest; its `seed`
is the one that made the board, so `makeSuido({ ...options, seed: made.seed })` makes it again.

## API

| Export | What it does |
| --- | --- |
| `makeSuido(options)` | a new board with exactly one answer, and how hard it is; `{ code, answer, layout, solution, seed, difficulty, tried, discarded }` |
| `makeUnscored(options)`, `laySuido(options)` | the same without measuring it, and a board laid out with no promise about its answers |
| `decodeLayout(code)`, `encodeLayout(layout)`, `withMasks(layout, masks)` | a board's code and the `Layout` it stands for: size, kind, wrap, cells, sources, drains |
| `checkSuidoAnswer(board, answer)` | whether an answer solves a board, in O(cells); `{ ok: true }` or the first reason it does not |
| `flowOf(layout, masks)`, `isSolved(layout, masks)` | the water: which cells are wet, in what order, how deep, where it spills, whether it is solved |
| `solve(layout, limit, budget)`, `countSolutions(layout, limit, budget)` | counts answers up to `limit`, within a `budget` of positions, and returns them |
| `newGame(code)`, `turnAt(game, cell, by)`, `canTurn(mask)` | a game in play, and a tap, as pure functions that return new games |
| `flowOfGame(game)`, `isGameSolved(game)`, `gameCode(game)` | the water of a game, whether it is solved, and the game as a code to keep or send |
| `hintFor(game, answer)`, `tapsToAnswer(game, answer)`, `turnsFromAnswer(given, solution)` | a piece to turn, and how many taps are left or were needed |
| `measureSuido(layout, solution)`, `difficultyOf(layout, solution)` | how hard a board is |
| `scoreOf`, `blendOf`, `percentileIn`, `quantilesOf`, `referenceFor`, `referenceKey` | the parts of that, and the reference set a board is ranked among |
| `deduce(layout, solution)` | what can be worked out without guessing, in rounds |
| `turn`, `rotationsOf`, `shapeOf`, `armsOf`, `opposite`, `quartersBetween`, `tapsBetween` | the pieces: sixteen masks, a quarter turn moves every opening one place clockwise |
| `cellChar`, `neighboursOf` | a cell's character in a code, and which cell is next to each on each side |
| `seededRandom(seed)`, `shuffled(list, random)` | the mulberry32 stream every board is made from |
| `drawSuido(layout, options)`, `drawPiece(mask, options)` | the board and a piece as SVG text (`@johnmorrisdotca/suido/draw`) |
| `cellStates(layout, masks, quarters)`, `stepFor(depth)` | what every cell should look like, and the pace the water flows at |
| `paintSuido(svg, layout, masks, quarters)` | writes the water and the turns onto a drawing in place |

Constants: `SUIDO_STYLE`, `DIFFICULTY_WEIGHTS`, `MEASURE_NAMES`, `DIFFICULTY_SIDES`, `SHAPE_MASKS`, `MAX_SIDE`, and
the sides `NORTH`, `EAST`, `SOUTH`, `WEST`, `SIDES`, `SIDE_STEPS`. Every function is pure: it
returns new values and never changes what it was given. Everything is typed, and
there are no dependencies.

| Import | What it holds |
| --- | --- |
| `@johnmorrisdotca/suido` | the rules, the solver, the generator, the difficulty and the game |
| `@johnmorrisdotca/suido/draw` | the drawing, its style and the painter |

## Making boards

A new board is a random spanning forest of pipes grown from the pumps, scrambled, and
kept only if the solver proves it has one answer; where it finds a second, the cells the
two answers disagree on are where a pipe is moved (or a spare taken off) until it does.
Seeded, so the same options and seed make the same board in every browser and every Node.

Time to make one board on a laptop (the average of 40 boards, and the slowest one in twenty), with
the default options; the last column asks for a difficulty, which makes about a dozen boards to find
one near it:

| Size | Network | Network, wrap | Drains | Drains, wrap | Network at a difficulty |
| --- | --- | --- | --- | --- | --- |
| 5×5 | 0.2 ms (95%: 0.3) | 1.0 ms (95%: 2.8) | 0.1 ms (95%: 0.4) | 0.3 ms (95%: 0.9) | 1.4 ms (95%: 4.0) |
| 6×6 | 0.1 ms (95%: 0.2) | 5.7 ms (95%: 17) | 0.1 ms (95%: 0.2) | 0.5 ms (95%: 1.9) | 0.8 ms (95%: 1.9) |
| 7×7 | 0.1 ms (95%: 0.2) | 7.2 ms (95%: 22) | 0.3 ms (95%: 0.7) | 1.0 ms (95%: 3.2) | 2.0 ms (95%: 4.2) |
| 8×8 | 0.1 ms (95%: 0.3) | 11 ms (95%: 49) | 0.5 ms (95%: 1.2) | 1.7 ms (95%: 9.8) | 3.2 ms (95%: 8.9) |
| 10×10 | 0.2 ms (95%: 0.4) | 13 ms (95%: 83) | 1.2 ms (95%: 3.6) | 9.5 ms (95%: 18) | 4.6 ms (95%: 13) |
| 12×12 | 0.6 ms (95%: 1.6) | 22 ms (95%: 91) | 1.6 ms (95%: 5.1) | 11 ms (95%: 47) | 22 ms (95%: 75) |
| 14×14 | 8.5 ms (95%: 83) | 35 ms (95%: 110) | 4.7 ms (95%: 24) | 19 ms (95%: 73) | 82 ms (95%: 355) |
| 16×16 | 5.2 ms (95%: 21) | 36 ms (95%: 136) | 16 ms (95%: 122) | 95 ms (95%: 415) | 133 ms (95%: 401) |

Generation is synchronous, so a page makes a big board in a moment's pause (the demo
shows "Making a board…" and lets the page paint first).

## Architecture

The rules, the solver and the generator are plain functions over short codes, with no
DOM. The drawing is a separate entry.

```text
src/
├── index.ts               the main entry: everything but the drawing
├── pieces.ts              the sixteen pieces, their shapes, and a quarter turn
├── code.ts                boards and answers as short codes, and which cell is beside which
├── flow.ts                where the water goes, and whether a board is solved
├── check.ts               whether an answer solves a board, in O(cells)
├── facing.ts              the sets of facings the solver works with
├── solve.ts               the solver, which counts a board's answers up to a limit
├── deduce.ts              what can be worked out without guessing, in rounds
├── generate.ts            new boards from a seed: pipes grown, scrambled, made to have one answer
├── difficulty.ts          how hard a board is, measured and ranked among its size
├── difficulty.reference.ts  the boards a difficulty is ranked among, as quantiles
├── game.ts                a game in play: a tap, a hint, the code to keep
├── random.ts              the seeded random numbers every board is made from
├── version.ts             the package's version
├── draw-entry.ts          the "/draw" entry: everything that draws
├── draw.ts                a board and a piece as SVG text, and what each cell looks like
├── paint.ts               the water and the turns written onto a drawing in place
└── style.ts               the style that turns the drawing into flowing water
```

Tests sit beside the code they test (`*.test.ts`), and the solver is held to
`brute.fixture.ts`, which tries every way of facing every piece, on small boards.
`scripts/` builds the demo, makes the difficulty reference sets and checks the package as
npm packs it; `demo/` is the playable page and `e2e/` plays it in real browsers.

## The name

*Suido* (水道) is Japanese for "waterworks", the pipes and channels that carry water: 水 (*sui*)
is water and 道 (*dō*) a way or a road, so it is, literally, a water way. It is said in three
beats, *su-i-do*. In the puzzle water is led along a way of pipes from a pump to where it is
wanted.

## Development

```sh
pnpm install
pnpm check          # lint, types and every test
pnpm test:package   # pack, install and import it as somebody who installed it would
pnpm site           # build the demo into site/, as the Pages workflow publishes it
pnpm test:demo      # play the demo in Chromium and WebKit
```

## Licence

MIT, © John Morris. The pieces are drawn in code and there is no sound.
