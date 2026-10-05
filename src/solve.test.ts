import { describe, expect, it } from "vitest";

import { bruteForce, facingsOf } from "./brute.fixture.ts";
import type { Layout } from "./code.ts";
import { flowOf } from "./flow.ts";
import { laySuido } from "./generate.ts";
import { SHAPE_MASKS, turn } from "./pieces.ts";
import { seededRandom } from "./random.ts";
import { countSolutions, solve } from "./solve.ts";

describe("the solver counts answers as trying every way does", () => {
  it("on random boards of small size, in both kinds, with and without wrap and with two pumps", () => {
    const random = seededRandom(7);
    const shapes = Object.values(SHAPE_MASKS);
    let compared = 0;
    const seen: Record<number, number> = {};
    for (let i = 0; i < 1200 && compared < 500; i += 1) {
      const width = 2 + Math.floor(random() * 3);
      const height = 2 + Math.floor(random() * 2);
      const kind = random() < 0.5 ? "network" : "drains";
      const wrap = width >= 3 && height >= 3 && random() < 0.4;
      const count = width * height;
      const cells = Array.from({ length: count }, () => turn(shapes[1 + Math.floor(random() * 5)]!, Math.floor(random() * 4)));
      if (random() < 0.3) cells[Math.floor(random() * count)] = 0;
      const sources = [Math.floor(random() * count)];
      if (random() < 0.3) sources.push(Math.floor(random() * count));
      const pumps = [...new Set(sources)].sort((a, b) => a - b);
      for (const source of pumps) if (cells[source] === 0) cells[source] = 5;
      const drains = kind === "drains" ? [...new Set(Array.from({ length: 1 + Math.floor(random() * 2) }, () => Math.floor(random() * count)))].filter((cell) => !pumps.includes(cell) && cells[cell] !== 0).sort((a, b) => a - b) : [];
      const layout: Layout = { width, height, kind, wrap, cells, sources: pumps, drains };
      if (facingsOf(layout) > 20_000) continue;
      const expected = bruteForce(layout);
      const found = solve(layout, 1000);
      expect(found.count, JSON.stringify(layout)).toBe(expected);
      expect(found.complete).toBe(true);
      for (const solution of found.solutions) expect(flowOf(layout, solution).solved).toBe(true);
      seen[Math.min(expected, 3)] = (seen[Math.min(expected, 3)] ?? 0) + 1;
      compared += 1;
    }
    expect(compared).toBeGreaterThan(300);
    // The comparison is not only of boards with no answer.
    expect((seen[1] ?? 0) + (seen[2] ?? 0) + (seen[3] ?? 0)).toBeGreaterThan(5);
  }, 60_000);

  it("on boards laid out the way the generator lays them, with every number of answers", () => {
    let compared = 0;
    const seen: Record<number, number> = {};
    for (let seed = 1; seed <= 400 && compared < 60; seed += 1) {
      const layout = laySuido({ width: 3 + (seed % 2), height: 3, seed, kind: seed % 3 === 0 ? "drains" : "network", wrap: seed % 4 === 0, sources: 1 + (seed % 5 === 0 ? 1 : 0), drains: 2, bias: (seed % 7) / 7 }).layout;
      if (facingsOf(layout) > 70_000) continue;
      const expected = bruteForce(layout);
      expect(solve(layout, 1000).count, layout.cells.join()).toBe(expected);
      seen[Math.min(expected, 3)] = (seen[Math.min(expected, 3)] ?? 0) + 1;
      compared += 1;
    }
    expect(compared).toBeGreaterThan(40);
    expect(seen[1] ?? 0).toBeGreaterThan(5);
    expect(Object.keys(seen).length).toBeGreaterThan(1);
  }, 60_000);
});

describe("the solver", () => {
  it("finds a board with one answer to have one, and stops at the limit when there are more", () => {
    // A pump that opens on one side and an end beside it: the pump faces the end, the end faces the pump.
    const pair: Layout = { width: 2, height: 1 + 1, kind: "network", wrap: false, cells: [1, 1, 0, 0], sources: [0], drains: [] };
    expect(solve(pair, 5).count).toBe(1);
    expect(solve(pair, 5).solutions[0]).toEqual([2, 8, 0, 0]);
    // Two pumps and nothing else can be faced four ways each, but only the ways that meet are answers.
    const pumps: Layout = { width: 2, height: 2, kind: "network", wrap: false, cells: [1, 1, 1, 1], sources: [0, 3], drains: [] };
    const answers = solve(pumps, 100);
    expect(answers.count).toBe(bruteForce(pumps));
    expect(answers.count).toBeGreaterThan(1);
    expect(solve(pumps, 2).count).toBe(2);
  });

  it("counts a ring of four elbows as one answer and a board of four ends as none", () => {
    const ring: Layout = { width: 2, height: 2, kind: "network", wrap: false, cells: [3, 3, 3, 3], sources: [0], drains: [] };
    expect(countSolutions(ring)).toBe(1);
    expect(countSolutions({ ...ring, cells: [1, 1, 1, 1] })).toBe(0);
  });

  it("counts as trying every way does on a board whose edges join", () => {
    const board: Layout = { width: 3, height: 3, kind: "network", wrap: true, cells: [0, 0, 0, 1, 3, 1, 0, 0, 0], sources: [4], drains: [] };
    expect(solve(board, 9).count).toBe(bruteForce(board));
    const column: Layout = { width: 3, height: 3, kind: "network", wrap: true, cells: [0, 1, 0, 0, 5, 0, 0, 1, 0], sources: [4], drains: [] };
    expect(solve(column, 9).count).toBe(bruteForce(column));
    expect(solve(column, 9).count).toBeGreaterThan(0);
  });

  it("gives up honestly: a budget that runs out says the search is not complete, and never calls a board unique", () => {
    const layout = laySuido({ size: 12, seed: 5, kind: "network", wrap: true }).layout;
    const result = solve(layout, 2, 1);
    expect(result.complete).toBe(false);
    const drains = laySuido({ size: 14, seed: 9, kind: "drains" }).layout;
    expect(solve(drains, 2, 1).complete).toBe(false);
  });

  it("proves a laid board unique or not the same way whatever its size", () => {
    for (const kind of ["network", "drains"] as const) {
      for (let seed = 1; seed <= 20; seed += 1) {
        const layout = laySuido({ size: 9, seed, kind }).layout;
        const result = solve(layout, 3);
        expect(result.count).toBeGreaterThanOrEqual(1);
        expect(result.complete).toBe(true);
        for (const solution of result.solutions) expect(flowOf(layout, solution).solved).toBe(true);
      }
    }
  });

  it("counts the answers of a drains board by their water, not by how its spare pieces face", () => {
    // A pump, a straight, a drain, and a spare end below the pump that faces any of four ways.
    const board: Layout = { width: 3, height: 2, kind: "drains", wrap: false, cells: [2, 10, 8, 1, 0, 0], sources: [0], drains: [2] };
    expect(solve(board, 10).count).toBe(1);
    const spareTwo: Layout = { ...board, cells: [2, 10, 8, 1, 2, 0] };
    expect(solve(spareTwo, 10).count).toBe(bruteForce(spareTwo));
  });
});
