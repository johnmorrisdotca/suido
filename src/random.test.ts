import { describe, expect, it } from "vitest";

import { seededRandom, shuffled } from "./random.ts";

describe("seeded random numbers", () => {
  it("are the same stream for the same seed, pinned so that a seed always makes the same board", () => {
    const random = seededRandom(1);
    expect([random(), random(), random()].map((n) => Math.round(n * 1e9))).toEqual([627_073_941, 2_735_721, 527_447_040]);
  });

  it("differ for different seeds and stay in [0, 1)", () => {
    const a = seededRandom(1);
    const b = seededRandom(2);
    expect(a()).not.toBe(b());
    const c = seededRandom(99);
    for (let i = 0; i < 1000; i += 1) {
      const n = c();
      expect(n).toBeGreaterThanOrEqual(0);
      expect(n).toBeLessThan(1);
    }
  });

  it("shuffle leaves the list given alone and keeps every item", () => {
    const list = [1, 2, 3, 4, 5, 6];
    const out = shuffled(list, seededRandom(5));
    expect(list).toEqual([1, 2, 3, 4, 5, 6]);
    expect([...out].sort()).toEqual(list);
  });
});
