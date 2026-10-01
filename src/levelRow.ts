import { decodeLayout, encodeLayout, type Layout } from "./code.ts";
import type { LevelRow } from "./levelCounts.ts";
import { quartersBetween, turn } from "./pieces.ts";
import { SUIDO_TWISTS, type Twist } from "./twists.ts";

/**
 * A LEVEL ROW READ: the board a row's code stands for, its one answer, and its
 * twists. A row keeps its answer as one digit for each cell, the quarter turns
 * clockwise from the way the board gives that piece to the way the answer has it
 * (0 to 3; a straight or a cross that looks the same turned is written with the
 * fewest), so a size's file is half the length it would be with every answer a code.
 */

/** The answer to a board as one digit a cell: how many quarter turns clockwise each piece needs, the fewest. Null when `solution` is not the board's pieces turned. */
export function turnsOf(layout: Layout, solution: readonly number[]): string | null {
  let out = "";
  for (let cell = 0; cell < layout.cells.length; cell += 1) {
    const quarters = quartersBetween(layout.cells[cell]!, solution[cell]!);
    if (quarters === null) return null;
    out += quarters;
  }
  return out;
}

/** The board a row stands for, or null for a row whose code is not a board. */
export function levelBoard(row: LevelRow): Layout | null {
  return decodeLayout(row[0]);
}

/** The pieces of a row's answer, each facing as the answer has it; null for a row that is not a board and its turns. */
export function levelSolution(row: LevelRow): number[] | null {
  const layout = decodeLayout(row[0]);
  if (layout === null || row[1].length !== layout.cells.length || !/^[0-3]+$/.test(row[1])) return null;
  return layout.cells.map((mask, cell) => turn(mask, Number(row[1][cell])));
}

/** A row's answer as a code, the board's own code with every piece facing as the answer has it: what `checkSuidoAnswer` is given. Null for a row that is not a board and its turns. */
export function levelAnswer(row: LevelRow): string | null {
  const layout = decodeLayout(row[0]);
  const solution = levelSolution(row);
  return layout === null || solution === null ? null : encodeLayout({ ...layout, cells: solution });
}

/** The twists a row declares, in the order the levels teach them. A word that is no twist is dropped; `levels.test.ts` holds each row's list to its board. */
export function declaredTwists(row: LevelRow): Twist[] {
  const words = new Set(row[2].split(" "));
  return SUIDO_TWISTS.filter((twist) => words.has(twist));
}
