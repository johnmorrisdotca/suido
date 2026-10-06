# The pieces

Every piece Suido has, each drawn by the package's own `drawSuido`, with what it does. Moved here from [the README](../README.md), which has a summary and the pictures. `SUIDO_PIECE_GUIDE` (from `@johnmorrisdotca/suido`) lists them with a tiny board for each, and `drawGuidePiece(piece)` (from `@johnmorrisdotca/suido/draw`) draws one, so a page of your own can show what the demo's guide does.

<p align="center"><picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/pieces-strip-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/pieces-strip-desk-light.webp" alt="Every small piece drawn: ground, an end, a straight, an elbow, a tee, a cross, a pump, a drain, a locked piece, a wall, edges that join and a block that turns as one." width="720">
</picture></p>

## The pieces a tap turns

A piece is the set of sides it opens on, written as four bits: north 1, east 2, south 4, west 8, so there are sixteen. Five shapes turn, and a tap turns one a quarter clockwise (or the other way, if the board is asked to). A piece's shape never changes, only the way it faces.

| Piece | Openings | Ways it faces | In a board's code, facing north |
| --- | --- | --- | --- |
| Ground | none | one (it is never turned) | `0` |
| End | one | four | `1` |
| Straight | two, opposite | two: along or across | `5` |
| Elbow | two, on sides that meet | four | `3` |
| Tee | three | four | `7` |
| Cross | four | one, it looks the same turned | `f` |

Where two pieces are side by side, the water passes from one to the other only if both open towards each other. An opening that meets the edge of the board, ground, or a piece that does not open back is a *leak*, and a board is solved only when the water reaches what its kind asks and nothing leaks. `SHAPE_MASKS`, `shapeOf`, `rotationsOf` and `turn` are the calls.

## Where the water starts and ends

- **Pump**: where the water comes from, a drop in a dark blue disc. It sits on any piece but ground (the code writes the sixteen pieces as `g` to `v` where the cell has a pump) and turns like it. A board has one pump or several, and each fills its own pipes.
- **Drain**: where the water must end up, a round bowl that fills when the water reaches it (`A` to `P` in a code). On a drains board only the drains must be reached, and pieces the water does not need may stay dry and face any way.

## What a board adds

- **Locked piece**: it cannot be turned, and a small padlock marks it. It stays as the board gives it (`;l` in a code).
- **Wall**: a thick bar across the edge between two cells, which the water cannot cross (`;w`).
- **Edges that join**: a board with a dashed red rim, where a pipe that leaves one side comes in at the opposite one (the `w` flag).
- **Inlet to outlet**: one pump and one drain, each an end piece, with the water in one path between them and no branch; the other pieces are decoys that stay dry (the `i` flag).

## Blocks that turn as one

Four ordinary pieces in a fixed square that a tap turns together, a quarter clockwise: each piece moves round to the next place of the square and turns with it, and none can be turned alone. A ring where the four meet says so (`;k` in a code, `Layout.blocks`). They are not joined inside, which is what tells one from a big piece.

## Big pieces

A big piece is a square of four cells that is one piece (`;b`, `Layout.bigs`). A tap on any part of it turns the whole square a quarter, where it stands. Inside it the four cells are joined across wherever both open towards each other and are not joined where neither does (`isJoinedInside`), so what four one-cell pieces can make side by side, a plate can: a cell with a cross in it, a corner next to a straight, two pipes that never meet, a tee beside an end. A **pipe** is a run of joined cells, and the water in one pipe does not reach another, however close: two pipes side by side are two.

The rules for a shape: every cell opens on at least one side, no four cells are all joined round the middle (the water would go round in a ring), and every pipe has an opening to the outside. That makes **699 shapes** up to turning (`BIG_SHAPES`), holding one, two or three pipes, with one to eight openings in all and at most two on each side. A **family** is the shapes whose pipes have the same numbers of openings, largest first: `2+2` is two pipes of two openings each, `3+1+1` three pipes of three, one and one. There are 32 (`BIG_FAMILIES`). `bigShapeOf(masks)` names the shape four masks make and how far it is turned, and `bigShapesIn(layout, masks)` lists the big pieces of a board.

