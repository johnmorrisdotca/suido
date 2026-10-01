import { armsOf, SIDE_STEPS } from "./pieces.ts";

/**
 * LAYOUTS AS CODES. A board is one short string: its size, its flags, a colon,
 * and then one character for every cell, row by row.
 *
 *     5x5d:0b3a...        a 5 by 5 board, kind "drains", the cells that follow
 *
 * The flags are `d` for the drains kind, `i` for the inlet-outlet kind (without
 * either the board is a network) and `w` for a board whose edges join; written
 * in that order. A cell's character says which sides its piece opens on and, if
 * it is one, what it is:
 *
 *  - `0`–`9` and `a`–`f`: a piece opening on the sides of that number (0 is
 *    blank ground),
 *  - `g`–`v`: the same sixteen pieces, with the SOURCE the water comes from,
 *  - `A`–`P`: the same sixteen again, a DRAIN the water must reach.
 *
 * After the cells come two optional lists, each a semicolon, a letter and
 * numbers separated by commas, always in this order:
 *
 *     5x5dw:0b3a...;l3,17,22;w4,9
 *
 *  - `;l` the LOCKED pieces, by cell number: they cannot be turned,
 *  - `;w` the WALLS, by edge number (see `Layout.walls`): water cannot cross one.
 *
 * The same code writes an answer: the cells as they are turned when the board
 * is solved. So a code is also all a server needs to hear back to check a solve.
 */

/** What a board asks of the water. */
export type Kind = "network" | "drains" | "inlet-outlet";

/**
 * A board. `network`: every piece must end up wet, and no wet piece may open
 * on nothing. `drains`: every drain must be reached, and no wet piece may open
 * on nothing; a piece the water does not reach is a spare, and may face any way.
 * `inlet-outlet`: one pump and one drain, each an end piece; the water must run
 * from the one to the other through one unbranched path (every wet piece opens on
 * two sides and no more), with nothing left open. Spares may face any way.
 */
export type Layout = {
  width: number;
  height: number;
  kind: Kind;
  /** Whether the edges join: the east of the last column is the first, the south of the last row the top. */
  wrap: boolean;
  /** The sides each piece opens on, as the board is given or as it is turned; 0 is blank ground. */
  cells: number[];
  /** The cells the water comes from, in order. */
  sources: number[];
  /** The cells the water must reach, in order. */
  drains: number[];
  /**
   * The cells whose piece cannot be turned: it stays facing as the board gives it, which for an answer's
   * board is the way it faces in the answer. Ascending. Left out of a board that has none.
   */
  locked?: readonly number[];
  /**
   * The walls: edges between two cells that water cannot cross, so a piece opening on one runs out of
   * it as it does at the edge of the board. An edge is `cell * 2` for the wall on the east side of
   * `cell` and `cell * 2 + 1` for the one on its south side (for a board that wraps, the east of the
   * last column and the south of the last row are real edges). Ascending. Left out of a board that has none.
   */
  walls?: readonly number[];
};

/** The largest side a board may have. */
export const MAX_SIDE = 40;

const PLAIN = "0123456789abcdef";
const SOURCE = "ghijklmnopqrstuv";
const DRAIN = "ABCDEFGHIJKLMNOP";

/** A cell's character: its piece, marked as a source or a drain if it is one. */
export function cellChar(mask: number, role: "source" | "drain" | "plain" = "plain"): string {
  return (role === "source" ? SOURCE : role === "drain" ? DRAIN : PLAIN)[mask & 15]!;
}

/** The flag letter each kind but a network is written with. */
const KIND_FLAG: Record<Kind, string> = { network: "", drains: "d", "inlet-outlet": "i" };

/** The code of a board. */
export function encodeLayout(layout: Layout): string {
  const sources = new Set(layout.sources);
  const drains = new Set(layout.drains);
  const flags = `${KIND_FLAG[layout.kind]}${layout.wrap ? "w" : ""}`;
  const cells = layout.cells.map((mask, cell) => cellChar(mask, sources.has(cell) ? "source" : drains.has(cell) ? "drain" : "plain")).join("");
  const locked = layout.locked !== undefined && layout.locked.length > 0 ? `;l${layout.locked.join(",")}` : "";
  const walls = layout.walls !== undefined && layout.walls.length > 0 ? `;w${layout.walls.join(",")}` : "";
  return `${layout.width}x${layout.height}${flags}:${cells}${locked}${walls}`;
}

