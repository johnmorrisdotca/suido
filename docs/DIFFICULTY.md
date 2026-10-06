# How difficulty is measured

How Suido measures a board: the five things a player meets, the reference sets, and how the blend becomes a score from 1 to 100. Moved here from [the README](../README.md) to keep it under the length npm shows.

A board is measured five ways, each something a player meets: **obscure** (how little is
plain at the first look), **rounds** (how many looks it takes: each fixes what is now
forced, and the next has more to go on), **unsettled** (the share still open when looking
forces nothing more), **guessing** (how much the solver had to try) and, in a drains board,
**spares**. Each is a percentile among a reference set of boards of the same size, kind and
wrap, the percentiles are blended by `DIFFICULTY_WEIGHTS`, and the blend is itself ranked
among the set's blends, so a score is a board's place among its size's boards: about one in
a hundred is each score, and 50 is a middling board. It does not compare across sizes. The
reference sets (600 boards for each of 12 sizes, 3 kinds and wrap or not; 400 for each of the huge sides 20, 28 and 32, the last for 20×50) are made by
`scripts/suido-reference.ts` from the package's own generator, and a board of a side or a kind there is no set for is ranked among the nearest side that has one. Walls and locked pieces are not part
of a set: they make a board easier than the boards of its set, and its score says so, as do big pieces and blocks that turn as one.
`exactDifficultyOf` is the score before it is rounded, which is what the levels are put in order by.
