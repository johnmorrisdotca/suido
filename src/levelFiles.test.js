// The level files, held to the counts. Plain JavaScript, so that reading files needs no Node types.
import { readFileSync, statSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { SUIDO_LEVEL_COUNTS, SUIDO_SIZES, sizeOf } from "./levels.ts";

describe("every size's level file", () => {
  it("is kept short: a level takes about two characters for a cell and a few more for what it declares", () => {
    for (const size of SUIDO_SIZES) {
      const { width, height } = sizeOf(size);
      const bytes = statSync(`src/levels/size${size}.data.ts`).size;
      expect(bytes / SUIDO_LEVEL_COUNTS[size], size).toBeLessThan(width * height * 2 + 160);
    }
  });

  it("holds as many rows as the board of levels counts, one to a line", () => {
    for (const size of SUIDO_SIZES) {
      const rows = readFileSync(`src/levels/size${size}.data.ts`, "utf8")
        .split("\n")
        .filter((line) => /^ {2}\["/.test(line));
      expect(rows.length, size).toBe(SUIDO_LEVEL_COUNTS[size]);
    }
  });
});
