/**
 * THE PIECES. A pipe piece is the set of sides it opens on, written as four
 * bits: north 1, east 2, south 4, west 8. A mask is all a piece is: there are
 * sixteen, and a quarter turn clockwise moves every bit one place round.
 *
 * Five shapes can be turned (an end, a straight, an elbow, a T, a cross) and a
 * blank is ground with nothing on it. A piece's shape never changes in play;
 * only which way it faces does.
 */

/** A side of a cell. They go round clockwise, so a quarter turn adds one.
 *
 * @example
 * ```ts
 * import { NORTH } from "@johnmorrisdotca/suido";
 * console.log(NORTH);
 * ```
 */
export const NORTH = 1;
/** The east opening bit of a pipe mask.
 *
 * @example
 * ```ts
 * import { EAST } from "@johnmorrisdotca/suido";
 * console.log(EAST);
 * ```
 */
export const EAST = 2;
/** The south opening bit of a pipe mask.
 *
 * @example
 * ```ts
 * import { SOUTH } from "@johnmorrisdotca/suido";
 * console.log(SOUTH);
 * ```
 */
export const SOUTH = 4;
/** The west opening bit of a pipe mask.
 *
 * @example
 * ```ts
 * import { WEST } from "@johnmorrisdotca/suido";
 * console.log(WEST);
 * ```
 */
export const WEST = 8;

/** The four sides by number, 0 (north) to 3 (west): the bit of side `i` is `1 << i`.
 *
 * @example
 * ```ts
 * import { SIDES } from "@johnmorrisdotca/suido";
 * console.log(SIDES);
 * ```
 */
export const SIDES = [NORTH, EAST, SOUTH, WEST] as const;

/** The step across each side, as columns and rows.
 *
 * @example
 * ```ts
 * import { SIDE_STEPS } from "@johnmorrisdotca/suido";
 * console.log(SIDE_STEPS);
 * ```
 */
export const SIDE_STEPS = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
] as const;

/** The side a piece next door must open on to meet an opening on side `side`.
 *
 * @param side - A side index from 0 north to 3 west, or reference-board side length specified by the signature.
 * @returns The side a piece next door must open on to meet an opening on side `side`.
 * @example
 * ```ts
 * import { opposite } from "@johnmorrisdotca/suido";
 *
 * console.log(opposite(0));
 * ```
 */
export function opposite(side: number): number {
  return (side + 2) & 3;
}

/** What a piece is, by how many sides it opens on and where.
 *
 * @example
 * ```ts
 * import type { Shape } from "@johnmorrisdotca/suido";
 *
 * const value: Shape = "elbow";
 * console.log(value);
 * ```
 */
export type Shape = "blank" | "end" | "straight" | "elbow" | "tee" | "cross";

/** A piece of each shape facing north, as the drawings and the tests name them.
 *
 * @example
 * ```ts
 * import { SHAPE_MASKS } from "@johnmorrisdotca/suido";
 * console.log(SHAPE_MASKS);
 * ```
 */
export const SHAPE_MASKS: Record<Shape, number> = { blank: 0, end: NORTH, straight: NORTH | SOUTH, elbow: NORTH | EAST, tee: NORTH | EAST | SOUTH, cross: 15 };

/** The shape of a piece, from the sides it opens on.
 *
 * @param mask - A pipe mask: north 1, east 2, south 4 and west 8.
 * @returns The shape of a piece, from the sides it opens on.
 * @example
 * ```ts
 * import { shapeOf } from "@johnmorrisdotca/suido";
 *
 * console.log(shapeOf(3));
 * ```
 */
export function shapeOf(mask: number): Shape {
  const open = [0, 1, 2, 3].filter((side) => (mask >> side) & 1).length;
  if (open === 0) return "blank";
  if (open === 1) return "end";
  if (open === 3) return "tee";
  if (open === 4) return "cross";
  return mask === (NORTH | SOUTH) || mask === (EAST | WEST) ? "straight" : "elbow";
}

/** A piece turned `quarters` quarter turns clockwise; a negative number turns it the other way.
 *
 * @param mask - A pipe mask: north 1, east 2, south 4 and west 8.
 * @param quarters - Clockwise quarter turns, per cell or for the piece specified by the signature.
 * @returns A piece turned `quarters` quarter turns clockwise; a negative number turns it the other way.
 * @example
 * ```ts
 * import { turn } from "@johnmorrisdotca/suido";
 *
 * console.log(turn(3,1));
 * ```
 */
export function turn(mask: number, quarters = 1): number {
  const by = ((quarters % 4) + 4) % 4;
  let out = mask & 15;
  for (let i = 0; i < by; i += 1) out = ((out << 1) | (out >> 3)) & 15;
  return out;
}

/** Every way a piece can face, each once and in order: one for a cross, two for a straight, four for the rest.
 *
 * @param mask - A pipe mask: north 1, east 2, south 4 and west 8.
 * @returns Every way a piece can face, each once and in order: one for a cross, two for a straight, four for the rest.
 * @example
 * ```ts
 * import { rotationsOf } from "@johnmorrisdotca/suido";
 *
 * console.log(rotationsOf(5));
 * ```
 */
export function rotationsOf(mask: number): number[] {
  return [...new Set([0, 1, 2, 3].map((quarters) => turn(mask, quarters)))].sort((a, b) => a - b);
}

/** The fewest quarter turns, clockwise, that make `from` into `to`; null when they are not the same shape.
 *
 * @param from - The original pipe mask or mask array specified by the signature.
 * @param to - The desired pipe mask or mask array specified by the signature.
 * @returns The fewest quarter turns, clockwise, that make `from` into `to`; null when they are not the same shape.
 * @example
 * ```ts
 * import { quartersBetween } from "@johnmorrisdotca/suido";
 *
 * console.log(quartersBetween(3,6));
 * ```
 */
export function quartersBetween(from: number, to: number): number | null {
  for (let quarters = 0; quarters < 4; quarters += 1) if (turn(from, quarters) === to) return quarters;
  return null;
}

/**
 * The taps it takes to face a piece the right way when a tap turns it one way
 * only (`both` false) or either way (`both` true, the shorter of the two).
 *
 * @param from - The original pipe mask or mask array specified by the signature.
 * @param to - The desired pipe mask or mask array specified by the signature.
 * @param both - Whether turns may go clockwise or anticlockwise.
 * @returns The fewest permitted taps, or null when the two masks have different shapes.
 * @example
 * ```ts
 * import { tapsBetween } from "@johnmorrisdotca/suido";
 *
 * console.log(tapsBetween(3,6,true));
 * ```
 */
export function tapsBetween(from: number, to: number, both = true): number | null {
  const quarters = quartersBetween(from, to);
  if (quarters === null) return null;
  return both ? Math.min(quarters, (4 - quarters) % 4) : quarters;
}

/** How many sides a piece opens on.
 *
 * @param mask - A pipe mask: north 1, east 2, south 4 and west 8.
 * @returns How many sides a piece opens on.
 * @example
 * ```ts
 * import { armsOf } from "@johnmorrisdotca/suido";
 *
 * console.log(armsOf(3));
 * ```
 */
export function armsOf(mask: number): number {
  return [0, 1, 2, 3].filter((side) => (mask >> side) & 1).length;
}
