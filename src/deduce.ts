import { neighboursOf, type Layout } from "./code.ts";
import { bits, drainFacings, HAS, LACKS } from "./facing.ts";
import { flowOf } from "./flow.ts";
import { opposite, rotationsOf } from "./pieces.ts";

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
  return layout.kind === "drains" ? deduceDrains(layout, solution) : deduceNetwork(layout);
}

function deduceNetwork(layout: Layout): Deduction {
  const count = layout.width * layout.height;
  const near = neighboursOf(layout);
  let dom = new Uint16Array(count);
  for (let cell = 0; cell < count; cell += 1) for (const mask of rotationsOf(layout.cells[cell]!)) dom[cell]! |= 1 << mask;
  const pieces = layout.cells.filter((mask) => mask !== 0).length;
  const forced = (set: Uint16Array): number => Array.from(set).filter((one, cell) => layout.cells[cell] !== 0 && bits(one) === 1).length;
  let rounds = 0;
  let glance = 0;
  for (;;) {
    const next = Uint16Array.from(dom);
    let changed = false;
    for (let cell = 0; cell < count; cell += 1) {
      let keep = dom[cell]!;
      for (let side = 0; side < 4; side += 1) {
        const other = near[cell * 4 + side]!;
        const back = opposite(side);
        if (!(other !== -1 && (dom[other]! & HAS[back]!) !== 0)) keep &= LACKS[side]!;
        if (!(other === -1 || (dom[other]! & LACKS[back]!) !== 0)) keep &= HAS[side]!;
      }
      if (keep === 0) return { pieces, glance, settled: forced(dom), rounds };
      if (keep !== dom[cell]) {
        next[cell] = keep;
        changed = true;
      }
    }
    if (!changed) break;
    dom = next;
    rounds += 1;
    if (rounds === 1) glance = forced(dom);
  }
  if (rounds === 0) glance = forced(dom);
  return { pieces, glance, settled: forced(dom), rounds };
}

function deduceDrains(layout: Layout, solution: readonly number[]): Deduction {
  const count = layout.width * layout.height;
  const near = neighboursOf(layout);
  const rotations = layout.cells.map(rotationsOf);
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

