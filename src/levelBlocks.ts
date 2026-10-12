/**
 * SUIDO'S BLOCKS: its levels come sixteen at a time, as Tsunagi's do. A block
 * opens once every level of the block before it is solved, a page shows one block
 * at a time, and within a block the levels rise; the 15th and 16th of a block are
 * where its twist takes: the 15th teaches it and the 16th tests it.
 *
 * Its own module, with nothing imported, so the level-making script on a desk
 * reads the same number a page does.
 *
 * @example
 * ```ts
 * import { SUIDO_BLOCK } from "@johnmorrisdotca/suido/levels";
 * console.log(SUIDO_BLOCK);
 * ```
 */
export const SUIDO_BLOCK = 16;

/** The block a level is in, from 1.
 *
 * @param level - The one-based level number.
 * @returns The block a level is in, from 1.
 * @example
 * ```ts
 * import { blockOf } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(blockOf(17));
 * ```
 */
export function blockOf(level: number): number {
  return Math.ceil(level / SUIDO_BLOCK);
}

/** A block's first and last level, the last no further than the size has.
 *
 * @param block - The zero-based ladder block index, or decoded four-cell block specified by the signature.
 * @param count - The total number of levels.
 * @returns A block's first and last level, the last no further than the size has.
 * @example
 * ```ts
 * import { blockRange } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(blockRange(1,256));
 * ```
 */
export function blockRange(block: number, count: number): { first: number; last: number } {
  const first = (block - 1) * SUIDO_BLOCK + 1;
  return { first, last: Math.min(count, block * SUIDO_BLOCK) };
}

/** How many blocks a size of `count` levels has.
 *
 * @param count - The total number of levels.
 * @returns How many blocks a size of `count` levels has.
 * @example
 * ```ts
 * import { blocksIn } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(blocksIn(256));
 * ```
 */
export function blocksIn(count: number): number {
  return Math.ceil(count / SUIDO_BLOCK);
}
