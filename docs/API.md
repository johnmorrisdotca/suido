# Every export of Suido

The table of every export, from [the README's API section](../README.md#api), moved here to keep the README under the length npm shows. Every export of every entry point is also in the [API reference](https://johnmorrisdotca.github.io/suido/api.html), made from the source.

| Export | What it does |
| --- | --- |
| `makeSuido(options)` | a new board with exactly one answer, and how hard it is; `{ code, answer, layout, solution, seed, difficulty, tried, discarded }`. Options include `kind`, `wrap`, `sources`, `locked`, `walls`, `bigs`, `blocks`, `width`, `height`, `difficulty` |
| `makeUnscored(options)`, `laySuido(options)` | the same without measuring it, and a board laid out with no promise about its answers |
| `decodeLayout(code)`, `encodeLayout(layout)`, `withMasks(layout, masks)`, `isLocked(layout, cell)` | a board's code and the `Layout` it stands for: size, kind, wrap, cells, sources, drains, and its locked pieces, walls, big pieces and blocks if it has any |
| `blockInfo(layout)`, `blockAt(layout, cell)`, `blockCells(anchor, width)`, `hasBlocks(layout)`, `sameBlock(layout, a, b)` | the squares of four cells that turn as one: which they are, which one a cell is in, and its four cells clockwise from the top left |
| `turnBlock(masks, block, by)`, `blockQuartersBetween(from, to, block)`, `blockFacings(masks, block)`, `canTurnBlock(masks, block)`, `placeAfter(block, cell, quarters)`, `isJoinedInside(masks, block)` | a block turned, how far apart two facings of it are, the ways it can face, whether a turn changes anything, where a piece is once its block is turned, and whether a big piece is joined inside |
| `BIG_KINDS`, `bigMasksOf(kind, quarters)`, `bigKindOf(masks)`, `placeBlocks(near, width, height, bigs, turning, random)` | the five kinds of big piece, one turned, which kind four masks make, and where a generator puts blocks on a board |
| `checkSuidoAnswer(board, answer)` | whether an answer solves a board, in O(cells); `{ ok: true }` or the first reason it does not |
| `flowOf(layout, masks)`, `isSolved(layout, masks)` | the water: which cells are wet, in what order, how deep, where it spills, whether it is solved |
| `solve(layout, limit, budget)`, `countSolutions(layout, limit, budget)` | counts answers up to `limit`, within a `budget` of positions, and returns them |
| `newGame(code)`, `turnAt(game, cell, by)`, `canTurn(mask)`, `canTurnAt(game, cell)` | a game in play, and a tap, as pure functions that return new games; a locked piece, bare ground and a cross are not turned |
| `flowOfGame(game)`, `isGameSolved(game)`, `gameCode(game)` | the water of a game, whether it is solved, and the game as a code to keep or send |
| `hintFor(game, answer)`, `turnedToFaceAt(game, cell, answer)`, `tapsToAnswer(game, answer)`, `turnsFromAnswer(given, solution)` | a piece to turn, that piece (or block) turned to face the answer, and how many taps are left or were needed |
| `measureSuido(layout, solution)`, `difficultyOf(layout, solution)`, `exactDifficultyOf(layout, solution)` | how hard a board is, as a whole score and as the score before it is rounded |
| `scoreOf`, `exactScoreOf`, `blendOf`, `percentileIn`, `quantilesOf`, `referenceFor`, `referenceKey` | the parts of that, and the reference set a board is ranked among |
| `twistsOf(layout)`, `isTwisted(layout)` | the twists a board has, in the order the levels teach them |
| `symmetryKey(layout, solution)`, `transformLayout(layout, op)` | a board's identity up to turning and mirroring it, and one of its eight turns and mirrors |
| `loadSuidoLevels(size)`, `loadEverySuidoLevel()`, `suidoLevelsOf(size)`, `suidoLevelOf(size, board)` | a size's levels, loaded when asked for (`@johnmorrisdotca/suido/levels`) |
| `levelBoard(row)`, `levelSolution(row)`, `levelAnswer(row)`, `declaredTwists(row)`, `turnsOf(layout, solution)` | a level's row read: its board, its answer as pieces and as a code, its twists, and an answer as the digits a row keeps |
| `openSuidoLevels(size, solved)`, `nextSuidoLevel`, `firstUnsolvedSuidoLevel`, `isSuidoLevel`, `suidoBand`, `sizeOf` | which levels are open, which comes next, and what a size is |
| `blockOf(level)`, `blockRange(block, count)`, `blocksIn(count)` | a block of sixteen levels |
| `suidoMarks(size, level)`, `suidoRole(size, level)`, `twistRole(rows, level)` | a level's difficulty marks (1 to 5) and its part in its block's lesson |
| `deduce(layout, solution)` | what can be worked out without guessing, in rounds |
| `turn`, `rotationsOf`, `shapeOf`, `armsOf`, `opposite`, `quartersBetween`, `tapsBetween` | the pieces: sixteen masks, a quarter turn moves every opening one place clockwise |
| `cellChar`, `neighboursOf` | a cell's character in a code, and which cell is next to each on each side |
| `seededRandom(seed)`, `shuffled(list, random)` | the mulberry32 stream every board is made from |
| `drawSuido(layout, options)`, `drawPiece(mask, options)`, `drawSuidoThumb(layout, options)` | the board, a piece and a small board as SVG text (`@johnmorrisdotca/suido/draw`) |
| `cellStates(layout, masks, quarters)`, `stepFor(depth)` | what every cell should look like, and the pace the water flows at |
| `paintSuido(svg, layout, masks, quarters)` | writes the water and the turns onto a drawing in place |
| `mountSuido(host, options)`, `ensureSuidoPlayStyle(host)` | a board played in an element, and the style it wears (`@johnmorrisdotca/suido/play`) |
| `suidoSay(language, key, values)`, `suidoLanguageOf(tag)` | a line of the board's words in English or Japanese, and the language a `lang` is |
| `gameProgress(game)`, `gameFromProgress(code, progress)`, `gameFromCode(code, kept)` | a game half played as a short string to keep, and the game it comes back as; and the game a board's code and the code it was left as make |
| `attachSuidoView(box, svg, layout, options)`, `boxOf`, `clampView`, `zoomAbout`, `panView`, `viewShowing`, `viewBoxOf`, `needsZoom` | a big board zoomed and moved about by a pinch, a drag and the wheel (`@johnmorrisdotca/suido/draw`), and the arithmetic of a view |
| `dailySuidoLevel(size, date)`, `suidoDay(date)`, `isSuidoDay(text)` | the level of the day at a size, from the date alone; a date as `YYYY-MM-DD` in UTC; whether a text is a real one |

Constants: `SUIDO_STYLE`, `SUIDO_PLAY_STYLE`, `SUIDO_STRINGS`, `SUIDO_DAILY_STRIDE`, `DIFFICULTY_WEIGHTS`, `MEASURE_NAMES`, `DIFFICULTY_SIDES`, `SHAPE_MASKS`, `MAX_SIDE`, `SUIDO_TWISTS`, `SUIDO_LEVEL_TWISTS`, `SUIDO_SIZES`, `SUIDO_LEVEL_COUNTS`, `SUIDO_BLOCK`, and
the sides `NORTH`, `EAST`, `SOUTH`, `WEST`, `SIDES`, `SIDE_STEPS`. Every function is pure: it
returns new values and never changes what it was given. Everything is typed, and
there are no dependencies.
