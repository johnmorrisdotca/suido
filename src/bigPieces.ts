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

/**
 * Which big pieces a generator draws from, from the plainest to every one there is:
 *
 *  - `five`: the five kinds of `BIG_KINDS`, as it always has, so a seed makes the board it made before,
 *  - `simple`: the shapes of one or two pipes with at most four openings in all: a snake, a hairpin, two pipes side by side, a pipe through with a stub,
 *  - `more`: every shape of one or two pipes, up to eight openings: crossings and tees inside a plate, one pipe beside another,
 *  - `all`: every family of `BIG_SHAPES` equally often, three pipes in one plate included.
 *
 * Each of the last three draws a family of its own shapes equally often, then a shape of the family.
 */
export type BigMix = "five" | "simple" | "more" | "all";

/** The mixes a generator draws a plate from, plainest first. */
export const BIG_MIXES: readonly BigMix[] = ["five", "simple", "more", "all"];

/** Whether a shape belongs to a mix of the shapes (`BigMix`, not `five`). */
export function inBigMix(shape: Pick<BigShape, "pipes" | "openings">, mix: BigMix): boolean {
  if (mix === "simple") return shape.pipes <= 2 && shape.openings <= 4;
  if (mix === "more") return shape.pipes <= 2;
  return mix === "all";
}

/** How many times a plate that fits nowhere is drawn again before it is given up on. */
const REDRAWS = 12;

const POOLS = new Map<BigMix, { family: string; shapes: BigShape[] }[]>();

/** A shape drawn from a mix: a family of it at random, then a shape of the family. */
function drawShape(random: Random, mix: BigMix): string {
  let families = POOLS.get(mix);
  if (families === undefined) {
    const kept = BIG_SHAPES.filter((shape) => inBigMix(shape, mix));
    families = BIG_FAMILIES.map((family) => ({ family: family.family, shapes: kept.filter((shape) => shape.family === family.family) })).filter((family) => family.shapes.length > 0);
    POOLS.set(mix, families);
  }
  const family = families[Math.floor(random() * families.length)]!;
  return family.shapes[Math.floor(random() * family.shapes.length)]!.id;
}

