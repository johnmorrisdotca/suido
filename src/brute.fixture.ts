import type { Layout } from "./code.ts";
import { hasBlocks } from "./blocks.ts";
import { rotationsOfLayout } from "./facing.ts";
import { flowOf } from "./flow.ts";
import { unitsOf } from "./units.ts";

/** How many ways there are to face every piece, which is how much work `bruteForce` does. */
/**
 * The answers to a board by trying every way to face every piece: the slow,
 * obviously right counter the solver is held to in the tests. Only for small
 * boards (the work is the product of every piece's facings). A network's
 * answers are the ways of facing every piece that solve it; a drains board's
 * are the distinct networks of wet pieces, with the spares left out, since a
 * spare faces any way. A locked piece has only the way it is given, and a wall
 * is read by the water itself, so neither needs a rule here.
 */
export function facingsOf(layout: Layout): number {
  if (hasBlocks(layout)) return unitsOf(layout).facings.reduce((product, one) => product * one.length, 1);
  return rotationsOfLayout(layout).reduce((product, one) => product * one.length, 1);
}

/** How many answers the board has, by trying every way of facing every piece. */
export function bruteForce(layout: Layout): number {
  if (hasBlocks(layout)) return bruteForceUnits(layout);
  const options = rotationsOfLayout(layout);
  const found = new Set<string>();
  const masks = layout.cells.map((mask) => mask);
  const walk = (cell: number): void => {
    if (cell === masks.length) {
      const flow = flowOf(layout, masks);
      if (flow.solved) found.add(layout.kind !== "network" ? masks.map((mask, at) => (flow.wet[at] === true ? mask : -1)).join() : masks.join());
      return;
    }
    for (const mask of options[cell]!) {
      masks[cell] = mask;
      walk(cell + 1);
    }
  };
  walk(0);
  return found.size;
}

/** The same for a board with blocks that turn as one: every way to face every unit, a block turning as a whole. */
function bruteForceUnits(layout: Layout): number {
  const units = unitsOf(layout);
  const found = new Set<string>();
  const masks = layout.cells.map((mask) => mask);
  const walk = (unit: number): void => {
    if (unit === units.count) {
      if (flowOf(layout, masks).solved) found.add(masks.join());
      return;
    }
    for (const facing of units.facings[unit]!) {
      units.cells[unit]!.forEach((cell, at) => (masks[cell] = facing[at]!));
      walk(unit + 1);
    }
  };
  walk(0);
  return found.size;
}
