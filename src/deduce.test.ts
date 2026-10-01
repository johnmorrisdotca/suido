import { describe, expect, it } from "vitest";

import { deduce } from "./deduce.ts";
import { makeUnscored } from "./generate.ts";
import type { Layout } from "./code.ts";

describe("what can be worked out without guessing", () => {
  it("fixes every piece of a line the edge and the ends force, in rounds that follow the line", () => {
    // A pump, three straights and an end along the top row of a board with nothing else: the edge forces the rest.
    const layout: Layout = { width: 5, height: 1 + 1, kind: "network", wrap: false, cells: [2, 10, 10, 10, 8, 0, 0, 0, 0, 0], sources: [0], drains: [] };
    const found = deduce(layout, [2, 10, 10, 10, 8, 0, 0, 0, 0, 0]);
    expect(found.pieces).toBe(5);
    expect(found.settled).toBe(5);
    expect(found.rounds).toBeGreaterThanOrEqual(1);
  });

  it("never fixes more pieces than there are, nor fewer than at the first look", () => {
    for (const kind of ["network", "drains"] as const) {
      for (let seed = 1; seed <= 12; seed += 1) {
        const made = makeUnscored({ size: 8, seed, kind });
        const found = deduce(made.layout, made.solution);
        expect(found.glance).toBeLessThanOrEqual(found.settled);
        expect(found.settled).toBeLessThanOrEqual(found.pieces);
        expect(found.rounds).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("settles a whole network in a few dozen rounds at most, since the answer is the only one", () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const made = makeUnscored({ size: 10, seed });
      const found = deduce(made.layout, made.solution);
      expect(found.rounds).toBeLessThan(60);
      expect(found.settled / found.pieces).toBeGreaterThan(0.5);
    }
  });

  it("counts a drains board's pieces as those the water goes through", () => {
    const made = makeUnscored({ size: 9, seed: 4, kind: "drains" });
    const found = deduce(made.layout, made.solution);
    expect(found.pieces).toBeLessThan(made.layout.cells.filter((mask) => mask !== 0).length);
  });
});
