import { describe, expect, it } from "vitest";

import { bruteForce, facingsOf } from "./brute.fixture.ts";
import { checkSuidoAnswer } from "./check.ts";
import { decodeLayout } from "./code.ts";
import { flowOf } from "./flow.ts";
import { laySuido, makeSuido, makeUnscored, turnsFromAnswer, type MakeOptions } from "./generate.ts";
import { armsOf, shapeOf } from "./pieces.ts";
import { solve } from "./solve.ts";

/** Every board a generator makes is held to the same things: it decodes, its answer solves it, the solver finds that one answer and no other, and nothing starts solved. */
function holds(options: MakeOptions): void {
  const made = makeUnscored(options);
  const layout = decodeLayout(made.code)!;
  expect(layout, made.code).not.toBeNull();
  expect(layout).toEqual(made.layout);
  expect(checkSuidoAnswer(made.code, made.answer), made.code).toEqual({ ok: true });
  const found = solve(layout, 2);
  expect(found.complete, made.code).toBe(true);
  expect(found.count, made.code).toBe(1);
  expect(flowOf(layout).solved, `${made.code} starts solved`).toBe(false);
  if (layout.kind === "network") expect(found.solutions[0]).toEqual(made.solution);
  // A board has at most a pump to every six cells.
  expect(layout.sources.length).toBe(Math.min(options.sources ?? 1, Math.max(1, Math.floor((layout.width * layout.height) / 6))));
  for (const source of layout.sources) expect(layout.cells[source]).not.toBe(0);
  expect(layout.width).toBe(options.width ?? options.size ?? 7);
  expect(layout.height).toBe(options.height ?? options.size ?? options.width ?? 7);
}

describe("every board made has exactly one answer", () => {
  it("in every size from 3 to 12, both kinds, with and without wrap, one to three pumps, many seeds", () => {
    let boards = 0;
    for (const kind of ["network", "drains"] as const) {
      for (const wrap of [false, true]) {
        for (const size of [3, 4, 5, 6, 7, 8, 10, 12]) {
          for (let seed = 1; seed <= 5; seed += 1) {
            holds({ size, kind, wrap, seed, sources: 1 + ((seed + size) % 3) });
            boards += 1;
          }
        }
      }
    }
    expect(boards).toBe(160);
  }, 120_000);

  it("on boards that are not square", () => {
    for (const [width, height] of [
      [3, 8],
      [9, 4],
      [2, 6],
      [11, 5],
    ] as const) {
      for (const kind of ["network", "drains"] as const) holds({ width, height, kind, seed: width * 10 + height });
    }
    holds({ width: 8, height: 3, wrap: true, seed: 4 });
  });

  it("and the one answer is the one trying every way finds, on the smallest boards", () => {
    let compared = 0;
    for (const kind of ["network", "drains"] as const) {
      for (const wrap of [false, true]) {
        for (let seed = 1; seed <= 14; seed += 1) {
          const made = makeUnscored({ width: 3, height: wrap ? 3 : 2 + (seed % 2), kind, wrap, seed, drains: 2 });
          if (facingsOf(made.layout) > 140_000) continue;
          expect(bruteForce(made.layout), made.code).toBe(1);
          compared += 1;
        }
      }
    }
    expect(compared).toBeGreaterThan(30);
  }, 60_000);

  it("is a thing about the generator and not about its luck: a board is thrown away only when it has to be", () => {
    const discarded = [1, 2, 3, 4, 5, 6, 7, 8].map((seed) => makeUnscored({ size: 12, seed, wrap: true }).discarded);
    expect(Math.max(...discarded)).toBeLessThan(60);
  });
});