<p align="center"><picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/big-pieces-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/big-pieces-desk-light.webp" alt="Thirteen big pieces: a snake, a hairpin, two pipes side by side, one corner inside another, a pipe through with a branch, and others with a cross, three pipes or a stub." width="720">
</picture></p>

| Id | What it is | Family | Openings | Faces |
| --- | --- | --- | --- | --- |
| `3c92` | one pipe, one opening | 1 | 1 | 4 |
| `5593` | a hairpin | 2 | 2 | 4 |
| `5555` | two pipes side by side | 2+2 | 4 | 2 |
| `53a3` | one corner inside another | 2+2 | 4 | 4 |
| `5775` | one pipe through, one branching | 4+2 | 6 | 4 |
| `39aa` | a hairpin and a straight pipe | 2+2 | 4 | 4 |
| `2baa` | a branching pipe and a straight one | 2+2 | 4 | 4 |
| `2b8e` | two pipes with a stub inside | 2+2 | 4 | 2 |
| `118a` | three pipes, one opening each | 1+1+1 | 3 | 4 |
| `2b6c` | three pipes, two openings each | 2+2+2 | 6 | 4 |
| `17fe` | a crossing inside, and a stub | 6+1 | 7 | 4 |
| `bffe` | a grid of crossings | 8 | 8 | 4 |
| `bbee` | two pipes of two tees | 4+4 | 8 | 2 |

The first five are the kinds the generator drew before 1.5.0 (`BIG_KINDS`: `end`, `hairpin`, `straight`, `elbow`, `tee`), and a seed that asked for big pieces still makes the board it made. `makeSuido({ bigs: 6, bigKinds: "all" })` draws from every family equally, and a family at random before a shape of it, so few-opening and many-opening plates come as often as each other; `"simple"` (one or two pipes, at most four openings), `"more"` (one or two pipes) and `"all"` are each a wider choice (`BIG_MIXES`, `inBigMix`).

### Every family

<p align="center"><picture>
<source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/big-families-desk-dark.webp">
<img src="https://raw.githubusercontent.com/johnmorrisdotca/suido/main/docs/images/big-families-desk-light.webp" alt="One big piece of each of the 32 families, each captioned with its family and how many shapes it has." width="720">
</picture></p>

| Family | Pipes | Openings | Shapes |
| --- | --- | --- | --- |
| `1` | 1 | 1 | 8 |
| `2` | 1 | 2 | 28 |
| `3` | 1 | 3 | 56 |
| `4` | 1 | 4 | 70 |
| `5` | 1 | 5 | 56 |
| `6` | 1 | 6 | 28 |
| `7` | 1 | 7 | 8 |
| `8` | 1 | 8 | 1 |
| `1+1` | 2 | 2 | 22 |
| `2+1` | 2 | 3 | 60 |
| `3+1` | 2 | 4 | 56 |
| `2+2` | 2 | 4 | 36 |
| `4+1` | 2 | 5 | 34 |
| `3+2` | 2 | 5 | 44 |
| `5+1` | 2 | 6 | 12 |
| `4+2` | 2 | 6 | 21 |
| `3+3` | 2 | 6 | 10 |
| `6+1` | 2 | 7 | 2 |
| `5+2` | 2 | 7 | 6 |
| `4+3` | 2 | 7 | 4 |
| `6+2` | 2 | 8 | 1 |
| `4+4` | 2 | 8 | 1 |
| `1+1+1` | 3 | 3 | 16 |
| `2+1+1` | 3 | 4 | 40 |
| `3+1+1` | 3 | 5 | 16 |
| `2+2+1` | 3 | 5 | 28 |
| `4+1+1` | 3 | 6 | 4 |
| `3+2+1` | 3 | 6 | 16 |
| `2+2+2` | 3 | 6 | 6 |
| `4+2+1` | 3 | 7 | 4 |
| `3+2+2` | 3 | 7 | 4 |
| `4+2+2` | 3 | 8 | 1 |

## Where the pictures come from

`pnpm screenshots:readme` takes them from the guide on [the demo](https://johnmorrisdotca.github.io/suido/), in light and dark, so they are the package's own drawing and come again the same.
