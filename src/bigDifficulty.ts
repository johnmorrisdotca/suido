import type { Layout } from "./code.ts";
import { exactDifficultyOf } from "./difficulty.ts";
import { flowOf } from "./flow.ts";

/**
 * HOW HARD A LEVEL OF THE BIG-PIECES SET IS, 1 TO 100 ACROSS THE WHOLE SET. The set's boards come in many sizes, and
 * `difficultyOf` ranks a board among boards of its own size, so a 5×5 and a 20×20 can both be "80" and not be alike.
 * A set that runs from the easiest level to the hardest needs a score that means the same at every size, so this one
 * blends two things:
 *
 *  - HOW MUCH OF THE BOARD THE ANSWER REALLY USES: the pieces the water goes through (`coverageOf` is that as a share of the
 *    board, and 1 on a network, where the water reaches every piece), counted against the sizes the set has, 25 to 400, on a
 *    log scale, so each doubling is the same step. Size alone would say a 20×20 with a drain or two is a hard board; the water
 *    would use a fraction of it. A board is as big as what it asks a player to work out.
 *  - HOW TANGLED IT IS FOR ITS SIZE: the five measures of `difficulty.ts` (obscure, rounds, unsettled, guessing, spares), as the
 *    place the board takes among boards of its size.
 *
 * Half and half, so the smallest board that is no puzzle at all scores 1 and the largest board that is every bit as tangled as
 * the worst of its size scores 100. `exactBigScoreOf` is the score before it is rounded, which is what the levels are put in
 * order by.
 */

/** The fewest pieces the water goes through that count for anything: a board of 5×5. */
export const BIG_PIECES_SMALLEST = 25;

/** The most, which scores full marks for size: a board of 20×20. */
export const BIG_PIECES_LARGEST = 400;

/** The weight of the size in the score, and of the tangle; they add to 1. */
export const BIG_SCORE_WEIGHTS = { size: 0.5, tangle: 0.5 } as const;

/** The share of a board's pieces the water goes through in an answer, 0 to 1: 1 for a network, which the water reaches every piece of. A board with nothing on it is 0. */
export function coverageOf(layout: Layout, solution: readonly number[]): number {
  const pieces = layout.cells.filter((mask) => mask !== 0).length;
  return pieces === 0 ? 0 : flowOf(layout, solution).wetPieces / pieces;
}

/** How many pieces the water goes through in an answer. */
export function usedPiecesOf(layout: Layout, solution: readonly number[]): number {
  return flowOf(layout, solution).wetPieces;
}

/** How big a board is for scoring, 0 to 1: the pieces its answer uses, on a log scale from `BIG_PIECES_SMALLEST` to `BIG_PIECES_LARGEST`. */
export function sizeTermOf(used: number): number {
  const term = Math.log(Math.max(1, used) / BIG_PIECES_SMALLEST) / Math.log(BIG_PIECES_LARGEST / BIG_PIECES_SMALLEST);
  return Math.min(1, Math.max(0, term));
}

/** The score of a board of `used` pieces whose tangle (`exactDifficultyOf`, 1 to 100 among boards of its size) is `tangle`, before it is rounded. */
export function blendBigScore(used: number, tangle: number): number {
  return 1 + 99 * (BIG_SCORE_WEIGHTS.size * sizeTermOf(used) + BIG_SCORE_WEIGHTS.tangle * ((tangle - 1) / 99));
}

/** How hard a board is across the set, 1 to 100, before it is rounded: what the levels are put in order by. */
export function exactBigScoreOf(layout: Layout, solution: readonly number[]): number {
  return blendBigScore(usedPiecesOf(layout, solution), exactDifficultyOf(layout, solution));
}

/** How hard a board is across the set, 1 to 100: a whole number. */
export function bigScoreOf(layout: Layout, solution: readonly number[]): number {
  return Math.min(100, Math.max(1, Math.round(exactBigScoreOf(layout, solution))));
}
