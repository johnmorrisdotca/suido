import { describe, expect, it } from "vitest";

import { makeSuido } from "./generate.ts";
import { SEEDED_AS_1_0_0 } from "./seeded.fixture.ts";

describe("a board made from a seed", () => {
  it("is the board 1.0.0 made, for every set of options 1.0.0 had: a site that kept a seed keeps its board", () => {
    expect(SEEDED_AS_1_0_0.length).toBeGreaterThan(30);
    for (const [options, code, answer, seed, difficulty] of SEEDED_AS_1_0_0) {
      const made = makeSuido(options);
      expect(made.code, JSON.stringify(options)).toBe(code);
      expect(made.answer).toBe(answer);
      expect(made.seed).toBe(seed);
      expect(made.difficulty).toBe(difficulty);
    }
  }, 60_000);
});
