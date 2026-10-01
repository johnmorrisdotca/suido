# Twists: what other pipe games add, and what Suido took

Suido's twists were chosen after reading how the games of this kind are built. This page says what was
read, which twists were taken, which were left, and why. It was last checked on 2026-10-01.

## What was read

- **Simon Tatham's Net** (MIT licence), in his [Portable Puzzle Collection](https://www.chiark.greenend.org.uk/~sgtatham/puzzles/doc/net.html).
  A grid of tiles is shuffled by turning each one. Its settings are the size, **wrapping** (flow passes
  between opposite edges), a **barrier probability** (immovable walls between tiles, which act as hints) and
  whether the puzzle must have **one solution** (leaving it off makes harder, more ambiguous puzzles).
  A tile can be **locked** so it is not turned by accident. The network must have no closed loops. Only ideas
  were taken from it: no code.
- **NetWalk**, the name the same puzzle goes by on many sites and in apps ([Wikipedia, "Pipes (puzzle)"](https://en.wikipedia.org/wiki/Pipes_(puzzle)),
  [the rules as one site gives them](https://www.logicgamesonline.com/netwalk/tutorial.html)). A server, computers to reach, no loose ends, scored
  by how many turns it takes. One site's modes ([playnetwalk.com](https://playnetwalk.com/blog/netwalk-variants/)): *bounded* (walls at the edges),
  *torus* (the edges join), and *classic*, which lets loops stand and gives some tiles **locked in their solved
  facing** as clues.
- **Infinity Loop and the games like it** ([the app](https://apps.apple.com/us/app/infinity-loop-relaxing-puzzle/id977028266)):
  tiles carrying a line, a curve or a branch, turned on a tap until no end is left loose; hundreds of levels that
  begin with a few pieces and grow, with branching pieces appearing more as the levels go on; a light mode and
  a dark mode (in the dark mode no tile may connect to its neighbour).
- **Pipe Mania, called Pipe Dream in some places** ([Wikipedia](https://en.wikipedia.org/wiki/Pipe_Mania)): a different
  game that shares the water. Pieces are *placed* and not turned; the water starts from a source after a
  **countdown**; **crossover** pieces carry two flows over each other in one square; a 1990 arcade version gave
  the player a source and a drain to join.
- **Hexagonal versions** ([Hexagonal pipes puzzles](https://hexapipes.vercel.app/), which offer hexagon, square,
  octagon and other grids): the same turning game on tiles with six sides.

## What Suido took

Each twist is a field a level row declares (its `twists` text, kebab case), is something the board's own code
carries, is usable from `makeSuido`, is drawn, is tested, and is shown as a chip on the level. `twistsOf(layout)`
reads them from a board and the tests hold every level's declared list to it.

| Twist | What it asks | Where it came from | `makeSuido` |
| --- | --- | --- | --- |
| `drains` | Reach every drain. Pieces the water does not need stay dry and may face any way. | Suido 1.0.0; the computers of NetWalk | `kind: "drains"` |
| `pumps` | Several pumps, each feeding its own pipes. | Suido 1.0.0; Net's one centre, NetWalk's one server, taken further | `sources: 2` |
| `locked` | Some pieces cannot be turned: they are given facing the way the answer has them. A padlock marks each. | Net's lock; NetWalk classic's locked clues. Here the lock is the board's own rule, so it is also a clue the generator may use to make a board have one answer. | `locked: 4` |
| `walls` | Water cannot cross some edges; a pipe open towards a wall runs out. | Net's barriers; NetWalk's bounded edges, moved inside the board. | `walls: 6` |
| `wrap` | The edges join, left to right and top to bottom. | Net's wrapping; NetWalk's torus. | `wrap: true` |
| `inlet-outlet` | Water enters at the top left and must leave at the bottom right in one path with no branches; the other pieces are decoys and stay dry. | The source-to-drain game of the placing family, played by turning. | `kind: "inlet-outlet"` |

Walls and locks are what make a board have one answer in the generator before any pipe is moved: where the
solver finds a second answer, a wall is built across an edge only the other answer uses, or a piece the two
answers face differently is locked. A wall is never built on an edge the pipes of the answer, or of the
forest they grew from, use, so it can never close the answer.

The levels teach them in this order, one block of sixteen levels at a time (the 15th level of a block teaches,
the 16th tests): drains, pumps, locked pieces, walls, wrap, inlet-outlet. From the eighth block each block
combines them (wrap with locks, then walls with locks, pumps with drains, and so on up to a block with wrap,
drains and walls together), and from then on the earlier places of a block carry twists too.

## What was left, and why

- **Hexagon boards.** A different geometry: six sides, a piece is a set of six bits, a quarter turn becomes a
  sixth, the neighbour table, the solver's facings, the deduction, the drawing and the thumbnails all change.
  It would be a second game inside the package, not a twist of this one. Left for a release of its own.
- **Crossings** (two flows over each other in one cell). In a turning game a crossing is a piece that joins
  its two straight lines but not the other pair. A cell can then be wet twice by two separate streams, so the
  flow's one `depth` and one `entry` for a cell, the solver's idea that a piece opens or does not open on a
  side, the drawing's water in each arm, and the deduction all need a second layer of water. Worth doing, but
  as a release of its own, with a drawing of water passing over water.
- **A turn limit.** A limit is a rule about play, not a property of a board, and a page that enforces one
  needs somewhere to show it, to end the level and to say what happens next. What a limit needs is a par, and
  that is offered: `tapsToAnswer(game, answer)` is the fewest turns, and the demo shows it as `par` beside the
  turns taken. A site may turn that into a limit or a star rating as it likes.
- **Water that starts flowing after a countdown** (from the placing game). It is a timer on the player, and the
  package has none to give a board: the demo's own timer is the nearest thing. A site that wants it can run a
  clock and call `flowOf` when it ends.
- **No closed loops** (Net's rule, and NetWalk's bounded and torus modes). Suido's network lets loops stand, as
  NetWalk's classic mode does. Adding the rule would change which boards have one answer, and so every board
  `makeSuido` makes from a seed today, which sites keep by seed.
- **A dark mode where tiles must not connect** (Infinity Loop). It is the same puzzle inverted; nothing in
  Suido's water would mean it.
