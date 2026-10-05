import { blockInfo, blockQuartersBetween } from "./blocks.ts";
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
 * either way no wet piece opens on nothing; an inlet-outlet board also asks that
 * the water runs in one path. Locked pieces must be as the board gives them, and
 * the walls must be the board's walls. A block that turns as one (big pieces and
 * blocks) must be the block the board has there turned a whole number of quarters,
 * never one piece of it turned alone.
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
  if ((layout.walls ?? []).join() !== (solved.walls ?? []).join() || (layout.locked ?? []).join() !== (solved.locked ?? []).join()) return { ok: false, reason: "the walls or the locked pieces are not the board's" };
  if ((layout.bigs ?? []).join() !== (solved.bigs ?? []).join() || (layout.blocks ?? []).join() !== (solved.blocks ?? []).join()) return { ok: false, reason: "the big pieces or the blocks are not the board's" };
  const locked = new Set(layout.locked ?? []);
  const info = blockInfo(layout);
  for (const block of info.blocks) if (blockQuartersBetween(layout.cells, solved.cells, block) === null) return { ok: false, reason: "a block is not the block the board has there, turned" };
  for (let cell = 0; cell < layout.cells.length; cell += 1) {
    if (info.of[cell]! >= 0) continue;
    if (quartersBetween(layout.cells[cell]!, solved.cells[cell]!) === null) return { ok: false, reason: "a piece is not the piece the board has there" };
    if (locked.has(cell) && solved.cells[cell] !== layout.cells[cell]) return { ok: false, reason: "a locked piece was turned" };
  }
  const flow = flowOf(layout, solved.cells);
  if (flow.spills.length > 0) return { ok: false, reason: "the water runs out of an open end" };
  if (layout.kind !== "network" ? flow.wetDrains !== flow.drains : flow.wetPieces !== flow.pieces) {
    return { ok: false, reason: layout.kind !== "network" ? "the water does not reach every drain" : "the water does not reach every piece" };
  }
  if (!flow.solved) return { ok: false, reason: "the water branches: it must run in one path from the inlet to the outlet" };
  return { ok: true };
}
