import { SUIDO_BLOCK } from "./levelBlocks.ts";

/**
 * SUIDO'S LEVELS, COUNTED: which sizes there are, how many levels each has, and
 * which of them a player has opened. The levels themselves are data, each size
 * its own import (`@johnmorrisdotca/suido/levels-7x7`, or every size through
 * `@johnmorrisdotca/suido/levels`), so nothing here carries a board.
 *
 * A level is not made from a seed: level 12 at 7×7 is one board for every player
 * on every day, so a time on it can be compared with anybody's.
 */

/** A size of board, as its code writes it: its width, an x, its height. */
export type SuidoSize = `${number}x${number}`;

/** The square sizes, 5×5 to 14×14, then three pipe shapes: long boards, 5×7, 6×10 and 8×14. */
export const SUIDO_SIZES: readonly SuidoSize[] = ["5x5", "6x6", "7x7", "8x8", "9x9", "10x10", "11x11", "12x12", "13x13", "14x14", "5x7", "6x10", "8x14"];

/** How many levels each size has, read without loading the size: whole blocks of sixteen (`levelBlocks.ts`). */
export const SUIDO_LEVEL_COUNTS: Readonly<Record<string, number>> = {
  "5x5": 256,
  "6x6": 256,
  "7x7": 256,
  "8x8": 256,
  "9x9": 256,
  "10x10": 256,
  "11x11": 256,
  "12x12": 256,
  "13x13": 256,
  "14x14": 256,
  "5x7": 256,
  "6x10": 256,
  "8x14": 256,
};

/** One level: its board as a code (`code.ts`), its answer as one digit a cell, and its twists. */
export type LevelRow = readonly [board: string, turns: string, twists: string];

/** The third of a size a level sits in. */
export type SuidoBand = "easy" | "medium" | "hard";

/** The width and height of a size. */
export function sizeOf(size: string): { width: number; height: number } | null {
  const match = /^(\d{1,2})x(\d{1,2})$/.exec(size);
  return match === null ? null : { width: Number(match[1]), height: Number(match[2]) };
}

/** Whether a number is a level this size has. */
export function isSuidoLevel(size: string, level: number): boolean {
  const count = SUIDO_LEVEL_COUNTS[size];
  return count !== undefined && Number.isInteger(level) && level >= 1 && level <= count;
}

/** Which third of a size a level sits in: its first third easy, its middle medium, its last hard. */
export function suidoBand(size: string, level: number): SuidoBand {
  const count = SUIDO_LEVEL_COUNTS[size] ?? 256;
  const third = (level - 1) / count;
  return third < 1 / 3 ? "easy" : third < 2 / 3 ? "medium" : "hard";
}

/**
 * The levels that are open, given the ones solved: the first block of sixteen
 * always, and each block after it once every level of the block before is solved.
 */
export function openSuidoLevels(size: string, solved: ReadonlySet<number>): number {
  const count = SUIDO_LEVEL_COUNTS[size] ?? 0;
  let open = Math.min(SUIDO_BLOCK, count);
  while (open < count) {
    let blockDone = true;
    for (let level = open - SUIDO_BLOCK + 1; level <= open; level += 1) if (!solved.has(level)) blockDone = false;
    if (!blockDone) break;
    open = Math.min(open + SUIDO_BLOCK, count);
  }
  return open;
}

/** The level to open on: the first open one not yet solved, or the last open one when every open level is solved. */
export function nextSuidoLevel(size: string, solved: ReadonlySet<number>): number {
  const open = openSuidoLevels(size, solved);
  for (let level = 1; level <= open; level += 1) if (!solved.has(level)) return level;
  return open;
}

/**
 * The lowest level not yet solved, or null when every level of the size is.
 * It is always open: a block opens only once the block before is all solved,
 * so the first gap is in the open blocks.
 */
export function firstUnsolvedSuidoLevel(size: string, solved: ReadonlySet<number>): number | null {
  const count = SUIDO_LEVEL_COUNTS[size] ?? 0;
  for (let level = 1; level <= count; level += 1) if (!solved.has(level)) return level;
  return null;
}
