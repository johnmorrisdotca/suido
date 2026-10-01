# Changelog

## 1.1.0 — 2026-10-01

Fixed, numbered levels, as its sibling Tsunagi has them, and the twists that
commercial pipe games offer.

- 3,328 levels, 256 in each of 13 sizes: 5×5 to 14×14, and three long pipe
  shapes, 5×7, 6×10 and 8×14. Every level has exactly one answer, proved again
  on every build; every level is no easier than the one before by the measured
  difficulty; and a block of sixteen opens once the block before is solved. Each
  size is its own import (`@johnmorrisdotca/suido/levels-8x8`, or all of them
  through `@johnmorrisdotca/suido/levels`) and a level is a short row: its board
  as a code, its answer as a digit for each cell, and its twists.
- Twists, each a field a level declares and an option of `makeSuido`: locked
  pieces (`locked`), walls (`walls`), and boards where the water runs in one path
  from an inlet at the top left to an outlet at the bottom right
  (`inlet-outlet`), beside the drains, pumps and wrap that were already there.
  `twistsOf(layout)` reads them from a board. The first block of a size is plain;
  from the second, the 15th level of each block teaches a twist and the 16th
  tests it; later blocks combine them. What was read, taken and left is in
  `docs/TWISTS.md`.
- Board codes carry locked pieces (`;l…`), walls (`;w…`) and the flag `i`. A
  code of 1.0.0 is read as it was, and every board a 1.0.0 seed made is made
  again unchanged (held by a test).
- `checkSuidoAnswer` also asks that a locked piece is as the board gave it and
  that an inlet-outlet answer runs in one path. `turnAt` leaves a locked piece
  (`canTurnAt`).
- The drawing: walls as bars, locked pieces with a frame and a padlock, and
  `drawSuidoThumb`, a board drawn small in a few dozen elements for a page that
  shows a block of levels at once.
- `exactDifficultyOf`, the score before it is rounded (the levels are put in
  order by it); difficulty reference sets for the inlet-outlet kind.
- `symmetryKey` and `transformLayout`, a board's identity under turning and
  mirroring it.
- The demo is reworked to Tsunagi's shape: a size row, a row of pipe shapes, a
  level picker with arrows, the twists as chips and the difficulty as marks, the
  sixteen levels of a block drawn small, solves and half-played levels kept on
  the device, and a solved level opening on its answer. "Make a board" keeps
  the seeded boards, now with the inlet-outlet kind, locked pieces and walls.
  Every new word is in English and Japanese.

## 1.0.0 — 2026-10-01

The first release: Suido, a pipe puzzle, with its rules, solver, generator and
drawing, and a demo to play.

- Boards as short codes (size, flags and a character a cell), answers in the
  same code, and a check a server can trust in O(cells).
- The water: where it reaches from the pumps, in what order, and where it runs
  out of an open end.
- Two kinds: a network, where every piece must carry water, and drains, where
  every drain must be reached and spare pieces may stay dry. Boards that wrap,
  with up to several pumps, from 2×2 to 40×40 and not only square.
- A solver that counts answers (arc consistency and search for a network,
  growing a network for drains), held to trying every way on small boards.
- A seeded generator whose every board has exactly one answer, proved by the
  solver; a difficulty from 1 to 100 within each size, measured and ranked
  against a reference set made by the generator, and boards made to a
  difficulty asked for.
- The drawing as SVG text, the style that makes the water flow along the pipes
  as they join and run back out of one turned away, and a painter that updates
  a board in place.
- A demo in English and Japanese, with the family's cloth patches, a hint, a
  timer, and keyboard play.
