import { describe, expect, it } from "vitest";

import { decodeLayout } from "./code.ts";
import { makeUnscored } from "./generate.ts";
import { levelAnswer, levelSolution, turnsOf } from "./levelRow.ts";
import { checkSuidoAnswer } from "./check.ts";
import { flowOf } from "./flow.ts";

/** A row keeps an answer as one digit a cell, and a square of four cells (a big piece, or a block that turns as one) as one digit at its top left cell. */
describe("a level row's answer", () => {
  it("is one digit a cell for a board of pieces that turn one by one", () => {
    const made = makeUnscored({ size: 6, seed: 5 });
    const turns = turnsOf(made.layout, made.solution)!;
    expect(turns).toHaveLength(36);
    expect(levelSolution([made.code, turns, ""])).toEqual(made.solution);
  });

  it("is a quarter turn of each square at its top left cell for big pieces and blocks, and 0 at the other three", () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const made = makeUnscored({ size: 9, bigs: 3, blocks: 2, bigKinds: "all", seed: seed * 31 });
      const layout = made.layout;
      const turns = turnsOf(layout, made.solution)!;
      expect(turns, `seed ${seed}`).not.toBeNull();
      expect(turns).toMatch(/^[0-3]+$/);
      const squares = [...(layout.bigs ?? []), ...(layout.blocks ?? [])];
      expect(squares.length).toBeGreaterThan(0);
      for (const anchor of squares) for (const cell of [anchor + 1, anchor + layout.width, anchor + layout.width + 1]) expect(turns[cell], `seed ${seed}, cell ${cell}`).toBe("0");
      const row = [made.code, turns, ""] as const;
      const back = levelSolution(row)!;
      expect(flowOf(layout, back).solved, `seed ${seed}`).toBe(true);
      // The same answer as the maker's on every piece the water goes through.
      const flow = flowOf(layout, made.solution);
      for (let cell = 0; cell < back.length; cell += 1) if (flow.wet[cell] === true) expect(back[cell], `seed ${seed}, cell ${cell}`).toBe(made.solution[cell]);
      expect(checkSuidoAnswer(made.code, levelAnswer(row)!)).toEqual({ ok: true });
      expect(decodeLayout(levelAnswer(row)!)).not.toBeNull();
    }
  });

  it("is refused for turns that are not digits for the board, or an answer that is not the board's pieces turned", () => {
    const made = makeUnscored({ size: 6, seed: 5 });
    expect(levelSolution([made.code, "01", ""])).toBeNull();
    expect(levelSolution([made.code, "x".repeat(36), ""])).toBeNull();
    expect(turnsOf(made.layout, made.layout.cells.map((mask) => (mask === 0 ? 5 : 0)))).toBeNull();
  });
});
