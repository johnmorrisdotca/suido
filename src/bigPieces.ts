import { blockCells, turnBlock } from "./blocks.ts";
import type { Random } from "./random.ts";
import { shuffled } from "./random.ts";

/**
 * THE BIG PIECES: squares of four cells that are one piece (`Layout.bigs`). There
 * are five, each given facing north as the four masks of its cells, clockwise from
 * the top left (`blocks.ts`). Each is a single pipe of the board's own size run
 * through four cells, or two side by side, so every opening of a big piece is the
 * opening of one of its cells, on the middle of that cell's edge: up to eight,
 * two on each side of the square.
 *
 *     end        one opening: a pipe that goes in, round the square, and stops
 *     hairpin    two openings, side by side on one side: a pipe that goes in and comes straight back out
 *     straight   four openings, two on each of two opposite sides: two pipes side by side
 *     elbow      four openings, two on each of two sides that meet: two pipes side by side, one bending inside the other
 *     tee        six openings, two on each of three sides: one pipe straight through, the other branching out to the side
 *
 * A big piece is turned in place a quarter at a time, and faces any of its four
 * turns (two for a straight): turning moves the piece in each cell round to the
 * next and turns it a quarter, as `turnBlock` does.
 */
export const BIG_KINDS = {
  end: [3, 12, 9, 2],
  hairpin: [5, 5, 9, 3],
  straight: [5, 5, 5, 5],
  elbow: [5, 3, 10, 3],
  tee: [5, 7, 7, 5],
} as const;

/** The name of a kind of big piece. */
export type BigKind = keyof typeof BIG_KINDS;

/** Every kind of big piece, in the order the generator draws them, with how often each is drawn. */
export const BIG_KIND_LIST: readonly BigKind[] = ["end", "hairpin", "hairpin", "straight", "elbow", "elbow", "tee"];

/** The masks of a big piece's four cells (clockwise from the top left) once it has been turned `quarters` quarters clockwise from facing north. */
export function bigMasksOf(kind: BigKind, quarters: number): number[] {
  const cells = [0, 1, 2, 3];
  const from = [...BIG_KINDS[kind]];
  const turned = turnBlock(from, { index: 0, anchor: 0, big: true, cells: [0, 1, 2, 3] }, quarters);
  return cells.map((cell) => turned[cell]!);
}

/**
 * Which kind of big piece four masks make, and the fewest quarters clockwise from facing north that bring it
 * to them; null for four masks that are none of the five.
 */
export function bigKindOf(masks: readonly number[]): { kind: BigKind; quarters: number } | null {
  for (const kind of Object.keys(BIG_KINDS) as BigKind[]) {
    for (let quarters = 0; quarters < 4; quarters += 1) {
      const turned = bigMasksOf(kind, quarters);
      if (turned.every((mask, at) => mask === masks[at])) return { kind, quarters };
    }
  }
  return null;
}

/** A block placed on a board by the generator. */
export type Placed = { anchor: number; kind: BigKind | null; quarters: number };

/**
 * Places blocks on a board of `width` by `height`, where `near` is the table of neighbours with no walls
 * (`neighboursOf`): `bigs` big pieces, each of a kind drawn at random facing a way that has no opening
 * off the edge of the board, and `turning` blocks that turn as one. No two overlap, no big piece touches
 * another big piece along a side, and none stands across the edge of a board that wraps. Fewer are placed
 * where the board has no room for them.
 */
export function placeBlocks(near: Int32Array, width: number, height: number, bigs: number, turning: number, random: Random): Placed[] {
  const anchors: number[] = [];
  for (let row = 0; row < height - 1; row += 1) for (let col = 0; col < width - 1; col += 1) anchors.push(row * width + col);
  const taken = new Uint8Array(width * height);
  const placed: Placed[] = [];
  const touches = (cells: readonly number[]): boolean => cells.some((cell) => taken[cell] === 1);
  const beside = (cells: readonly number[]): boolean =>
    cells.some((cell) => [0, 1, 2, 3].some((side) => {
      const next = near[cell * 4 + side]!;
      return next !== -1 && !cells.includes(next) && taken[next] === 1;
    }));
  const queue = shuffled(anchors, random);
  const want: (BigKind | null)[] = [...Array.from({ length: bigs }, () => BIG_KIND_LIST[Math.floor(random() * BIG_KIND_LIST.length)]!), ...Array.from({ length: turning }, () => null)];
  for (const kind of want) {
    for (let at = 0; at < queue.length; at += 1) {
      const anchor = queue[at]!;
      const cells = blockCells(anchor, width);
      if (touches(cells) || (kind !== null && beside(cells))) continue;
      let quarters = Math.floor(random() * 4);
      if (kind !== null) {
        // A way to face with no opening off the edge of the board, and none towards a block already placed.
        const ways = shuffled([0, 1, 2, 3], random).filter((way) => openingsFit(near, cells, bigMasksOf(kind, way), taken));
        if (ways.length === 0) continue;
        quarters = ways[0]!;
      }
      for (const cell of cells) taken[cell] = 1;
      queue.splice(at, 1);
      placed.push({ anchor, kind, quarters });
      break;
    }
  }
  return placed.sort((a, b) => a.anchor - b.anchor);
}

/** Whether every opening of a big piece's cells, facing as `masks` say, has a cell beside it that is not another block's. */
function openingsFit(near: Int32Array, cells: readonly number[], masks: readonly number[], taken: Uint8Array): boolean {
  for (let at = 0; at < 4; at += 1) {
    const cell = cells[at]!;
    for (let side = 0; side < 4; side += 1) {
      if (((masks[at]! >> side) & 1) === 0) continue;
      const next = near[cell * 4 + side]!;
      if (cells.includes(next)) continue;
      if (next === -1 || taken[next] === 1) return false;
    }
  }
  return true;
}
