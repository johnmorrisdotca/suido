# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/). Every level keeps its number, its
board and its answer, and a seed makes the board it always made.

## [Unreleased]

## [1.4.1] - 2026-10-05

Nothing that was exported has changed.

### Added

- A test holds every `@johnmorrisdotca/suido@N` version pin in the README to this package's major version.

### Changed

- The family's list, in the README and in the demo's footer, names all twenty-four packages, Karakuri and Houseki included.
- The npm description is one sentence of 250 characters or fewer, so npm and its search show it whole; it is also the repository's About text. `homepage` is the demo site and `author` is `"John Morris"`, the same in every package.
- The GitHub Actions workflows use the current versions of the actions (checkout 7, setup-node 7, pnpm/action-setup 6; configure-pages 6, upload-pages-artifact 5 and deploy-pages 5 for Pages), which clears GitHub's Node 20 deprecation warning.

## [1.4.0] - 2026-10-05

Every export, every level, every board code and every answer of 1.3.0 is as it was, and a seed makes the board it always made. New: huge boards, big pieces,
and squares of four pieces that turn together.

### Added

- **Huge boards.** 20×20, 28×28 and the long 20×50, each with sixty-four fixed levels (four blocks of sixteen), each with exactly one answer, easy to hard by
  the measured difficulty: 3,520 levels in all. They teach drains, pumps and wrap, one to a block. Each size is its own import
  (`@johnmorrisdotca/suido/levels-20x20`, `-28x28`, `-20x50`), loaded when asked for. A board may now be up to 64 cells a side (`MAX_SIDE`, was 40), and the
  difficulty has reference sets for the sides 20, 28 and 32 (400 boards each, every kind and wrap; 20×50 is ranked among 32), so a huge level is placed among
  the boards of its own size. A board of a kind or a side there is no set for is ranked among the nearest side that has one, where it used to fail.
- **Big pieces** (`bigs` option, the `;b` list of a code, the `big-pieces` twist). A big piece fills four squares and has up to eight openings, two on each side; one tap
  turns the whole piece a quarter, where it stands. Five kinds (`BIG_KINDS`): an end, a hairpin, two pipes side by side, two pipes bending one inside the other, and a
  straight pipe with a branch. Solid plate and a ring at its middle in the drawing.
- **Blocks that turn as one** (`blocks` option, the `;k` list, the `block-turns` twist). Four ordinary pieces that a tap on any of them turns together a quarter: each
  moves round to the next place and turns with it, and none can be turned alone. A dashed rim and a ring where the four meet.
- Both work in any network (wrap, several pumps, walls, locked pieces elsewhere on the board, a difficulty to aim for), with exactly one answer, proved by the solver, which
  now solves a network in units (a piece, or a square that turns as one; `units.ts`) and is held to trying every way on small boards with squares. `checkSuidoAnswer` reads
  a square as the board's square turned a whole number of quarters, in O(cells). `turnAt`, `tapsToAnswer`, `hintFor`, `gameProgress`, `symmetryKey` and the drawing know them, and
  a hint on a square lights all four pieces. New: `blockInfo`, `blockAt`, `turnBlock`, `placeAfter` and the rest of `blocks.ts`; `bigMasksOf`, `bigKindOf`, `placeBlocks`;
  `gameFromCode(code, kept)`, a game from the code it was left as; `turnedToFaceAt(game, cell, answer)`, what a Hint does, the whole block for a block; `SUIDO_LEVEL_TWISTS`.
- **`@johnmorrisdotca/suido/levels-info`**: everything about the levels but the loader (counts, blocks, which levels are open, a row read, marks and lessons, the level of the
  day), so a server that only needs to know how many levels a size has does not carry every size's boards. `/levels` is this and the loader, as it was.
- **Zoom and pan for a board too big for a thumb** (`view.ts`, `zoom` option and attribute): where the pieces would be under 22 pixels across, three buttons under the board
  (Zoom out, Zoom in, Whole board), a pinch of two fingers, a drag once zoomed in, and the wheel with control held. A press that moved is not a tap, so panning never turns a
  piece. The view is the drawing's `viewBox`, so the pipes stay crisp; the arrow keys bring the piece they reach into view. `attachSuidoView` does the same for a board you draw
  yourself. `zoom: "off"` leaves a board as it is. In English and Japanese.
- The demo has the huge sizes, Big pieces and Block turns settings in Make a board, and zoom.

### Changed

- **Drains boards are made faster, most of all the big ones.** The solver asks a piece how it may face without making a list, and settles what is forced from the pieces
  beside the one just faced instead of looking at every piece again; the same answers, search and counts on every board (compared on 160 boards, both kinds), so no board and
  no level has moved. A board of more than 400 cells that the solver cannot prove in 4,000 positions is thrown away rather than searched for 20,000. A 28×28 drains board takes
  about half a second, where it took two to four. (Boards of 400 cells or fewer are made exactly as before.)
- **A tap on a big board is faster.** `paintSuido` writes only what has changed since the last tap, kept in a `WeakMap`, where it rewrote every piece. On 28×28 on a phone-speed CPU
  (Chromium, slowed four times) a tap reaches the screen in about 56 ms, where it took about 90; on 20×50 about 70 ms (about 125 before), of which the script is 10 to 14. What was left was almost all painting: every dry piece's arms and drips were painted though nothing could be seen of them, and now they are hidden a moment after the water leaves them.
