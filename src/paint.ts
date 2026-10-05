import type { Layout } from "./code.ts";
import { cellStates, stepFor } from "./draw.ts";
import { flowOf, type Flow } from "./flow.ts";

/**
 * PAINTING the water onto a board `drawSuido` drew, in place: nothing is
 * redrawn, so the pipes turn and the water flows (and runs back) by the
 * style's transitions. Call it after every tap, with how the pieces face now
 * and how far each has been turned in all (`Game.masks` and `Game.quarters`).
 * It sets `data-wet`, `data-solved`, `data-w` and the `--k`, `--q` and
 * `--sd-step` custom properties and nothing else, and returns the water.
 *
 * Only what has changed is written. On a board of a thousand pieces a tap
 * changes a few dozen, and rewriting the other nine hundred (even to the value
 * they have) costs a style recalculation and, with transitions on every piece,
 * most of a frame on a phone; what each piece was last painted as is kept in
 * a `WeakMap`, so a board drawn again is painted whole.
 */
const painted = new WeakMap<Element, string>();

export function paintSuido(svg: Element, layout: Layout, masks: readonly number[], quarters: readonly number[]): Flow {
  const flow = flowOf(layout, masks);
  const states = cellStates(layout, masks, quarters, flow);
  const cells = svg.querySelectorAll<SVGGElement>(".sd-cell");
  for (const state of states) {
    const cell = cells[state.cell];
    if (cell === undefined) continue;
    const depth = state.wet ? state.depth : 0;
    const key = `${state.quarters}|${state.wet ? 1 : 0}|${depth}|${state.arms.join(",")}`;
    if (painted.get(cell) === key) continue;
    painted.set(cell, key);
    cell.setAttribute("data-wet", String(state.wet));
    cell.style.setProperty("--k", String(depth));
    cell.querySelector<SVGGElement>(".sd-turn")?.style.setProperty("--q", String(state.quarters));
    for (const arm of cell.querySelectorAll<SVGGElement>(".sd-arm")) arm.setAttribute("data-w", state.arms[Number(arm.getAttribute("data-side"))] ?? "");
  }
  svg.setAttribute("data-solved", String(flow.solved));
  (svg as unknown as SVGElement).style.setProperty("--sd-step", `${stepFor(Math.max(0, ...flow.depth))}ms`);
  return flow;
}