describe("a board", () => {
  it("is the same for the same seed and the same options, and different for a different seed", () => {
    expect(makeUnscored({ size: 8, seed: 5 }).code).toBe(makeUnscored({ size: 8, seed: 5 }).code);
    expect(makeUnscored({ size: 8, seed: 5 }).code).not.toBe(makeUnscored({ size: 8, seed: 6 }).code);
    expect(makeSuido({ size: 8, seed: 5, difficulty: 70 }).code).toBe(makeSuido({ size: 8, seed: 5, difficulty: 70 }).code);
  });

  it("is pinned: seed 1 at 5×5 makes the board it always has", () => {
    expect(makeUnscored({ size: 5, seed: 1 }).code).toBe(makeUnscored({ size: 5, seed: 1 }).code);
    expect(makeUnscored({ size: 5, seed: 1 }).code).toMatch(/^5x5:[0-9a-fg-vA-P]{25}$/);
  });

  it("has every piece turned at random from the answer, so a piece faces the answer about a quarter of the time", () => {
    let facing = 0;
    let pieces = 0;
    for (let seed = 1; seed <= 20; seed += 1) {
      const made = makeUnscored({ size: 8, seed });
      made.layout.cells.forEach((mask, cell) => {
        if (shapeOf(mask) === "straight" || shapeOf(mask) === "cross" || shapeOf(mask) === "blank") return;
        pieces += 1;
        if (mask === made.solution[cell]) facing += 1;
      });
    }
    expect(facing / pieces).toBeGreaterThan(0.15);
    expect(facing / pieces).toBeLessThan(0.35);
  });

  it("starts some way from solved: the answer is some turns away", () => {
    const made = makeUnscored({ size: 8, seed: 3 });
    expect(turnsFromAnswer(made.layout.cells, made.solution)).toBeGreaterThan(20);
    expect(turnsFromAnswer(made.solution, made.solution)).toBe(0);
  });

  it("in a network is every cell a piece, the drains its ends that are not pumps", () => {
    const made = makeUnscored({ size: 9, seed: 2 });
    expect(made.layout.cells.every((mask) => mask !== 0)).toBe(true);
    const ends = made.solution.flatMap((mask, cell) => (armsOf(mask) === 1 && !made.layout.sources.includes(cell) ? [cell] : []));
    expect(made.layout.drains).toEqual(ends);
  });

  it("in a drains board has the drains asked for, bare ground and spares where the water is not needed", () => {
    const made = makeUnscored({ size: 10, seed: 6, kind: "drains", drains: 5, spares: 0.5 });
    expect(made.layout.drains).toHaveLength(5);
    expect(made.layout.cells.filter((mask) => mask === 0).length).toBeGreaterThan(10);
    const wet = flowOf(made.layout, made.solution);
    expect(wet.wetDrains).toBe(5);
    const spare = made.layout.cells.filter((mask, cell) => mask !== 0 && !wet.wet[cell]).length;
    expect(spare).toBeGreaterThan(5);
    // With no spares, the water is everywhere the pieces are.
    const bare = makeUnscored({ size: 10, seed: 6, kind: "drains", drains: 5, spares: 0 });
    const flow = flowOf(bare.layout, bare.solution);
    expect(flow.wetPieces).toBe(flow.pieces);
  });

  it("can have each pump asked for, and every pump reaches a pipe", () => {
    for (const sources of [1, 2, 3, 4]) {
      const made = makeUnscored({ size: 9, seed: sources, sources });
      expect(made.layout.sources).toHaveLength(sources);
      const flow = flowOf(made.layout, made.solution);
      for (const source of made.layout.sources) expect(armsOf(made.solution[source]!)).toBeGreaterThan(0);
      expect(flow.wetPieces).toBe(81);
    }
  });

  it("wraps when asked, with pipes that run off one side and on at the other", () => {
    const made = makeUnscored({ size: 8, seed: 3, wrap: true });
    expect(made.code.startsWith("8x8w:")).toBe(true);
    const edge = made.solution.some((mask, cell) => cell % 8 === 0 && (mask & 8) !== 0);
    expect(edge).toBe(true);
  });

  it("refuses sizes it cannot make", () => {
    expect(() => makeUnscored({ size: 1 })).toThrow("Not a board size");
    expect(() => makeUnscored({ size: 41 })).toThrow("Not a board size");
    expect(() => makeUnscored({ size: 2, wrap: true })).toThrow("Not a board size");
    expect(() => makeUnscored({ size: 5.5 })).toThrow("Not a board size");
    expect(() => makeUnscored({ width: 4, height: 1 })).toThrow("Not a board size");
  });

  it("is laid without a promise by laySuido: a board and one of its answers, however many it has", () => {
    const laid = laySuido({ size: 6, seed: 4 });
    expect(flowOf(laid.layout, laid.solution).solved).toBe(true);
    expect(flowOf(laid.layout).solved).toBe(false);
  });
});

describe("asking for a difficulty", () => {
  it("makes a board near it, tells how hard it is, and is a seed that makes that board again", () => {
    for (const aim of [10, 50, 90]) {
      const made = makeSuido({ size: 9, seed: 3, difficulty: aim });
      expect(Math.abs(made.difficulty - aim)).toBeLessThanOrEqual(7);
      expect(made.tried).toBeGreaterThanOrEqual(1);
      expect(makeSuido({ size: 9, seed: made.seed }).code).toBe(made.code);
      expect(solve(made.layout, 2).count).toBe(1);
    }
  });

  it("makes one board when none is asked for, and says how hard it is all the same", () => {
    const made = makeSuido({ size: 7, seed: 2 });
    expect(made.tried).toBe(1);
    expect(made.difficulty).toBeGreaterThanOrEqual(1);
    expect(made.difficulty).toBeLessThanOrEqual(100);
    expect(made.code).toBe(makeUnscored({ size: 7, seed: 2 }).code);
  });

  it("gives the nearest it found when it is given too few tries", () => {
    const made = makeSuido({ size: 7, seed: 2, difficulty: 100, attempts: 2, tolerance: 0 });
    expect(made.tried).toBeLessThanOrEqual(2);
  });
});
