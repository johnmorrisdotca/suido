import { decodeLayout, encodeLayout, isLocked, type Layout } from "./code.ts";
import { flowOf, type Flow } from "./flow.ts";
import { quartersBetween, shapeOf, turn } from "./pieces.ts";

/**
 * A game in play: the board as it was given, how every piece faces now, and
 * how far each has been turned in all (kept as a count rather than a facing,
 * so a drawing can turn a piece the way it was tapped, never the long way round).
 */
export type Game = {
  /** The board as it was first given. */
  start: Layout;
  /** The sides each piece opens on now. */
  masks: number[];
  /** Quarter turns clockwise each piece has had, counting a turn the other way as minus one. */
  quarters: number[];
  /** Taps that turned a piece. */
  turns: number;
};

/** A game on a board, with every piece as given. Null when the code is not a board. */
export function newGame(code: string): Game | null {
  const start = decodeLayout(code);
  if (start === null) return null;
  return { start, masks: [...start.cells], quarters: start.cells.map(() => 0), turns: 0 };
}

/** Whether a piece can be turned into a new facing: ground, and a cross, look the same turned any way. */
export function canTurn(mask: number): boolean {
  return shapeOf(mask) !== "blank" && shapeOf(mask) !== "cross";
}

/** Whether the piece on `cell` of a game can be turned: it is a piece that looks different turned, and it is not locked. */
export function canTurnAt(game: Game, cell: number): boolean {
  const mask = game.masks[cell];
  return mask !== undefined && canTurn(mask) && !isLocked(game.start, cell);
}

/**
 * A tap: the piece on `cell` turned a quarter, clockwise (`by` 1) or the other
 * way (`by` -1). Returns a new game. A cell that cannot be turned (bare ground, a
 * cross, a locked piece), or does not exist, leaves the game as it was.
 */
export function turnAt(game: Game, cell: number, by: 1 | -1 = 1): Game {
  const mask = game.masks[cell];
  if (mask === undefined || !canTurnAt(game, cell)) return game;
  const masks = [...game.masks];
  const quarters = [...game.quarters];
  masks[cell] = turn(mask, by);
  quarters[cell] = quarters[cell]! + by;
  return { ...game, masks, quarters, turns: game.turns + 1 };
}

/** The water on a game. */
export function flowOfGame(game: Game): Flow {
  return flowOf(game.start, game.masks);
}

/** Whether the game is solved: the same test the check makes of an answer. */
export function isGameSolved(game: Game): boolean {
  return flowOfGame(game).solved;
}

/** The game as a code, every piece facing as it does now: what to keep to come back to it, and what to send to be checked. */
export function gameCode(game: Game): string {
  return encodeLayout({ ...game.start, cells: game.masks });
}

/**
 * The fewest taps that would turn every piece to face as `answer` says, when
 * a tap turns a piece either way (`both`, the default) or clockwise only.
 */
export function tapsToAnswer(game: Game, answer: readonly number[], both = true): number {
  let total = 0;
  for (let cell = 0; cell < game.masks.length; cell += 1) {
    const quarters = quartersBetween(game.masks[cell]!, answer[cell]!);
    if (quarters === null) return Number.POSITIVE_INFINITY;
    total += both ? Math.min(quarters, (4 - quarters) % 4) : quarters;
  }
  return total;
}

/**
 * A piece to turn, for a player who asks for help: the first piece that does
 * not face as `answer` says, nearest the pump first (the water's own order), or
 * null when every piece does. In a drains board a spare piece is never one.
 */
export function hintFor(game: Game, answer: readonly number[]): number | null {
  const flow = flowOf(game.start, answer);
  const order = [...Array(game.masks.length).keys()].sort((a, b) => (flow.depth[a]! === -1 ? Infinity : flow.depth[a]!) - (flow.depth[b]! === -1 ? Infinity : flow.depth[b]!));
  for (const cell of order) {
    if (flow.wet[cell] !== true && game.start.kind === "drains") continue;
    if (game.masks[cell] !== answer[cell]) return cell;
  }
  return null;
}

/**
 * A game half played, as a short string to keep: one digit for each piece (the quarter turns clockwise it has had
 * from the way the board gave it, 0 to 3), a colon, and the number of taps made. `gameFromProgress` brings it back.
 */
export function gameProgress(game: Game): string {
  return `${game.quarters.map((quarters) => ((quarters % 4) + 4) % 4).join("")}:${game.turns}`;
}

/** The game a board's code and a kept `gameProgress` make, or null when the code is not a board or the progress is not one of that board's. */
export function gameFromProgress(code: string, progress: string): Game | null {
  const game = newGame(code);
  const match = /^([0-3]*):(\d+)$/.exec(progress);
  if (game === null || match === null || match[1]!.length !== game.masks.length) return null;
  const quarters = [...match[1]!].map(Number);
  return { ...game, masks: game.masks.map((mask, cell) => turn(mask, quarters[cell])), quarters, turns: Number(match[2]) };
}
