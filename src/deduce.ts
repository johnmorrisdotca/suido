import { neighboursOf, type Layout } from "./code.ts";
import { hasBlocks } from "./blocks.ts";
import { drainFacings, rotationsOfLayout } from "./facing.ts";
import { flowOf } from "./flow.ts";
import { refreshCells, unitsOf, wayHolds, type CellSets } from "./units.ts";

/** What a player can work out without guessing, as a person would: look at every piece, fix what is forced, and look again. */
export type Deduction = {
  /** The pieces the water goes through in the answer. */
  pieces: number;
  /** Pieces whose facing is forced at the first look, by the edge, bare ground, or a piece beside them that has to open or cannot. */
  glance: number;
  /** Pieces forced by the end, when no look forces any more. */
  settled: number;
  /** How many looks changed something: the longest chain of "this forces that". */
  rounds: number;
};

/**
 * The deductions of a board, in rounds. Each round looks at every piece at
 * once, as the board stood at the end of the last, and fixes every piece whose
 * facing is now forced. A network does it by what each piece may still face
 * (a piece must open back on a neighbour that must open towards it); a drains
 * board does it by growing from the pumps and the drains. `solution` is an
 * answer to the board, which says which pieces a drains board's water goes
 * through.
 */
export function deduce(layout: Layout, solution: readonly number[]): Deduction {
  if (layout.kind !== "network" && hasBlocks(layout)) throw new Error("Only a network can have big pieces or blocks that turn.");
  return layout.kind === "network" ? deduceNetwork(layout) : deduceDrains(layout, solution);
}

function deduceNetwork(layout: Layout): Deduction {
  const count = layout.width * layout.height;
  const near = neighboursOf(layout);
  const units = unitsOf(layout);
  let dom = new Uint8Array(units.count);
  let sets: CellSets = { open: new Uint8Array(count), shut: new Uint8Array(count), bare: new Uint8Array(count) };
  for (let unit = 0; unit < units.count; unit += 1) {
    dom[unit] = (1 << units.facings[unit]!.length) - 1;
    refreshCells(units, sets, unit, dom[unit]!);
  }
  const pieces = layout.cells.filter((mask) => mask !== 0).length;
  /** The cells whose facing is settled and that hold a piece. */
  const forced = (known: CellSets): number => {
    let found = 0;
    for (let cell = 0; cell < count; cell += 1) if (known.open[cell] !== 0 && (known.open[cell]! & known.shut[cell]!) === 0) found += 1;
    return found;
  };
  let rounds = 0;
  let glance = 0;
  for (;;) {
    const next = Uint8Array.from(dom);
    const after: CellSets = { open: Uint8Array.from(sets.open), shut: Uint8Array.from(sets.shut), bare: Uint8Array.from(sets.bare) };
    let changed = false;
    for (let unit = 0; unit < units.count; unit += 1) {
      let keep = dom[unit]!;
      for (let way = 0; way < units.facings[unit]!.length; way += 1) if (((keep >> way) & 1) === 1 && !wayHolds(units, near, sets, unit, way)) keep &= ~(1 << way);
      if (keep === 0) return { pieces, glance, settled: forced(sets), rounds };
      if (keep !== dom[unit]) {
        next[unit] = keep;
        refreshCells(units, after, unit, keep);
        changed = true;
      }
    }
    if (!changed) break;
    dom = next;
    sets = after;
    rounds += 1;
    if (rounds === 1) glance = forced(sets);
  }
  if (rounds === 0) glance = forced(sets);
  return { pieces, glance, settled: forced(sets), rounds };
}

function deduceDrains(layout: Layout, solution: readonly number[]): Deduction {
  const count = layout.width * layout.height;
  const near = neighboursOf(layout);
  const rotations = rotationsOfLayout(layout);
  const seed = new Uint8Array(count);
  for (const cell of [...layout.sources, ...layout.drains]) seed[cell] = 1;
  const val = new Int8Array(count).fill(-1);
  const pieces = flowOf(layout, solution).wetPieces;
  let rounds = 0;
  let glance = 0;
  let settled = 0;
  for (;;) {
    const found: [number, number][] = [];
    for (let cell = 0; cell < count; cell += 1) {
      if (val[cell]! >= 0 || layout.cells[cell] === 0) continue;
      const { masks, need } = drainFacings(layout, near, rotations, val, cell);
      if ((seed[cell] === 1 || need !== 0) && masks.length === 1) found.push([cell, masks[0]!]);
    }
    if (found.length === 0) break;
    for (const [cell, mask] of found) val[cell] = mask;
    settled += found.length;
    rounds += 1;
    if (rounds === 1) glance = settled;
  }
  return { pieces, glance, settled, rounds };
}

