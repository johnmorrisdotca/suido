import type { Layout } from "./code.ts";
import { opposite } from "./pieces.ts";

/** The sixteen pieces as one 16-bit set: those that open on a side, and those that do not. */
export const HAS = [0, 1, 2, 3].map((side) => [...Array(16).keys()].reduce((set, mask) => (((mask >> side) & 1) === 1 ? set | (1 << mask) : set), 0));
export const LACKS = HAS.map((has) => ~has & 0xffff);

/** The pieces in a 16-bit set. */
export function members(set: number): number[] {
  const out: number[] = [];
  for (let mask = 0; set !== 0; mask += 1, set >>= 1) if ((set & 1) === 1) out.push(mask);
  return out;
}

export const bits = (set: number): number => {
  let count = 0;
  for (let rest = set; rest !== 0; rest &= rest - 1) count += 1;
  return count;
};

/** The sides any piece in the set opens on. */
export const sidesOf = (set: number): number => {
  let sides = 0;
  for (let mask = 0; set !== 0; mask += 1, set >>= 1) if ((set & 1) === 1) sides |= mask;
  return sides;
};

/**
 * The ways a piece may face in a drains board, given the pieces already faced
 * (`val` holds the sides each opens on, -1 for one not yet faced): it must open
 * on every side a faced neighbour opens towards it (`need`), and on none where
 * a faced neighbour does not, the ground is bare, or the board ends.
 */
export function drainFacings(layout: Layout, near: Int32Array, rotations: readonly (readonly number[])[], val: Int8Array, cell: number): { masks: number[]; need: number } {
  let need = 0;
  let bar = 0;
  for (let side = 0; side < 4; side += 1) {
    const next = near[cell * 4 + side]!;
    if (next === -1 || layout.cells[next] === 0) bar |= 1 << side;
    else if (val[next]! >= 0) {
      if (((val[next]! >> opposite(side)) & 1) === 1) need |= 1 << side;
      else bar |= 1 << side;
    }
  }
  return { masks: rotations[cell]!.filter((mask) => (mask & need) === need && (mask & bar) === 0), need };
}