/** The masks of a big piece's four cells (clockwise from the top left) once it has been turned `quarters` quarters clockwise from facing north. */
export function bigMasksOf(kind: BigKind | string, quarters: number): number[] {
  const cells = [0, 1, 2, 3];
  const shape = kind in BIG_KINDS ? undefined : SHAPE_BY_ID.get(kind);
  if (shape === undefined && !(kind in BIG_KINDS)) throw new Error(`No big piece is called ${kind}.`);
  const from = shape === undefined ? [...BIG_KINDS[kind as BigKind]] : [...shape.masks];
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

/**
 * EVERY BIG PIECE THERE CAN BE. A big piece is four cells, each a small piece of its own, that are joined across the inside
 * wherever both open towards each other and are not joined where neither does (`isJoinedInside`). So what four one-cell pieces
 * can make side by side, a plate can: a cell with a cross in it, a corner next to a straight, two pipes that never meet, a tee
 * beside an end. Each cell opens on at least one side, no four cells are all joined round the middle (the water would go round
 * in a ring), and every pipe inside has an opening to the outside. That is 699 shapes up to turning, and `BIG_SHAPES` lists
 * every one, the five `BIG_KINDS` among them.
 *
 * A PIPE here is a run of joined cells, and the water in one does not reach another: two pipes side by side are two, however
 * close. A plate has one, two or three, with one to eight openings in all, at most two on each side. A FAMILY is the plates
 * with the same openings on their pipes, written largest first (`3+2` is a pipe with three openings and one with two).
 */
export type BigShape = {
  /** The four masks, hex, of the shape's first facing in order of the masks: the same in every facing a plate is turned to. */
  id: string;
  /** The four cells' masks clockwise from the top left, in the facing that gives the least `id`. */
  masks: readonly [number, number, number, number];
  /** How many separate pipes the plate holds, 1 to 3. */
  pipes: number;
  /** How many openings to the outside, 1 to 8. */
  openings: number;
  /** The openings on each pipe, largest first and joined by `+`: `4`, `2+2`, `3+1+1`. */
  family: string;
  /** The kind of `BIG_KINDS` it is, or null for one of the other shapes. */
  named: BigKind | null;
};

/** The sides of each cell of a 2 by 2 square that face the outside, clockwise from the top left cell: north and west, north and east, east and south, south and west. */
const OUTSIDE_SIDES = [[0, 3], [0, 1], [1, 2], [2, 3]] as const;

/** The four edges inside a square: between the top two cells, the right two, the bottom two and the left two, as the two cells and the side of each that faces the other. */
const INSIDE_EDGES = [[0, 1, 1, 3], [1, 2, 2, 0], [3, 2, 1, 3], [0, 3, 2, 0]] as const;

const SQUARE = { index: 0, anchor: 0, big: true, cells: [0, 1, 2, 3] } as const;

/** The key of four masks that stands for every facing of a plate: the least of the four turns, as hex digits. */
function turnedKey(masks: readonly number[]): { key: string; masks: number[] } {
  let best: { key: string; masks: number[] } | null = null;
  for (let quarters = 0; quarters < 4; quarters += 1) {
    const turned = turnBlock(masks, SQUARE, quarters);
    const key = turned.map((mask) => mask.toString(16)).join("");
    if (best === null || key < best.key) best = { key, masks: turned };
  }
  return best!;
}

/** The openings to the outside of each pipe of four masks, largest first; the pipes being the runs of cells joined inside. */
function pipesOf(masks: readonly number[]): number[] {
  const root = [0, 1, 2, 3];
  const find = (cell: number): number => (root[cell] === cell ? cell : (root[cell] = find(root[cell]!)));
  for (const [a, b, sideA, sideB] of INSIDE_EDGES) if (((masks[a]! >> sideA) & 1) === 1 && ((masks[b]! >> sideB) & 1) === 1) root[find(a)] = find(b);
  const openings = new Map<number, number>();
  for (let cell = 0; cell < 4; cell += 1) {
    const out = OUTSIDE_SIDES[cell]!.filter((side) => ((masks[cell]! >> side) & 1) === 1).length;
    openings.set(find(cell), (openings.get(find(cell)) ?? 0) + out);
  }
  return [...openings.values()].sort((a, b) => b - a);
}

function shapesOf(): BigShape[] {
  const found = new Map<string, BigShape>();
  const named = new Map<string, BigKind>(Object.keys(BIG_KINDS).map((kind) => [turnedKey([...BIG_KINDS[kind as BigKind]]).key, kind as BigKind]));
  for (let joins = 1; joins < 16; joins += 1) {
    const edges = INSIDE_EDGES.filter((_, at) => ((joins >> at) & 1) === 1);
    // Four joins would close the pipe in a ring the water goes round, which the generator's forests have no way to make.
    if (edges.length === 4) continue;
    for (let outside = 0; outside < 256; outside += 1) {
      const masks = [0, 0, 0, 0];
      for (const [a, b, sideA, sideB] of edges) {
        masks[a] = masks[a]! | (1 << sideA);
        masks[b] = masks[b]! | (1 << sideB);
      }
      for (let cell = 0; cell < 4; cell += 1) for (let at = 0; at < 2; at += 1) if (((outside >> (cell * 2 + at)) & 1) === 1) masks[cell] = masks[cell]! | (1 << OUTSIDE_SIDES[cell]![at]!);
      // Every cell is a piece, and every pipe has a way in.
      if (masks.some((mask) => mask === 0)) continue;
      const pipes = pipesOf(masks);
      if (pipes.some((openings) => openings === 0)) continue;
      const { key, masks: turned } = turnedKey(masks);
      if (found.has(key)) continue;
      found.set(key, { id: key, masks: turned as unknown as BigShape["masks"], pipes: pipes.length, openings: pipes.reduce((sum, openings) => sum + openings, 0), family: pipes.join("+"), named: named.get(key) ?? null });
    }
  }
  return [...found.values()].sort((a, b) => a.pipes - b.pipes || a.openings - b.openings || (a.family < b.family ? 1 : a.family > b.family ? -1 : 0) || (a.id < b.id ? -1 : 1));
}

/** Every big piece there is, up to turning (`BigShape`): 699, ordered by how many pipes they hold, then how many openings they have, then family. */
export const BIG_SHAPES: readonly BigShape[] = shapesOf();

/** The families of `BIG_SHAPES`, each with how many shapes it holds, in the order they first appear there. */
export const BIG_FAMILIES: readonly { family: string; pipes: number; openings: number; shapes: number }[] = (() => {
  const out = new Map<string, { family: string; pipes: number; openings: number; shapes: number }>();
  for (const shape of BIG_SHAPES) {
    const kept = out.get(shape.family) ?? { family: shape.family, pipes: shape.pipes, openings: shape.openings, shapes: 0 };
    kept.shapes += 1;
    out.set(shape.family, kept);
  }
  return [...out.values()];
})();

const SHAPE_BY_ID = new Map(BIG_SHAPES.map((shape) => [shape.id, shape]));

/** The shape with this id, or undefined for four masks that make none. */
export function bigShapeById(id: string): BigShape | undefined {
  return SHAPE_BY_ID.get(id);
}

/**
 * Which shape four masks make, and the fewest quarters clockwise from the shape's own facing (`BigShape.masks`) that bring it to them;
 * null for four masks that are none of the 699: a blank cell, a ring, a pipe with no opening to the outside.
 */
export function bigShapeOf(masks: readonly number[]): { shape: BigShape; quarters: number } | null {
  if (masks.length !== 4) return null;
  const shape = SHAPE_BY_ID.get(turnedKey(masks).key);
  if (shape === undefined) return null;
  for (let quarters = 0; quarters < 4; quarters += 1) if (turnBlock(shape.masks, SQUARE, quarters).every((mask, at) => mask === masks[at])) return { shape, quarters };
  return null;
}

/** A block placed on a board by the generator: `kind` is a kind of `BIG_KINDS` or the id of a `BigShape`, and null for a block that turns as one. */
export type Placed = { anchor: number; kind: string | null; quarters: number };

/**
 * Places blocks on a board of `width` by `height`, where `near` is the table of neighbours with no walls
 * (`neighboursOf`): `bigs` big pieces, each of a kind drawn at random facing a way that has no opening
 * off the edge of the board, and `turning` blocks that turn as one. No two overlap, no big piece touches
 * another big piece along a side, and none stands across the edge of a board that wraps. Fewer are placed
 * where the board has no room for them.
 */
export function placeBlocks(near: Int32Array, width: number, height: number, bigs: number, turning: number, random: Random, mix: BigMix = "five"): Placed[] {
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
  const want: (string | null)[] = [...Array.from({ length: bigs }, () => (mix !== "five" ? drawShape(random, mix) : BIG_KIND_LIST[Math.floor(random() * BIG_KIND_LIST.length)]!)), ...Array.from({ length: turning }, () => null)];
  for (const wanted of want) {
    // A shape drawn from all of them that fits nowhere is drawn again, a few times: the many-opening ones need room the board may not have.
    const draws = mix !== "five" && wanted !== null ? REDRAWS : 1;
    let kind = wanted;
    for (let draw = 0; draw < draws; draw += 1) {
      if (draw > 0) kind = drawShape(random, mix);
      let done = false;
      for (let at = 0; at < queue.length && !done; at += 1) {
        const anchor = queue[at]!;
        const cells = blockCells(anchor, width);
        if (touches(cells) || (kind !== null && beside(cells))) continue;
        let quarters = Math.floor(random() * 4);
        const big = kind;
        if (big !== null) {
          // A way to face with no opening off the edge of the board, and none towards a block already placed.
          const ways = shuffled([0, 1, 2, 3], random).filter((way) => openingsFit(near, cells, bigMasksOf(big, way), taken));
          if (ways.length === 0) continue;
          quarters = ways[0]!;
        }
        for (const cell of cells) taken[cell] = 1;
        queue.splice(at, 1);
        placed.push({ anchor, kind, quarters });
        done = true;
      }
      if (done) break;
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

/** One big piece on a board: its top left cell, which of the 699 shapes it is, and how many quarters clockwise from the shape's own facing it is turned. */
export type BigOnBoard = { anchor: number; shape: BigShape; quarters: number };

/**
 * The big pieces of a board and which shape each is, read from `masks` (one for every cell of the board, as a board's pieces or an
 * answer's stand): the board's pieces for the facing it starts in, an answer's for the facing the water needs. A big piece whose four
 * masks make none of the shapes is left out, which no board that decodes has.
 */
export function bigShapesIn(layout: { width: number; bigs?: readonly number[] }, masks: readonly number[]): BigOnBoard[] {
  const out: BigOnBoard[] = [];
  for (const anchor of layout.bigs ?? []) {
    const found = bigShapeOf([anchor, anchor + 1, anchor + layout.width + 1, anchor + layout.width].map((cell) => masks[cell]!));
    if (found !== null) out.push({ anchor, shape: found.shape, quarters: found.quarters });
  }
  return out;
}
