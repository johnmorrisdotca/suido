import { blockAt, blockInfo, blockQuartersBetween, canTurnBlock, turnBlock } from "./blocks.ts";
import { decodeLayout, encodeLayout, isLocked, type Layout } from "./code.ts";
import { flowOf, type Flow } from "./flow.ts";
import { quartersBetween, shapeOf, turn } from "./pieces.ts";

/**
 * A game in play: the board as it was given, how every piece faces now, and
 * how far each has been turned in all (kept as a count rather than a facing,
 * so a drawing can turn a piece the way it was tapped, never the long way round).
 *
 * `masks` is by where a piece is now; `quarters` is by the cell the piece was
 * given in. They are the same cell for every piece but those in a block that
 * turns as one (`blocks.ts`), which move round their block: the four pieces of
 * a block all have the quarters the block has been turned.
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

/**
 * Whether a tap on `cell` of a game turns anything. On a piece of its own: it looks different turned, and it
 * is not locked. In a block (`blocks.ts`): turning the block changes how its four pieces face.
 */
export function canTurnAt(game: Game, cell: number): boolean {
  const mask = game.masks[cell];
  if (mask === undefined) return false;
  const block = blockAt(game.start, cell);
  if (block !== null) return canTurnBlock(game.masks, block);
  return canTurn(mask) && !isLocked(game.start, cell);
}

/**
 * A tap: the piece on `cell` turned a quarter, clockwise (`by` 1) or the other
 * way (`by` -1); a cell in a block turns the whole block, its pieces moving round
 * to the next cell as they turn. Returns a new game. A cell that cannot be turned
 * (bare ground, a cross, a locked piece), or does not exist, leaves the game as it was.
 */
export function turnAt(game: Game, cell: number, by: 1 | -1 = 1): Game {
  const mask = game.masks[cell];
  if (mask === undefined || !canTurnAt(game, cell)) return game;
  const block = blockAt(game.start, cell);
  if (block !== null) {
    const turned = [...game.quarters];
    for (const inside of block.cells) turned[inside] = turned[inside]! + by;
    return { ...game, masks: turnBlock(game.masks, block, by), quarters: turned, turns: game.turns + 1 };
  }
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
  const info = blockInfo(game.start);
  for (const block of info.blocks) {
    const quarters = blockQuartersBetween(game.masks, answer, block);
    if (quarters === null) return Number.POSITIVE_INFINITY;
    total += both ? Math.min(quarters, (4 - quarters) % 4) : quarters;
  }
  for (let cell = 0; cell < game.masks.length; cell += 1) {
    if (info.of[cell]! >= 0) continue;
    const quarters = quartersBetween(game.masks[cell]!, answer[cell]!);
    if (quarters === null) return Number.POSITIVE_INFINITY;
    total += both ? Math.min(quarters, (4 - quarters) % 4) : quarters;
  }
  return total;
}

/**
 * A piece to turn, for a player who asks for help: the first piece that does
 * not face as `answer` says, nearest the pump first (the water's own order), or
 * null when every piece does. In a drains board a spare piece is never one. In a
 * block it is the block's anchor, the top left cell, whichever piece is out of place.
 */
export function hintFor(game: Game, answer: readonly number[]): number | null {
  const flow = flowOf(game.start, answer);
  const order = [...Array(game.masks.length).keys()].sort((a, b) => (flow.depth[a]! === -1 ? Infinity : flow.depth[a]!) - (flow.depth[b]! === -1 ? Infinity : flow.depth[b]!));
  for (const cell of order) {
    if (flow.wet[cell] !== true && game.start.kind === "drains") continue;
    if (game.masks[cell] !== answer[cell]) return blockAt(game.start, cell)?.anchor ?? cell;
  }
  return null;
}

/**
 * What a Hint does: the piece at `cell` turned clockwise, as many taps as it takes, to face as `answer` says; a block, the whole
 * block, whichever of its cells is named. A game with that piece already right, or one whose answer is not the piece turned, is returned as it was.
 */
export function turnedToFaceAt(game: Game, cell: number, answer: readonly number[]): Game {
  const block = blockAt(game.start, cell);
  const quarters = block === null ? quartersBetween(game.masks[cell]!, answer[cell]!) : blockQuartersBetween(game.masks, answer, block);
  let next = game;
  for (let each = 0; each < (quarters ?? 0); each += 1) next = turnAt(next, cell, 1);
  return next;
}

/**
 * A game half played, as a short string to keep: one digit for each piece (the quarter turns clockwise it has had
 * from the way the board gave it, 0 to 3; the four pieces of a block have the digit of the block), a colon, and the
 * number of taps made. `gameFromProgress` brings it back.
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
  const info = blockInfo(game.start);
  let masks = game.masks.map((mask, cell) => (info.of[cell]! >= 0 ? mask : turn(mask, quarters[cell])));
  for (const block of info.blocks) {
    const first = quarters[block.cells[0]]!;
    if (block.cells.some((cell) => quarters[cell] !== first)) return null;
    masks = turnBlock(masks, block, first);
  }
  return { ...game, masks, quarters, turns: Number(match[2]) };
}

/**
 * A game from a board's code and the code of the board as it was left (`gameCode`): every piece facing as the kept
 * code says, with the fewest quarters clockwise that get each there. Null when the kept code is not the same board
 * with its pieces turned: a piece changed, a pump or a drain moved, a locked piece turned, a block with one piece
 * turned alone. How many taps it took to get there is not in a code, so `turns` is 0.
 */
export function gameFromCode(code: string, kept: string): Game | null {
  const game = newGame(code);
  const left = decodeLayout(kept);
  const dealt = game?.start;
  if (game === null || dealt === undefined || left === null || left.width !== dealt.width || left.height !== dealt.height || left.kind !== dealt.kind || left.wrap !== dealt.wrap) return null;
  if (left.sources.join() !== dealt.sources.join() || left.drains.join() !== dealt.drains.join()) return null;
  for (const list of ["locked", "walls", "bigs", "blocks"] as const) if ((left[list] ?? []).join() !== (dealt[list] ?? []).join()) return null;
  const info = blockInfo(dealt);
  const quarters = dealt.cells.map(() => 0);
  for (const block of info.blocks) {
    const turned = blockQuartersBetween(dealt.cells, left.cells, block);
    if (turned === null) return null;
    for (const cell of block.cells) quarters[cell] = turned;
  }
  for (let cell = 0; cell < dealt.cells.length; cell += 1) {
    if (info.of[cell]! >= 0) continue;
    const turned = quartersBetween(dealt.cells[cell]!, left.cells[cell]!);
    if (turned === null || (isLocked(dealt, cell) && turned !== 0)) return null;
    quarters[cell] = turned;
  }
  return { ...game, masks: [...left.cells], quarters, turns: 0 };
}