/** A list of numbers written with commas, ascending and without a repeat, each under `below`; or null. */
function numbersOf(text: string, below: number): number[] | null {
  if (!/^\d+(,\d+)*$/.test(text)) return null;
  const list = text.split(",").map(Number);
  for (let at = 0; at < list.length; at += 1) if (list[at]! >= below || (at > 0 && list[at]! <= list[at - 1]!)) return null;
  return list;
}

/** The board a code stands for, or null when it is not one: a bad size, an unknown character, a source or drain on bare ground, or no source at all. */
export function decodeLayout(code: string): Layout | null {
  if (typeof code !== "string") return null;
  const match = /^(\d{1,2})x(\d{1,2})([diw]{0,3}):([^;]+)(?:;l([\d,]+))?(?:;w([\d,]+))?$/.exec(code);
  if (match === null) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  const flags = match[3]!;
  const body = match[4]!;
  if (width < 2 || height < 2 || width > MAX_SIDE || height > MAX_SIDE || body.length !== width * height) return null;
  if (new Set(flags).size !== flags.length || (flags.includes("d") && flags.includes("i"))) return null;
  // The kind's letter comes before the wrap's.
  if (flags.includes("w") && !flags.endsWith("w")) return null;
  const wrap = flags.includes("w");
  if (wrap && (width < 3 || height < 3)) return null;
  const locked = match[5] === undefined ? null : numbersOf(match[5], width * height);
  if (match[5] !== undefined && locked === null) return null;
  const walls = match[6] === undefined ? null : numbersOf(match[6], width * height * 2);
  if (match[6] !== undefined && walls === null) return null;
  const cells: number[] = [];
  const sources: number[] = [];
  const drains: number[] = [];
  for (let at = 0; at < body.length; at += 1) {
    const char = body[at]!;
    let mask = PLAIN.indexOf(char);
    if (mask === -1) {
      mask = SOURCE.indexOf(char);
      if (mask !== -1) sources.push(at);
      else {
        mask = DRAIN.indexOf(char);
        if (mask === -1) return null;
        drains.push(at);
      }
      if (mask === 0) return null;
    }
    cells.push(mask);
  }
  if (sources.length === 0) return null;
  const kind: Kind = flags.includes("d") ? "drains" : flags.includes("i") ? "inlet-outlet" : "network";
  // An inlet and an outlet: one pump and one drain, each an end piece; the water runs from one to the other.
  if (kind === "inlet-outlet" && (sources.length !== 1 || drains.length !== 1 || armsOf(cells[sources[0]!]!) !== 1 || armsOf(cells[drains[0]!]!) !== 1)) return null;
  if (locked !== null && locked.some((cell) => cells[cell] === 0)) return null;
  if (walls !== null && walls.some((edge) => !wrap && (edge & 1) === 0 && (edge >> 1) % width === width - 1)) return null;
  if (walls !== null && walls.some((edge) => !wrap && (edge & 1) === 1 && (edge >> 1) >= width * (height - 1))) return null;
  const layout: Layout = { width, height, kind, wrap, cells, sources, drains };
  if (locked !== null) layout.locked = locked;
  if (walls !== null) layout.walls = walls;
  return layout;
}

/** Whether a piece is locked on this board. */
export function isLocked(layout: Pick<Layout, "locked">, cell: number): boolean {
  return layout.locked !== undefined && layout.locked.includes(cell);
}

/** The same board with its pieces facing as `masks` says, which is how a half-played board or an answer is kept. */
export function withMasks(layout: Layout, masks: readonly number[]): Layout {
  return { ...layout, cells: [...masks] };
}

/**
 * Which cell is next to each cell on each side: `table[cell * 4 + side]`, or -1
 * where there is no cell (the edge of a board that does not wrap) or a wall.
 */
export function neighboursOf(layout: Pick<Layout, "width" | "height" | "wrap"> & { walls?: readonly number[] }): Int32Array {
  const { width, height, wrap } = layout;
  const table = new Int32Array(width * height * 4).fill(-1);
  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      for (let side = 0; side < 4; side += 1) {
        let x = col + SIDE_STEPS[side]![0];
        let y = row + SIDE_STEPS[side]![1];
        if (wrap) {
          x = (x + width) % width;
          y = (y + height) % height;
        } else if (x < 0 || y < 0 || x >= width || y >= height) continue;
        table[(row * width + col) * 4 + side] = y * width + x;
      }
    }
  }
  for (const edge of layout.walls ?? []) {
    const cell = edge >> 1;
    const side = (edge & 1) === 0 ? 1 : 2;
    const next = table[cell * 4 + side]!;
    table[cell * 4 + side] = -1;
    if (next !== -1) table[next * 4 + ((side + 2) & 3)] = -1;
  }
  return table;
}
