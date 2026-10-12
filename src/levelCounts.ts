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

/** A size of board, as its code writes it: its width, an x, its height.
 *
 * @example
 * ```ts
 * import type { SuidoSize } from "@johnmorrisdotca/suido/levels";
 *
 * const value: SuidoSize = "5x7";
 * console.log(value);
 * ```
 */
export type SuidoSize = `${number}x${number}`;

/**
 * The square sizes, 5×5 to 14×14, then three pipe shapes (long boards, 5×7, 6×10 and 8×14), then the huge
 * boards: 20×20, 28×28 and the long 20×50, which have sixty-four levels each, not two hundred and fifty-six.
 *
 * @example
 * ```ts
 * import { SUIDO_SIZES } from "@johnmorrisdotca/suido/levels";
 * console.log(SUIDO_SIZES);
 * ```
 */
export const SUIDO_SIZES: readonly SuidoSize[] = ["5x5", "6x6", "7x7", "8x8", "9x9", "10x10", "11x11", "12x12", "13x13", "14x14", "5x7", "6x10", "8x14", "20x20", "28x28", "20x50"];

/** How many levels each size has, read without loading the size: whole blocks of sixteen (`levelBlocks.ts`). The huge sizes have four blocks.
 *
 * @example
 * ```ts
 * import { SUIDO_LEVEL_COUNTS } from "@johnmorrisdotca/suido/levels";
 * console.log(SUIDO_LEVEL_COUNTS);
 * ```
 */
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
  "20x20": 64,
  "28x28": 64,
  "20x50": 64,
};

/** How many levels the big-pieces set has: four blocks of sixteen, each level with big pieces in it, on boards of many sizes (`bigLevels.ts`).
 *
 * @example
 * ```ts
 * import { SUIDO_BIG_COUNT } from "@johnmorrisdotca/suido/levels";
 * console.log(SUIDO_BIG_COUNT);
 * ```
 */
export const SUIDO_BIG_COUNT = 64;

/** One level: its board as a code (`code.ts`), its answer as one digit a cell, and its twists.
 *
 * @example
 * ```ts
 * import { SUIDO_5X5 } from "@johnmorrisdotca/suido/levels-5x5";
 * import type { LevelRow } from "@johnmorrisdotca/suido/levels";
 *
 * const row = SUIDO_5X5[0];
 * const value: LevelRow = row;
 * console.log(value);
 * ```
 */
export type LevelRow = readonly [board: string, turns: string, twists: string];

/** The third of a size a level sits in.
 *
 * @example
 * ```ts
 * import type { SuidoBand } from "@johnmorrisdotca/suido/levels";
 *
 * const value: SuidoBand = "easy";
 * console.log(value);
 * ```
 */
export type SuidoBand = "easy" | "medium" | "hard";

/** The width and height of a size.
 *
 * @param size - The native widthxheight size string, such as 5x5.
 * @returns The parsed positive width and height, or null for an invalid size string.
 * @example
 * ```ts
 * import { sizeOf } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(sizeOf("5x7"));
 * ```
 */
export function sizeOf(size: string): { width: number; height: number } | null {
  const match = /^(\d{1,2})x(\d{1,2})$/.exec(size);
  return match === null ? null : { width: Number(match[1]), height: Number(match[2]) };
}

/** Whether a number is a level this size has.
 *
 * @param size - The native widthxheight size string, such as 5x5.
 * @param level - The one-based level number.
 * @returns Whether a number is a level this size has.
 * @example
 * ```ts
 * import { isSuidoLevel } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(isSuidoLevel("5x5",1));
 * ```
 */
export function isSuidoLevel(size: string, level: number): boolean {
  const count = SUIDO_LEVEL_COUNTS[size];
  return count !== undefined && Number.isInteger(level) && level >= 1 && level <= count;
}

/** Which third of a size a level sits in: its first third easy, its middle medium, its last hard.
 *
 * @param size - The native widthxheight size string, such as 5x5.
 * @param level - The one-based level number.
 * @returns Which third of a size a level sits in: its first third easy, its middle medium, its last hard.
 * @example
 * ```ts
 * import { suidoBand } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(suidoBand("5x5",1));
 * ```
 */
export function suidoBand(size: string, level: number): SuidoBand {
  const count = SUIDO_LEVEL_COUNTS[size] ?? 256;
  const third = (level - 1) / count;
  return third < 1 / 3 ? "easy" : third < 2 / 3 ? "medium" : "hard";
}

