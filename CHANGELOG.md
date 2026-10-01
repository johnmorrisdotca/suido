# Changelog

All notable changes to this project are written here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/). Every level keeps its number, its
board and its answer, and a seed makes the board it always made.

## [Unreleased]

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

[Unreleased]: https://github.com/johnmorrisdotca/suido/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/johnmorrisdotca/suido/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/johnmorrisdotca/suido/compare/03866cf...v1.1.0
[1.0.0]: https://github.com/johnmorrisdotca/suido/commit/03866cf
