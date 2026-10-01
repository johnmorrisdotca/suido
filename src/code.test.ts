import { describe, expect, it } from "vitest";

import { decodeLayout, encodeLayout, neighboursOf, withMasks, type Layout } from "./code.ts";
import { seededRandom } from "./random.ts";

const sample: Layout = { width: 3, height: 2, kind: "network", wrap: false, cells: [3, 5, 1, 7, 15, 12], sources: [4], drains: [2, 5] };

describe("a layout's code", () => {
  it("writes the size, the flags, and a character for every cell, marking sources and drains", () => {
    expect(encodeLayout(sample)).toBe("3x2:35B7vM");
    expect(encodeLayout({ ...sample, kind: "drains", wrap: true })).toBe("3x2dw:35B7vM");
  });

  it("reads back what it wrote, for a thousand random boards", () => {
    const random = seededRandom(3);
    for (let i = 0; i < 1000; i += 1) {
      const width = 2 + Math.floor(random() * 8);
      const height = 2 + Math.floor(random() * 8);
      const cells = Array.from({ length: width * height }, () => 1 + Math.floor(random() * 15));
      const sources = [Math.floor(random() * cells.length)];
      const drain = Math.floor(random() * cells.length);
      const layout: Layout = { width, height, kind: random() < 0.5 ? "network" : "drains", wrap: width > 2 && height > 2 && random() < 0.5, cells, sources, drains: drain === sources[0] ? [] : [drain] };
      expect(decodeLayout(encodeLayout(layout))).toEqual(layout);
    }
  });

  it("refuses what is not a board", () => {
    const bad = ["", "nonsense", "3x2:35C7p", "3x2:35C7pcc", "3x2:35C7pz", "3x2:0000g0", "1x6:gggggg", "41x2:" + "g".repeat(82), "3x2ww:35C7pc", "3x2wd:35C7pc", "2x3w:g00000", "3x2:35C7bc", "3x2:35C7ac"];
    for (const code of bad) expect(decodeLayout(code), code).toBeNull();
    expect(decodeLayout(undefined as unknown as string)).toBeNull();
    // A source or a drain on bare ground is no source or drain.
    expect(decodeLayout("2x2:g000")).toBeNull();
    expect(decodeLayout("2x2:hB11")?.drains).toEqual([1]);
    expect(decodeLayout("2x2:h1B1")?.drains).toEqual([2]);
    expect(decodeLayout("2x2:h1B1")?.sources).toEqual([0]);
  });

  it("needs a source", () => {
    expect(decodeLayout("2x2:1111")).toBeNull();
    expect(decodeLayout("2x2:h111")?.sources).toEqual([0]);
  });

  it("can be put back as the pieces now face", () => {
    const turned = withMasks(sample, [1, 1, 1, 1, 1, 1]);
    expect(turned.cells).toEqual([1, 1, 1, 1, 1, 1]);
    expect(turned.width).toBe(3);
    expect(sample.cells).toEqual([3, 5, 1, 7, 15, 12]);
  });
});

describe("neighbours", () => {
  it("are -1 at the edge of a board that does not wrap", () => {
    const near = neighboursOf({ width: 3, height: 2, wrap: false });
    expect(Array.from(near.slice(0, 4))).toEqual([-1, 1, 3, -1]);
    expect(Array.from(near.slice(4 * 4, 4 * 4 + 4))).toEqual([1, 5, -1, 3]);
  });

  it("go round the other side when the edges join", () => {
    const near = neighboursOf({ width: 3, height: 3, wrap: true });
    expect(Array.from(near.slice(0, 4))).toEqual([6, 1, 3, 2]);
    expect(Array.from(near.slice(8 * 4, 8 * 4 + 4))).toEqual([5, 6, 2, 7]);
  });

  it("are each other's neighbours the other way", () => {
    for (const wrap of [false, true]) {
      const near = neighboursOf({ width: 4, height: 3, wrap });
      for (let cell = 0; cell < 12; cell += 1) {
        for (let side = 0; side < 4; side += 1) {
          const next = near[cell * 4 + side]!;
          if (next !== -1) expect(near[next * 4 + ((side + 2) & 3)]).toBe(cell);
        }
      }
    }
  });
});
