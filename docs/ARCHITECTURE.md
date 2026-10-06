# Architecture: the source tree

The file-by-file tree of Suido's source, from [the README's Architecture section](../README.md#architecture). A test holds this tree to the files under `src/`, so it cannot fall behind the code.

The rules, the solver and the generator are plain functions over short codes, with no
DOM. The drawing is a separate entry.

```text
src/
├── index.ts               the main entry: everything but the drawing and the levels
├── pieces.ts              the sixteen pieces, their shapes, and a quarter turn
├── code.ts                boards and answers as short codes, and which cell is beside which
├── flow.ts                where the water goes, and whether a board is solved
├── check.ts               whether an answer solves a board, in O(cells)
├── facing.ts              the sets of facings the solver works with
├── units.ts               what a network is solved in: a piece, or a block that turns as one, and the facings each can have
├── blocks.ts              squares of four cells that turn as one: big pieces and blocks, turned and read
├── bigPieces.ts           the five kinds of big piece, and where a generator puts blocks
├── solve.ts               the solver, which counts a board's answers up to a limit
├── deduce.ts              what can be worked out without guessing, in rounds
├── generate.ts            new boards from a seed: pipes grown, scrambled, made to have one answer
├── difficulty.ts          how hard a board is, measured and ranked among its size
├── difficulty.reference.ts  the boards a difficulty is ranked among, as quantiles
├── twists.ts              the twists a board can have, read from the board
├── symmetry.ts            a board turned and mirrored, and its identity under them
├── game.ts                a game in play: a tap, a hint, the code to keep
├── random.ts              the seeded random numbers every board is made from
├── version.ts             the package's version
├── levels.ts              the "/levels" entry: each size loaded when asked for, and everything in levelsInfo.ts
├── levelsInfo.ts          the "/levels-info" entry: the counts, blocks, rows, marks and daily level, with no board in it
├── levelCounts.ts         the sizes, how many levels each has, and which are open
├── levelBlocks.ts         a block of sixteen levels
├── levelRow.ts            a level's row read: its board, its answer, its twists
├── daily.ts               the level of the day at a size, from the date alone
├── ladder.ts              what a level teaches, and how hard it is marked
├── levels/
│   ├── size5x5.data.ts    a size's levels, one file each (5x5 to 14x14, 5x7, 6x10, 8x14, 20x20, 28x28, 20x50)
│   ├── size6x6.data.ts
│   ├── size7x7.data.ts
│   ├── size8x8.data.ts
│   ├── size9x9.data.ts
│   ├── size10x10.data.ts
│   ├── size11x11.data.ts
│   ├── size12x12.data.ts
│   ├── size13x13.data.ts
│   ├── size14x14.data.ts
│   ├── size5x7.data.ts
│   ├── size6x10.data.ts
│   ├── size8x14.data.ts
│   ├── size20x20.data.ts  the huge sizes, sixty-four levels each
│   ├── size28x28.data.ts
│   ├── size20x50.data.ts
│   └── marks.data.ts      every level's marks and lessons
├── draw-entry.ts          the "/draw" entry: everything that draws
├── draw.ts                a board, a piece and a small board as SVG text, and what each cell looks like
├── paint.ts               the water and the turns written onto a drawing in place
├── view.ts                a big board zoomed and moved about: the arithmetic of a view, and a pinch, a drag and the wheel
├── style.ts               the style that turns the drawing into flowing water
├── strings.ts             the board's words, in English and Japanese
├── playStyle.ts           the style of a playable board: its box, chips, words and buttons
├── mount.ts               mountSuido: draws a board into an element and plays it
├── play-entry.ts          the "/play" entry: a board played in any element
├── element.ts             the "/element" entry: the <suido-board> class
└── element-define.ts      the "/element/define" entry: defines the tag on the page
```

Tests sit beside the code they test (`*.test.ts`), and the solver is held to
`brute.fixture.ts`, which tries every way of facing every piece, on small boards, with locked pieces,
walls and an inlet and outlet among them. `levels.<size>.test.ts` proves every level of a size again
(`levelSuite.fixture.ts`). `scripts/` builds the demo, makes the difficulty reference sets and the levels,
and checks the package as npm packs it; `demo/` is the playable page and `e2e/` plays it in real browsers.
