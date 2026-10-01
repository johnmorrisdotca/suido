import { decodeLayout } from "./code.ts";
import { flowOf } from "./flow.ts";
import { quartersBetween } from "./pieces.ts";

/** What a check says: solved, or the first reason it is not. */
export type SuidoCheck = { ok: true } | { ok: false; reason: string };

/**
 * Whether an answer solves a board: the check a page makes to say "solved" and
 * a server makes before it trusts a solve. O(cells): one walk of the water,
 * no search.
 *
 * The answer is a code like the board's own. Every cell of it must be the
 * piece the board has there, turned (a piece is never changed, moved or taken
 * away), and the sources and drains must be where the board put them. Then the
 * water is run from the sources through the answer's pieces, and the board
 * must be solved: a network, every piece wet; drains, every drain wet; and
 * either way no wet piece opens on nothing.
 *
 * It does not ask whether the board is one a site has made: a site that pays
 * or ranks for a solve asks that first.
 */
export function checkSuidoAnswer(board: string, answer: string): SuidoCheck {
  const layout = decodeLayout(board);
  if (layout === null) return { ok: false, reason: "the board is not a Suido code" };
  const solved = decodeLayout(answer);
  if (solved === null) return { ok: false, reason: "the answer is not a Suido code" };
  if (solved.width !== layout.width || solved.height !== layout.height || solved.wrap !== layout.wrap || solved.kind !== layout.kind) return { ok: false, reason: "the answer is for a different board" };
  if (solved.sources.join() !== layout.sources.join() || solved.drains.join() !== layout.drains.join()) return { ok: false, reason: "a source or a drain is not where the board has it" };
  for (let cell = 0; cell < layout.cells.length; cell += 1) {
    if (quartersBetween(layout.cells[cell]!, solved.cells[cell]!) === null) return { ok: false, reason: "a piece is not the piece the board has there" };
  }
  const flow = flowOf(layout, solved.cells);
  if (flow.spills.length > 0) return { ok: false, reason: "the water runs out of an open end" };
  if (layout.kind === "drains" ? flow.wetDrains !== flow.drains : flow.wetPieces !== flow.pieces) {
    return { ok: false, reason: layout.kind === "drains" ? "the water does not reach every drain" : "the water does not reach every piece" };
  }
  return { ok: true };
}
