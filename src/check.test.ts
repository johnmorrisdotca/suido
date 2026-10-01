import { describe, expect, it } from "vitest";

import { checkSuidoAnswer } from "./check.ts";
import { decodeLayout, encodeLayout } from "./code.ts";
import { makeUnscored } from "./generate.ts";
import { flowOf } from "./flow.ts";
import { rotationsOf, turn } from "./pieces.ts";

const boards = [
  makeUnscored({ size: 6, seed: 1 }),
  makeUnscored({ size: 6, seed: 2, wrap: true }),
  makeUnscored({ size: 7, seed: 3, kind: "drains" }),
  makeUnscored({ size: 7, seed: 4, kind: "drains", sources: 2 }),
  makeUnscored({ size: 5, seed: 5, sources: 2 }),
];

describe("checking an answer", () => {
  it("accepts the answer to every board", () => {
    for (const made of boards) expect(checkSuidoAnswer(made.code, made.answer)).toEqual({ ok: true });
  });

  it("refuses the board as it was given, which is not solved", () => {
    for (const made of boards) {
      const result = checkSuidoAnswer(made.code, made.code);
      expect(result.ok).toBe(false);
    }
  });

  it("refuses an answer with any one piece turned away, when that makes water run out or stops it reaching", () => {
    const made = boards[0]!;
    const layout = decodeLayout(made.answer)!;
    let refused = 0;
    for (let cell = 0; cell < layout.cells.length; cell += 1) {
      const cells = [...layout.cells];
      cells[cell] = turn(cells[cell]!, 1);
      if (cells[cell] === layout.cells[cell]) continue;
      const result = checkSuidoAnswer(made.code, encodeLayout({ ...layout, cells }));
      expect(result.ok, `cell ${cell}`).toBe(false);
      refused += 1;
    }
    expect(refused).toBeGreaterThan(20);
  });

  it("says why", () => {
    const made = boards[0]!;
    const layout = decodeLayout(made.answer)!;
    expect(checkSuidoAnswer("nonsense", made.answer)).toEqual({ ok: false, reason: "the board is not a Suido code" });
    expect(checkSuidoAnswer(made.code, "nonsense")).toEqual({ ok: false, reason: "the answer is not a Suido code" });
    expect(checkSuidoAnswer(made.code, made.answer.replace("6x6", "5x6"))).toEqual({ ok: false, reason: "the answer is not a Suido code" });
    expect(checkSuidoAnswer(made.code, encodeLayout({ ...layout, wrap: true }))).toEqual({ ok: false, reason: "the answer is for a different board" });
    expect(checkSuidoAnswer(made.code, encodeLayout({ ...layout, kind: "drains" }))).toEqual({ ok: false, reason: "the answer is for a different board" });
    expect(checkSuidoAnswer(made.code, encodeLayout({ ...layout, sources: [] }))).toEqual({ ok: false, reason: "the answer is not a Suido code" });
    const moved = layout.sources[0] === 0 ? 1 : 0;
    expect(checkSuidoAnswer(made.code, encodeLayout({ ...layout, sources: [moved] })).ok).toBe(false);
    const pieceChanged = [...layout.cells];
    pieceChanged[0] = pieceChanged[0] === 15 ? 7 : 15;
    expect(checkSuidoAnswer(made.code, encodeLayout({ ...layout, cells: pieceChanged }))).toEqual({ ok: false, reason: "a piece is not the piece the board has there" });
    expect(checkSuidoAnswer(made.code, made.code)).toMatchObject({ ok: false });
  });

  it("will not take a piece swapped for another of the same number of arms or a straight for an elbow", () => {
    const made = boards[0]!;
    const layout = decodeLayout(made.answer)!;
    const given = decodeLayout(made.code)!;
    const at = given.cells.findIndex((mask) => mask === 5 || mask === 10);
    expect(at).toBeGreaterThan(-1);
    const cells = [...layout.cells];
    cells[at] = 3;
    expect(checkSuidoAnswer(made.code, encodeLayout({ ...layout, cells }))).toEqual({ ok: false, reason: "a piece is not the piece the board has there" });
  });

  it("does not need the answer to be the answer: a drains board takes a spare piece facing any way that leaves the water where it was", () => {
    const made = boards[2]!;
    const layout = decodeLayout(made.answer)!;
    const wet = flowOf(layout).wet;
    let taken = 0;
    let refused = 0;
    layout.cells.forEach((mask, cell) => {
      if (wet[cell] === true || mask === 0) return;
      for (const facing of rotationsOf(mask)) {
        const cells = [...layout.cells];
        cells[cell] = facing;
        const result = checkSuidoAnswer(made.code, encodeLayout({ ...layout, cells }));
        expect(result.ok).toBe(flowOf(layout, cells).solved);
        if (result.ok) taken += 1;
        else refused += 1;
      }
    });
    expect(taken).toBeGreaterThan(5);
    expect(refused).toBeGreaterThanOrEqual(0);
  });

  it("refuses an answer that is not the right length, or not a string, without throwing", () => {
    const made = boards[0]!;
    expect(checkSuidoAnswer(made.code, made.answer.slice(0, -1)).ok).toBe(false);
    expect(checkSuidoAnswer(made.code, 5 as unknown as string).ok).toBe(false);
    expect(checkSuidoAnswer(5 as unknown as string, made.answer).ok).toBe(false);
  });
});
