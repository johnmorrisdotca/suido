import { SIDE_STEPS } from "./pieces.ts";

/**
 * LAYOUTS AS CODES. A board is one short string: its size, its flags, a colon,
 * and then one character for every cell, row by row.
 *
 *     5x5d:0b3a...        a 5 by 5 board, kind "drains", the cells that follow
 *
 * The flags are `d` for the drains kind (without it the board is a network) and
 * `w` for a board whose edges join; written in that order. A cell's character
 * says which sides its piece opens on and, if it is one, what it is:
 *
 *  - `0`–`9` and `a`–`f`: a piece opening on the sides of that number (0 is
 *    blank ground),
 *  - `g`–`v`: the same sixteen pieces, with the SOURCE the water comes from,
 *  - `A`–`P`: the same sixteen again, a DRAIN the water must reach.
 *
 * The same code writes an answer: the cells as they are turned when the board
 * is solved. So a code is also all a server needs to hear back to check a solve.
 */

/** What a board asks of the water. */
export type Kind = "network" | "drains";

/**
 * A board. `network`: every piece must end up wet, and no wet piece may open
 * on nothing. `drains`: every drain must be reached, and no wet piece may open
 * on nothing; a piece the water does not reach is a spare, and may face any way.
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

/** The code of a board. */
export function encodeLayout(layout: Layout): string {
  const sources = new Set(layout.sources);
  const drains = new Set(layout.drains);
  const flags = `${layout.kind === "drains" ? "d" : ""}${layout.wrap ? "w" : ""}`;
  const cells = layout.cells.map((mask, cell) => cellChar(mask, sources.has(cell) ? "source" : drains.has(cell) ? "drain" : "plain")).join("");
  return `${layout.width}x${layout.height}${flags}:${cells}`;
}

/** The board a code stands for, or null when it is not one: a bad size, an unknown character, a source or drain on bare ground, or no source at all. */
export function decodeLayout(code: string): Layout | null {
  if (typeof code !== "string") return null;
  const match = /^(\d{1,2})x(\d{1,2})([dw]{0,2}):(.+)$/.exec(code);
  if (match === null) return null;
  const width = Number(match[1]);
  const height = Number(match[2]);
  const flags = match[3]!;
  const body = match[4]!;
  if (width < 2 || height < 2 || width > MAX_SIDE || height > MAX_SIDE || body.length !== width * height) return null;
  if (new Set(flags).size !== flags.length) return null;
  const wrap = flags.includes("w");
  if (wrap && (width < 3 || height < 3)) return null;
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
  return { width, height, kind: flags.includes("d") ? "drains" : "network", wrap, cells, sources, drains };
}

/** The same board with its pieces facing as `masks` says, which is how a half-played board or an answer is kept. */
export function withMasks(layout: Layout, masks: readonly number[]): Layout {
  return { ...layout, cells: [...masks] };
}

/**
 * Which cell is next to each cell on each side: `table[cell * 4 + side]`, or -1
 * where there is no cell (the edge of a board that does not wrap).
 */
export function neighboursOf(layout: Pick<Layout, "width" | "height" | "wrap">): Int32Array {
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
  return table;
}
