import type { Layout } from "./code.ts";

/**
 * THE TWISTS: what a board can ask of a player beyond turning every piece until
 * the water reaches all of them. Each is a thing the board itself says (its code
 * carries it), a level declares it on its row, and a page shows it as a chip.
 *
 *  - `drains`: the water must reach every drain, not every piece; pieces it does
 *    not need are spares and may stay dry, facing any way.
 *  - `pumps`: more than one pump, each feeding its own pipes.
 *  - `locked`: some pieces cannot be turned. They are given facing the way the
 *    answer has them, and are the first things to build the rest from.
 *  - `walls`: water cannot cross some of the edges between cells, so a pipe
 *    opening on one runs out of it as it does at the edge of the board.
 *  - `wrap`: the edges of the board join, left to right and top to bottom.
 *  - `inlet-outlet`: one pump at the top left and one drain at the bottom right,
 *    and the water must run between them in one path with no branch; the rest of
 *    the pieces are decoys and stay dry.
 *  - `big-pieces`: some pieces are big, four cells that are one piece with up to
 *    eight openings, and a tap turns the whole of it a quarter in place.
 *  - `block-turns`: a tap on certain squares of four pieces turns the four together,
 *    each moving round to the next place as it turns; those pieces cannot be turned
 *    on their own.
 *
 * A plain board has none: its single pump feeds a network and every piece must be wet.
 */
export type Twist = "drains" | "pumps" | "locked" | "walls" | "wrap" | "inlet-outlet" | "big-pieces" | "block-turns";

/** Every twist, the six the fixed levels teach in the order they teach them, then the two of boards made on request. */
export const SUIDO_TWISTS: readonly Twist[] = ["drains", "pumps", "locked", "walls", "wrap", "inlet-outlet", "big-pieces", "block-turns"];

/** The six twists the fixed levels have, in the order they teach them. */
export const SUIDO_LEVEL_TWISTS: readonly Twist[] = ["drains", "pumps", "locked", "walls", "wrap", "inlet-outlet"];

/** The twists a board has, in the order the levels teach them: none for a plain board. */
export function twistsOf(layout: Pick<Layout, "kind" | "wrap" | "sources" | "locked" | "walls" | "bigs" | "blocks">): Twist[] {
  const has: Record<Twist, boolean> = {
    drains: layout.kind === "drains",
    pumps: layout.sources.length > 1,
    locked: layout.locked !== undefined && layout.locked.length > 0,
    walls: layout.walls !== undefined && layout.walls.length > 0,
    wrap: layout.wrap,
    "inlet-outlet": layout.kind === "inlet-outlet",
    "big-pieces": layout.bigs !== undefined && layout.bigs.length > 0,
    "block-turns": layout.blocks !== undefined && layout.blocks.length > 0,
  };
  return SUIDO_TWISTS.filter((twist) => has[twist]);
}

/** Whether a board has any twist. */
export function isTwisted(layout: Pick<Layout, "kind" | "wrap" | "sources" | "locked" | "walls" | "bigs" | "blocks">): boolean {
  return twistsOf(layout).length > 0;
}
