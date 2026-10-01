import { neighboursOf, type Layout } from "./code.ts";
import { armsOf, opposite } from "./pieces.ts";

/** Where the water is on a board as it is turned: the whole picture, from the pump outwards. */
export type Flow = {
  /** Whether the water has reached each cell. */
  wet: boolean[];
  /** The cell the water came from into each wet cell; -1 for a source and for a dry cell. */
  from: number[];
  /** The side each wet cell was entered on, the side facing `from`; -1 for a source and for a dry cell. */
  entry: number[];
  /** How many cells the water went through to get to each wet cell, 0 at a source; -1 for a dry cell. */
  depth: number[];
  /** Every opening of a wet piece that opens on nothing: the edge of the board, bare ground, or a piece that does not open back. The water runs out of each. */
  spills: { cell: number; side: number }[];
  /** The wet cells in the order the water reaches them, nearest the source first. */
  order: number[];
  /** How many pieces the board has, and how many of them are wet. */
  pieces: number;
  wetPieces: number;
  /** How many drains the board has, and how many are wet. */
  drains: number;
  wetDrains: number;
  /** Whether the board is solved: the water reaches what its kind asks, and nothing runs out (and on an inlet-outlet board, it runs in one path). */
  solved: boolean;
};

/**
 * The water on a board whose pieces face as `masks` say. It starts at every
 * source and goes through every opening that meets an opening of the piece
 * beside it; whatever it reaches is wet. Plain breadth-first search, one visit
 * to each cell.
 */
export function flowOf(layout: Layout, masks: readonly number[] = layout.cells): Flow {
  const count = layout.width * layout.height;
  const near = neighboursOf(layout);
  const wet = new Array<boolean>(count).fill(false);
  const from = new Array<number>(count).fill(-1);
  const entry = new Array<number>(count).fill(-1);
  const depth = new Array<number>(count).fill(-1);
  const order: number[] = [];
  const spills: { cell: number; side: number }[] = [];
  for (const source of layout.sources) {
    if (wet[source] === true) continue;
    wet[source] = true;
    depth[source] = 0;
    order.push(source);
  }
  for (let head = 0; head < order.length; head += 1) {
    const cell = order[head]!;
    for (let side = 0; side < 4; side += 1) {
      if (((masks[cell]! >> side) & 1) === 0) continue;
      const next = near[cell * 4 + side]!;
      if (next === -1 || ((masks[next]! >> opposite(side)) & 1) === 0) {
        spills.push({ cell, side });
        continue;
      }
      if (wet[next] === true) continue;
      wet[next] = true;
      from[next] = cell;
      entry[next] = opposite(side);
      depth[next] = depth[cell]! + 1;
      order.push(next);
    }
  }
  const pieces = masks.filter((mask) => mask !== 0).length;
  const wetPieces = order.length;
  const wetDrains = layout.drains.filter((cell) => wet[cell] === true).length;
  const reached = layout.kind === "network" ? wetPieces === pieces : wetDrains === layout.drains.length;
  // One path, not a tree: on an inlet-outlet board no wet piece opens on more than two sides.
  const branched = layout.kind === "inlet-outlet" && order.some((cell) => armsOf(masks[cell]!) > 2);
  return { wet, from, entry, depth, spills, order, pieces, wetPieces, drains: layout.drains.length, wetDrains, solved: reached && spills.length === 0 && !branched };
}

/** Whether a board facing as `masks` say is solved. */
export function isSolved(layout: Layout, masks: readonly number[] = layout.cells): boolean {
  return flowOf(layout, masks).solved;
}
