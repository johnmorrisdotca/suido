import type { Layout } from "./code.ts";
import { flowOf } from "./flow.ts";
import { rotationsOf } from "./pieces.ts";

/** How many ways there are to face every piece, which is how much work `bruteForce` does. */
/**
 * The answers to a board by trying every way to face every piece: the slow,
 * obviously right counter the solver is held to in the tests. Only for small
 * boards (the work is the product of every piece's facings). A network's
 * answers are the ways of facing every piece that solve it; a drains board's
 * are the distinct networks of wet pieces, with the spares left out, since a
 * spare faces any way.
 */
export function facingsOf(layout: Layout): number {
  return layout.cells.map(rotationsOf).reduce((product, one) => product * one.length, 1);
}

/** How many answers the board has, by trying every way of facing every piece. */
export function bruteForce(layout: Layout): number {
  const options = layout.cells.map(rotationsOf);
  const found = new Set<string>();
  const masks = layout.cells.map((mask) => mask);
  const walk = (cell: number): void => {
    if (cell === masks.length) {
      const flow = flowOf(layout, masks);
      if (flow.solved) found.add(layout.kind === "drains" ? masks.map((mask, at) => (flow.wet[at] === true ? mask : -1)).join() : masks.join());
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