/**
 * The levels that are open of a set of `count` levels, given the ones solved: the first block of sixteen
 * always, and each block after it once every level of the block before is solved.
 *
 * @param count - The total number of levels.
 * @param solved - The set of solved one-based level numbers.
 * @returns The levels that are open of a set of `count` levels, given the ones solved: the first block of sixteen always, and each block after it once every level of the block before is solved.
 * @example
 * ```ts
 * import { openLevels } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(openLevels(256,new Set([1,2])));
 * ```
 */
export function openLevels(count: number, solved: ReadonlySet<number>): number {
  let open = Math.min(SUIDO_BLOCK, count);
  while (open < count) {
    let blockDone = true;
    for (let level = open - SUIDO_BLOCK + 1; level <= open; level += 1) if (!solved.has(level)) blockDone = false;
    if (!blockDone) break;
    open = Math.min(open + SUIDO_BLOCK, count);
  }
  return open;
}

/** The level to open on in a set of `count`: the first open one not yet solved, or the last open one when every open level is solved.
 *
 * @param count - The total number of levels.
 * @param solved - The set of solved one-based level numbers.
 * @returns The level to open on in a set of `count`: the first open one not yet solved, or the last open one when every open level is solved.
 * @example
 * ```ts
 * import { nextLevel } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(nextLevel(256,new Set([1,2])));
 * ```
 */
export function nextLevel(count: number, solved: ReadonlySet<number>): number {
  const open = openLevels(count, solved);
  for (let level = 1; level <= open; level += 1) if (!solved.has(level)) return level;
  return open;
}

/**
 * The lowest level of a set of `count` not yet solved, or null when every level of it is.
 * It is always open: a block opens only once the block before is all solved,
 * so the first gap is in the open blocks.
 *
 * @param count - The total number of levels.
 * @param solved - The set of solved one-based level numbers.
 * @returns The lowest level of a set of `count` not yet solved, or null when every level of it is. It is always open: a block opens only once the block before is all solved, so the first gap is in the open blocks.
 * @example
 * ```ts
 * import { firstUnsolvedLevel } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(firstUnsolvedLevel(256,new Set([1,2])));
 * ```
 */
export function firstUnsolvedLevel(count: number, solved: ReadonlySet<number>): number | null {
  for (let level = 1; level <= count; level += 1) if (!solved.has(level)) return level;
  return null;
}

/** The levels of a size that are open, given the ones solved (`openLevels`).
 *
 * @param size - The native widthxheight size string, such as 5x5.
 * @param solved - The set of solved one-based level numbers.
 * @returns The levels of a size that are open, given the ones solved (`openLevels`).
 * @example
 * ```ts
 * import { openSuidoLevels } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(openSuidoLevels("5x5",new Set([1,2])));
 * ```
 */
export function openSuidoLevels(size: string, solved: ReadonlySet<number>): number {
  return openLevels(SUIDO_LEVEL_COUNTS[size] ?? 0, solved);
}

/** The level of a size to open on (`nextLevel`).
 *
 * @param size - The native widthxheight size string, such as 5x5.
 * @param solved - The set of solved one-based level numbers.
 * @returns The level of a size to open on (`nextLevel`).
 * @example
 * ```ts
 * import { nextSuidoLevel } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(nextSuidoLevel("5x5",new Set([1,2])));
 * ```
 */
export function nextSuidoLevel(size: string, solved: ReadonlySet<number>): number {
  return nextLevel(SUIDO_LEVEL_COUNTS[size] ?? 0, solved);
}

/** The lowest level of a size not yet solved, or null when every level of it is (`firstUnsolvedLevel`).
 *
 * @param size - The native widthxheight size string, such as 5x5.
 * @param solved - The set of solved one-based level numbers.
 * @returns The lowest level of a size not yet solved, or null when every level of it is (`firstUnsolvedLevel`).
 * @example
 * ```ts
 * import { firstUnsolvedSuidoLevel } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(firstUnsolvedSuidoLevel("5x5",new Set([1,2])));
 * ```
 */
export function firstUnsolvedSuidoLevel(size: string, solved: ReadonlySet<number>): number | null {
  return firstUnsolvedLevel(SUIDO_LEVEL_COUNTS[size] ?? 0, solved);
}
