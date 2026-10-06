import { SUIDO_BLOCK } from "./levelBlocks.ts";
import { firstUnsolvedLevel, nextLevel, openLevels, SUIDO_BIG_COUNT, sizeOf, type LevelRow } from "./levelCounts.ts";
import { twistRole, type TwistRole } from "./ladder.ts";
import { SUIDO_BIG_PIECES, SUIDO_BIG_SCORES, SUIDO_BIG_SIZES, SUIDO_BIG_TWISTS } from "./levels/bigInfo.data.ts";
import type { SuidoBand } from "./levelCounts.ts";
import { SUIDO_TWISTS, type Twist } from "./twists.ts";

export { SUIDO_BIG_PIECES, SUIDO_BIG_SCORES, SUIDO_BIG_SIZES, SUIDO_BIG_TWISTS };

/**
 * THE BIG-PIECES LEVELS, COUNTED AND DESCRIBED: the set of sixty-four levels with big pieces among the ordinary ones in every one, from the easiest to the
 * hardest across every size it uses (`@johnmorrisdotca/suido/levels-big` has the boards, and `loadSuidoBigLevels` fetches them).
 * Everything here is read without loading a board, so a server can say which size level 40 is, how hard, and what it asks.
 *
 * A level of this set is a level of its own size (`SUIDO_BIG_SIZES`), so a page that plays it draws a board of that size; what
 * the set keeps apart is its numbering, 1 to 64, and its score. The score is one number from 1 to 100 that means the same at
 * every size (`bigDifficulty.ts`): how much of the board the answer uses, and how tangled it is for its size.
 */

/** Whether a number is a level of the big-pieces set. */
export function isSuidoBigLevel(level: number): boolean {
  return Number.isInteger(level) && level >= 1 && level <= SUIDO_BIG_COUNT;
}

/** Which third of the set a level sits in: its first third easy, its middle medium, its last hard. */
export function suidoBigBand(level: number): SuidoBand {
  const third = (level - 1) / SUIDO_BIG_COUNT;
  return third < 1 / 3 ? "easy" : third < 2 / 3 ? "medium" : "hard";
}

/** The size of a level's board, `"7x7"`, or null for a number that is no level. */
export function suidoBigSize(level: number): string | null {
  return SUIDO_BIG_SIZES[level - 1] ?? null;
}

/** How hard a level is across the whole set, 1 to 100, or null for a number that is no level. */
export function suidoBigScore(level: number): number | null {
  return SUIDO_BIG_SCORES[level - 1] ?? null;
}

/**
 * How many big pieces a level has among its ordinary ones, and the share of its board they cover: `{ count: 3, share: 0.24 }` is three 2×2 pieces, twelve
 * cells, on a board of fifty. The rest of the board is ordinary 1×1 pieces. Null for a number that is no level.
 */
export function suidoBigPieces(level: number): { count: number; share: number } | null {
  const count = SUIDO_BIG_PIECES[level - 1];
  const size = suidoBigSize(level);
  const area = size === null ? null : sizeOf(size);
  return count === undefined || area === null ? null : { count, share: (4 * count) / (area.width * area.height) };
}

/** A level's difficulty as 1 to 5, its score in steps of twenty, or null for a number that is no level. */
export function suidoBigMarks(level: number): number | null {
  const score = suidoBigScore(level);
  return score === null ? null : Math.min(5, 1 + Math.floor(score / 20));
}

/** The twists a level has, in the order the levels teach them: `big-pieces` on every one, and blocks that turn, a second pump, walls, locked pieces or wrap-around edges on some. Empty for a number that is no level. */
export function suidoBigTwists(level: number): Twist[] {
  const words = new Set((SUIDO_BIG_TWISTS[level - 1] ?? "").split(" "));
  return SUIDO_TWISTS.filter((twist) => words.has(twist));
}

const ROWS: readonly LevelRow[] = SUIDO_BIG_TWISTS.map((twists) => ["", "", twists]);

/** A level's part in its block's lesson (the 15th level of a block teaches what is new, the 16th tests it), or null for a level that has none. Read without the boards. */
export function suidoBigRole(level: number): TwistRole | null {
  return twistRole(ROWS, level);
}

/** How many levels of the set are open, given the ones solved: the first block of sixteen, and each block after it once the block before is all solved. */
export function openSuidoBigLevels(solved: ReadonlySet<number>): number {
  return openLevels(SUIDO_BIG_COUNT, solved);
}

/** The level to open on: the first open one not yet solved. */
export function nextSuidoBigLevel(solved: ReadonlySet<number>): number {
  return nextLevel(SUIDO_BIG_COUNT, solved);
}

/** The lowest level not yet solved, or null when every level of the set is. */
export function firstUnsolvedSuidoBigLevel(solved: ReadonlySet<number>): number | null {
  return firstUnsolvedLevel(SUIDO_BIG_COUNT, solved);
}

/** How many blocks of sixteen the set has. */
export const SUIDO_BIG_BLOCKS = SUIDO_BIG_COUNT / SUIDO_BLOCK;