- `twistsOf` and `SUIDO_TWISTS` list eight twists, the six of the levels in the order they teach them, then `big-pieces` and `block-turns`; `SUIDO_LEVEL_TWISTS` is the six.
- The solver and the difficulty measure solve and deduce a network in units, which for a board with no square is exactly what they did (the same answers, the same search, the same
  rounds, compared on six hundred boards), so no level's difficulty or order has moved.

## [1.3.0] - 2026-10-01

### Changed

- **Needs Node 22 or later; Node 20 is no longer supported.** Nothing else changed.

## [1.2.0] - 2026-10-01

Nothing that was exported has changed: every export, every level, every board
code and every answer is as it was. New: the board can be played in any page, as
a function or a tag; a level of the day; an API reference; and a README that
covers the package whole.

### Added

- **`@johnmorrisdotca/suido/play`**: `mountSuido(host, options)` draws a board
  into any element and plays it, as the demo did with code of its own. A tap
  turns a piece a quarter; shift with a tap, or a right click, turns it the
  other way; the arrows move between pieces and enter or space turns one. The
  water flows along the pipes as they join and runs back out of one turned away.
  Under the board: how far the water has got and how many ends leak, the turns,
  par and hints, what a hint says, **Start over**, **Hint**, the direction a tap
  turns, and the board's twists as chips. Every one is optional. Events
  (`suido-change`, `suido-turn`, `suido-hint`, `suido-turning`, `suido-solve`)
  carry the game as a code ready for `checkSuidoAnswer`, and as a short string to
  keep a game half played. English and Japanese, following the page's `lang`.
- **`<suido-board>`** (`/element`, `/element/define`): the same in a tag, with
  attributes for a level (`size` and `level`) or a board of your own (`code` and
  `answer`), `progress`, `shown`, `turning`, `hints`, `controls`, `chips` and `lang`.
- **`SUIDO_STRINGS`, `suidoSay`**: the board's words, in English and Japanese,
  listed in `docs/strings-ja.md` (made by `pnpm docs:make`, held to the source
  by a test). The twists have names and explanations in both.
- **`gameProgress(game)` and `gameFromProgress(code, progress)`**: a game half
  played as a short string, and the game it comes back as.
- **A level of the day.** `dailySuidoLevel(size, date)` names one level of a size
  for a date, the same for everybody on every machine, with no server and no
  seed. A day is counted in UTC and each size has a level of its own. Every level
  of a size comes up once before any comes up again (256 days). Also
  `suidoDay(date)`, `isSuidoDay(text)` and `SUIDO_DAILY_STRIDE`, from
  `@johnmorrisdotca/suido/levels`. The demo has a **Today** button.
- **An API reference page**, `api.html` on the demo site: every export of every
  entry point with its signature and its doc comment, made from the source when
  the site is built, so it cannot fall behind the code. The README and the demo's
  header link to it, and a test holds it to the source.
- **The README is the family's outline**: Features, Use it in your project (the
  API alone, one tag, React, Vue, Svelte and Angular), Playing it in a page,
  Theming (every custom property with its light and dark value), Limits, Browser
  support, Languages, Roadmap, Where it comes from, the family of sixteen
  packages, Contributing and Changes, held to the code by tests.
- **`pnpm test:frameworks`** builds the README's React, Vue, Svelte, Angular and
  plain-page examples from the packed tarball and solves a level in each, in
  Chromium and WebKit.
- An *Add my project* issue template, a pull request template, and a copy of the
  family's `SECURITY.md` and `CODE_OF_CONDUCT.md` kept in `scripts/community`
  and held equal by a test.

### Changed

- **The demo plays with the package's own `mountSuido`** instead of code of its
  own, and shows the board sooner: on a phone it sits about 600 pixels higher on
  the page than before (about 545 against 1,135), because the size and pipe-shape rows
  are now under the board, the lines of words are in the board's box and the
  header's reserved room fits the shortened pitch. The page keeps one steady box.
  Half-played levels kept by 1.1.0 are read as they were.
- The changelog is in the Keep a Changelog format, and `package.json`'s
  `homepage` is the demo.
- The README and `CONTRIBUTING.md` say Node 22 or later, which is what CI tests.
- The README's two pictures are taken again from the current demo.

## [1.1.0] - 2026-10-01

Fixed, numbered levels, as its sibling Tsunagi has them, and the twists that
commercial pipe games offer.

### Added

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

## [1.0.0] - 2026-10-01

The first release: Suido, a pipe puzzle, with its rules, solver, generator and
drawing, and a demo to play.

### Added

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

[Unreleased]: https://github.com/johnmorrisdotca/suido/compare/v1.4.1...HEAD
[1.4.1]: https://github.com/johnmorrisdotca/suido/compare/v1.4.0...v1.4.1
[1.3.0]: https://github.com/johnmorrisdotca/suido/compare/v1.2.0...v1.3.0
[1.2.0]: https://github.com/johnmorrisdotca/suido/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/johnmorrisdotca/suido/compare/03866cf...v1.1.0
[1.0.0]: https://github.com/johnmorrisdotca/suido/commit/03866cf
