import { blockInfo, blockQuartersBetween, turnBlock } from "./blocks.ts";
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
 *
 * A BLOCK (a big piece, or a block that turns as one: `blocks.ts`) turns as a square and its
 * pieces move round it, so its four cells are one digit: the quarters its square is turned,
 * written at its top left cell, with 0 at the other three.
 */

/** The answer to a board as one digit a cell: how many quarter turns clockwise each piece needs, the fewest. Null when `solution` is not the board's pieces turned.
 *
 * @param layout - The decoded board with its dimensions, pipe masks and rule settings.
 * @param solution - The solved pipe masks in row-major cell order.
 * @returns The answer to a board as one digit a cell: how many quarter turns clockwise each piece needs, the fewest. null when `solution` is not the board's pieces turned.
 * @example
 * ```ts
 * import { SUIDO_5X5 } from "@johnmorrisdotca/suido/levels-5x5";
 * import { decodeLayout } from "@johnmorrisdotca/suido";
 * import { levelSolution, turnsOf } from "@johnmorrisdotca/suido/levels";
 *
 * const row = SUIDO_5X5[0];
 * const code = row[0];
 * const layout = decodeLayout(code)!;
 * const solution = levelSolution(row)!;
 * console.log(turnsOf(layout,solution));
 * ```
 */
export function turnsOf(layout: Layout, solution: readonly number[]): string | null {
  const info = blockInfo(layout);
  let out = "";
  for (let cell = 0; cell < layout.cells.length; cell += 1) {
    const at = info.of[cell]!;
    if (at >= 0) {
      const block = info.blocks[at]!;
      if (block.anchor !== cell) {
        out += "0";
        continue;
      }
      const around = blockQuartersBetween(layout.cells, solution, block);
      if (around === null) return null;
      out += around;
      continue;
    }
    const quarters = quartersBetween(layout.cells[cell]!, solution[cell]!);
    if (quarters === null) return null;
    out += quarters;
  }
  return out;
}

/** The board a row stands for, or null for a row whose code is not a board.
 *
 * @param row - The board code, quarter-turn digits and declared twists of one shipped level.
 * @returns The board a row stands for, or null for a row whose code is not a board.
 * @example
 * ```ts
 * import { SUIDO_5X5 } from "@johnmorrisdotca/suido/levels-5x5";
 * import { levelBoard } from "@johnmorrisdotca/suido/levels";
 *
 * const row = SUIDO_5X5[0];
 * console.log(levelBoard(row)?.width);
 * ```
 */
export function levelBoard(row: LevelRow): Layout | null {
  return decodeLayout(row[0]);
}

/** The pieces of a row's answer, each facing as the answer has it; null for a row that is not a board and its turns.
 *
 * @param row - The board code, quarter-turn digits and declared twists of one shipped level.
 * @returns The pieces of a row's answer, each facing as the answer has it; null for a row that is not a board and its turns.
 * @example
 * ```ts
 * import { SUIDO_5X5 } from "@johnmorrisdotca/suido/levels-5x5";
 * import { levelSolution } from "@johnmorrisdotca/suido/levels";
 *
 * const row = SUIDO_5X5[0];
 * console.log(levelSolution(row)?.length);
 * ```
 */
export function levelSolution(row: LevelRow): number[] | null {
  const layout = decodeLayout(row[0]);
  if (layout === null || row[1].length !== layout.cells.length || !/^[0-3]+$/.test(row[1])) return null;
  const info = blockInfo(layout);
  const out = layout.cells.map((mask, cell) => (info.of[cell]! >= 0 ? mask : turn(mask, Number(row[1][cell]))));
  for (const block of info.blocks) {
    const turned = turnBlock(layout.cells, block, Number(row[1][block.anchor]));
    for (const cell of block.cells) out[cell] = turned[cell]!;
  }
  return out;
}

/** A row's answer as a code, the board's own code with every piece facing as the answer has it: what `checkSuidoAnswer` is given. Null for a row that is not a board and its turns.
 *
 * @param row - The board code, quarter-turn digits and declared twists of one shipped level.
 * @returns A row's answer as a code, the board's own code with every piece facing as the answer has it: what `checkSuidoAnswer` is given. null for a row that is not a board and its turns.
 * @example
 * ```ts
 * import { SUIDO_5X5 } from "@johnmorrisdotca/suido/levels-5x5";
 * import { levelAnswer } from "@johnmorrisdotca/suido/levels";
 *
 * const row = SUIDO_5X5[0];
 * console.log(levelAnswer(row));
 * ```
 */
export function levelAnswer(row: LevelRow): string | null {
  const layout = decodeLayout(row[0]);
  const solution = levelSolution(row);
  return layout === null || solution === null ? null : encodeLayout({ ...layout, cells: solution });
}

/** The twists a row declares, in the order the levels teach them. A word that is no twist is dropped; `levels.test.ts` holds each row's list to its board.
 *
 * @param row - The board code, quarter-turn digits and declared twists of one shipped level.
 * @returns The twists a row declares, in the order the levels teach them. A word that is no twist is dropped; `levels.test.ts` holds each row's list to its board.
 * @example
 * ```ts
 * import { SUIDO_5X5 } from "@johnmorrisdotca/suido/levels-5x5";
 * import { declaredTwists } from "@johnmorrisdotca/suido/levels";
 *
 * const row = SUIDO_5X5[0];
 * console.log(declaredTwists(row));
 * ```
 */
export function declaredTwists(row: LevelRow): Twist[] {
  const words = new Set(row[2].split(" "));
  return SUIDO_TWISTS.filter((twist) => words.has(twist));
}
