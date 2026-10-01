import { describe, expect, it } from "vitest";

import { neighboursOf, type Layout } from "./code.ts";
import { flowOf, isSolved } from "./flow.ts";
import { opposite, SHAPE_MASKS, turn } from "./pieces.ts";
import { seededRandom } from "./random.ts";

/** The water found the slow, obvious way: every pair of cells joined by openings that meet, grouped, and the groups with a source in them. */
function wetBySets(layout: Layout, masks: readonly number[]): boolean[] {
  const near = neighboursOf(layout);
  const group = masks.map((_, cell) => cell);
  const find = (cell: number): number => (group[cell] === cell ? cell : (group[cell] = find(group[cell]!)));
  for (let cell = 0; cell < masks.length; cell += 1) {
    for (let side = 0; side < 4; side += 1) {
      const next = near[cell * 4 + side]!;
      if (next !== -1 && ((masks[cell]! >> side) & 1) === 1 && ((masks[next]! >> opposite(side)) & 1) === 1) group[find(cell)] = find(next);
    }
  }
  const sourced = new Set(layout.sources.map(find));
  return masks.map((_, cell) => sourced.has(find(cell)));
}

describe("the water", () => {
  it("reaches exactly the cells joined to a pump, on a thousand random boards", () => {
    const random = seededRandom(11);
    for (let i = 0; i < 1000; i += 1) {
      const width = 2 + Math.floor(random() * 6);
      const height = 2 + Math.floor(random() * 6);
      const wrap = width > 2 && height > 2 && random() < 0.5;
      const masks = Array.from({ length: width * height }, () => Math.floor(random() * 16));
      const sources = [Math.floor(random() * masks.length)];
      if (random() < 0.4) sources.push(Math.floor(random() * masks.length));
      const unique = [...new Set(sources)].sort((a, b) => a - b);
      for (const source of unique) if (masks[source] === 0) masks[source] = 5;
      const layout: Layout = { width, height, kind: "network", wrap, cells: masks, sources: unique, drains: [] };
      const flow = flowOf(layout, masks);
      expect(flow.wet).toEqual(wetBySets(layout, masks));
      expect(flow.order).toHaveLength(flow.wet.filter(Boolean).length);
    }
  });

  it("runs out of an opening that opens on nothing: the edge, bare ground, or a piece that does not open back", () => {
    // A pump facing east and west, a straight beside it, and bare ground beyond.
    const row: Layout = { width: 3, height: 2, kind: "network", wrap: false, cells: [0, 0, 0, 10, 10, 0], sources: [3], drains: [] };
    const flow = flowOf(row);
    expect(flow.spills).toEqual([
      { cell: 3, side: 3 },
      { cell: 4, side: 1 },
    ]);
    expect(flow.wet).toEqual([false, false, false, true, true, false]);
    // A piece whose opening is met by one that faces away is not reached, and the water runs out at the opening.
    const apart: Layout = { ...row, cells: [0, 0, 0, 2, 2, 0] };
    expect(flowOf(apart).wet).toEqual([false, false, false, true, false, false]);
    expect(flowOf(apart).spills).toEqual([{ cell: 3, side: 1 }]);
  });

  it("goes round the other side of a board whose edges join, and spills off one that does not", () => {
    const base = { width: 3, height: 3, kind: "network" as const, cells: [0, 0, 0, 10, 10, 10, 0, 0, 0], sources: [3], drains: [] };
    expect(flowOf({ ...base, wrap: true }).wet).toEqual([false, false, false, true, true, true, false, false, false]);
    expect(flowOf({ ...base, wrap: true }).spills).toEqual([]);
    expect(flowOf({ ...base, wrap: false }).spills).toHaveLength(2);
  });

  it("is deepest where it is furthest from the pump, and says which way it came in", () => {
    const layout: Layout = { width: 4, height: 1 + 1, kind: "network", wrap: false, cells: [0, 0, 0, 0, 2, 10, 10, 8], sources: [4], drains: [] };
    const flow = flowOf(layout);
    expect(flow.depth).toEqual([-1, -1, -1, -1, 0, 1, 2, 3]);
    expect(flow.from).toEqual([-1, -1, -1, -1, -1, 4, 5, 6]);
    expect(flow.entry[5]).toBe(3);
    expect(flow.order).toEqual([4, 5, 6, 7]);
  });

  it("starts at every pump at once", () => {
    const layout: Layout = { width: 5, height: 2, kind: "network", wrap: false, cells: [0, 0, 0, 0, 0, 2, 10, 0, 10, 8], sources: [5, 9], drains: [] };
    const flow = flowOf(layout);
    expect(flow.wet).toEqual([false, false, false, false, false, true, true, false, true, true]);
    expect(flow.depth[5]).toBe(0);
    expect(flow.depth[9]).toBe(0);
  });
});

describe("a solved board", () => {
  it("is one where, in a network, every piece is wet and nothing is open", () => {
    const ring: Layout = { width: 2, height: 2, kind: "network", wrap: false, cells: [6, 12, 3, 9], sources: [0], drains: [] };
    expect(isSolved(ring)).toBe(true);
    expect(isSolved(ring, [6, 12, 3, 3])).toBe(false);
    // Everything wet but a piece apart from the rest.
    expect(isSolved({ ...ring, width: 3, height: 2, cells: [2, 10, 8, 0, 0, 5] }, [2, 10, 8, 0, 0, 5])).toBe(false);
  });

  it("is one where, in a drains board, every drain is wet and nothing wet is open, whatever the spares do", () => {
    const board: Layout = { width: 3, height: 2, kind: "drains", wrap: false, cells: [2, 10, 8, 15, 15, 15], sources: [0], drains: [2] };
    expect(isSolved(board)).toBe(true);
    expect(isSolved(board, [2, 10, 8, 1, 4, 2])).toBe(true);
    expect(isSolved(board, [2, 10, 4, 1, 4, 2])).toBe(false);
    // The water spills where the third piece opens off the edge, even though the drain is reached.
    const spilling = flowOf(board, [2, 10, 9, 15, 15, 15]);
    expect(spilling.wetDrains).toBe(1);
    expect(spilling.solved).toBe(false);
  });

  it("is never one with water running out, in either kind", () => {
    const board: Layout = { width: 2, height: 2, kind: "network", wrap: false, cells: [3, 8, 4, 1], sources: [0], drains: [] };
    expect(flowOf(board, [3, 12, 5, 1]).solved).toBe(false);
  });

  it("counts pieces and drains", () => {
    const board: Layout = { width: 3, height: 2, kind: "drains", wrap: false, cells: [2, 10, 8, 0, 4, 1], sources: [0], drains: [2, 5] };
    const flow = flowOf(board);
    expect(flow.pieces).toBe(5);
    expect(flow.drains).toBe(2);
    expect(flow.wetDrains).toBe(1);
    expect(turn(SHAPE_MASKS.end, 1)).toBe(2);
  });
});
