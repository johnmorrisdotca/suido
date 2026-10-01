import { describe, expect, it } from "vitest";

import { decodeLayout, type Layout } from "./code.ts";
import { flowOf } from "./flow.ts";
import { makeUnscored, type MakeOptions } from "./generate.ts";
import { symmetryKey, transformLayout } from "./symmetry.ts";

const options: MakeOptions[] = [
  { size: 6, seed: 3 },
  { width: 5, height: 7, seed: 4, kind: "drains" },
  { size: 6, wrap: true, seed: 5, locked: 3, walls: 3 },
  { width: 7, height: 5, seed: 6, kind: "inlet-outlet", locked: 2, walls: 3 },
  { size: 5, seed: 7, sources: 2, walls: 4 },
];

describe("a board turned or mirrored", () => {
  it("is the same board: its answer still solves it, with its pumps, drains, locks and walls moved with it", () => {
    for (const each of options) {
      const made = makeUnscored(each);
      for (let op = 0; op < 8; op += 1) {
        const turned = transformLayout(made.layout, op);
        const solution = transformLayout({ ...made.layout, cells: made.solution }, op).cells;
        expect(turned.cells).toHaveLength(made.layout.cells.length);
        expect(turned.sources).toHaveLength(made.layout.sources.length);
        expect(turned.walls?.length ?? 0).toBe(made.layout.walls?.length ?? 0);
        expect(turned.locked?.length ?? 0).toBe(made.layout.locked?.length ?? 0);
        const flow = flowOf(turned, solution);
        expect(flow.solved, `${JSON.stringify(each)} op ${op}`).toBe(true);
        expect(flow.wetPieces).toBe(flowOf(made.layout, made.solution).wetPieces);
      }
    }
  });

  it("has the width and height swapped by a quarter turn, and not by a mirror", () => {
    const layout = makeUnscored({ width: 5, height: 7, seed: 1 }).layout;
    expect([transformLayout(layout, 0).width, transformLayout(layout, 0).height]).toEqual([5, 7]);
    expect([transformLayout(layout, 1).width, transformLayout(layout, 1).height]).toEqual([7, 5]);
    expect([transformLayout(layout, 4).width, transformLayout(layout, 4).height]).toEqual([5, 7]);
    expect([transformLayout(layout, 6).width, transformLayout(layout, 6).height]).toEqual([5, 7]);
  });

  it("comes back to itself after four quarter turns", () => {
    const layout = makeUnscored({ size: 6, seed: 5, wrap: true, walls: 3, locked: 2 }).layout;
    let at: Layout = layout;
    for (let turn = 0; turn < 4; turn += 1) at = transformLayout(at, 1);
    expect(at).toEqual(layout);
  });
});

describe("a board's symmetry key", () => {
  it("is the same for every turn and mirror of it, whatever way its spare pieces face", () => {
    for (const each of options) {
      const made = makeUnscored(each);
      const key = symmetryKey(made.layout, made.solution);
      for (let op = 0; op < 8; op += 1) {
        const turned = transformLayout(made.layout, op);
        const solution = transformLayout({ ...made.layout, cells: made.solution }, op).cells;
        expect(symmetryKey(turned, solution), `${JSON.stringify(each)} op ${op}`).toBe(key);
      }
    }
  });

  it("differs between boards that are not the same puzzle", () => {
    const keys = new Set<string>();
    for (let seed = 1; seed <= 40; seed += 1) {
      const made = makeUnscored({ size: 6, seed });
      keys.add(symmetryKey(made.layout, made.solution));
    }
    expect(keys.size).toBe(40);
  });

  it("is a code of a board", () => {
    const made = makeUnscored({ size: 5, seed: 9 });
    expect(decodeLayout(symmetryKey(made.layout, made.solution))).not.toBeNull();
  });
});
