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
 *
 * A plain board has none: its single pump feeds a network and every piece must be wet.
 */
export type Twist = "drains" | "pumps" | "locked" | "walls" | "wrap" | "inlet-outlet";

/** Every twist, in the order the levels teach them. */
export const SUIDO_TWISTS: readonly Twist[] = ["drains", "pumps", "locked", "walls", "wrap", "inlet-outlet"];

/** The twists a board has, in the order the levels teach them: none for a plain board. */
export function twistsOf(layout: Pick<Layout, "kind" | "wrap" | "sources" | "locked" | "walls">): Twist[] {
  const has: Record<Twist, boolean> = {
    drains: layout.kind === "drains",
    pumps: layout.sources.length > 1,
    locked: layout.locked !== undefined && layout.locked.length > 0,
    walls: layout.walls !== undefined && layout.walls.length > 0,
    wrap: layout.wrap,
    "inlet-outlet": layout.kind === "inlet-outlet",
  };
  return SUIDO_TWISTS.filter((twist) => has[twist]);
}

/** Whether a board has any twist. */
export function isTwisted(layout: Pick<Layout, "kind" | "wrap" | "sources" | "locked" | "walls">): boolean {
  return twistsOf(layout).length > 0;
}
