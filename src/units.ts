import { blockFacings, blockInfo } from "./blocks.ts";
import type { Layout } from "./code.ts";
import { opposite, rotationsOf } from "./pieces.ts";

/**
 * THE UNITS A NETWORK IS SOLVED IN. What a player turns is a unit: a single piece
 * (which faces any of its rotations, or only the way it is given if it is locked)
 * or a block of four cells (which faces any of its four turns). A unit has a list
 * of facings, each the masks of its cells, and the solver keeps for each unit
 * which of them are still possible, as the bits of a small number.
 *
 * Units are numbered in the order of their first cell, so that a board with no
 * block has one unit to a cell, in order, and is solved exactly as it was before
 * blocks were.
 */
export type Units = {
  /** How many units there are. */
  count: number;
  /** The unit each cell is in. */
  of: Int32Array;
  /** The cells of each unit; for a block, clockwise from its top left. */
  cells: number[][];
  /** For each unit, each way it can face, as the mask of each of its cells. */
  facings: number[][][];
};

/** The units of a board. */
export function unitsOf(layout: Layout): Units {
  const total = layout.width * layout.height;
  const info = blockInfo(layout);
  const locked = new Set(layout.locked ?? []);
  const of = new Int32Array(total).fill(-1);
  const cells: number[][] = [];
  const facings: number[][][] = [];
  for (let cell = 0; cell < total; cell += 1) {
    if (of[cell]! >= 0) continue;
    const at = info.of[cell] ?? -1;
    const unit = cells.length;
    if (at >= 0) {
      const block = info.blocks[at]!;
      for (const inside of block.cells) of[inside] = unit;
      cells.push([...block.cells]);
      facings.push(blockFacings(layout.cells, block));
    } else {
      of[cell] = unit;
      cells.push([cell]);
      facings.push((locked.has(cell) ? [layout.cells[cell]!] : rotationsOf(layout.cells[cell]!)).map((mask) => [mask]));
    }
  }
  return { count: cells.length, of, cells, facings };
}

/** What the solver knows of every cell, from the facings still possible for its unit: the sides some facing opens, the sides some facing leaves shut, and whether some facing leaves it bare. */
export type CellSets = { open: Uint8Array; shut: Uint8Array; bare: Uint8Array };

/** Writes into `sets` what the facings in `domain` (bits of the unit's facings) say of each of the unit's cells. */
export function refreshCells(units: Units, sets: CellSets, unit: number, domain: number): void {
  const cells = units.cells[unit]!;
  const facings = units.facings[unit]!;
  for (let at = 0; at < cells.length; at += 1) {
    let open = 0;
    let shut = 0;
    let bare = 0;
    for (let way = 0; way < facings.length; way += 1) {
      if (((domain >> way) & 1) === 0) continue;
      const mask = facings[way]![at]!;
      open |= mask;
      shut |= ~mask & 15;
      if (mask === 0) bare = 1;
    }
    const cell = cells[at]!;
    sets.open[cell] = open;
    sets.shut[cell] = shut;
    sets.bare[cell] = bare;
  }
}

/**
 * Whether a unit can face in way `way` given what its neighbours can still be: every side it opens needs a
 * neighbour that can open back, and every side it leaves shut needs the edge of the board, a wall, or a
 * neighbour that can leave that side shut. Between two cells of the same block the facing must agree with itself.
 */
export function wayHolds(units: Units, near: Int32Array, sets: CellSets, unit: number, way: number): boolean {
  const cells = units.cells[unit]!;
  const masks = units.facings[unit]![way]!;
  for (let at = 0; at < cells.length; at += 1) {
    const cell = cells[at]!;
    const mask = masks[at]!;
    for (let side = 0; side < 4; side += 1) {
      const next = near[cell * 4 + side]!;
      const back = opposite(side);
      const opens = (mask >> side) & 1;
      if (next !== -1 && units.of[next] === unit) {
        if (opens !== ((masks[cells.indexOf(next)]! >> back) & 1)) return false;
      } else if (opens === 1) {
        if (next === -1 || ((sets.open[next]! >> back) & 1) === 0) return false;
      } else if (next !== -1 && ((sets.shut[next]! >> back) & 1) === 0) return false;
    }
  }
  return true;
}

/** How many bits are set. */
export function countBits(set: number): number {
  let count = 0;
  for (let rest = set; rest !== 0; rest &= rest - 1) count += 1;
  return count;
}
