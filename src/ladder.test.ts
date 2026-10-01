import { describe, expect, it } from "vitest";

import { twistRole } from "./ladder.ts";
import type { LevelRow } from "./levelCounts.ts";

/**
 * THE LADDER'S TWISTS: a block's 15th level teaches a twist and its 16th tests it,
 * and nothing else in the first blocks changes for them. What the real levels do is
 * held by `levelSuite.fixture.ts`; this is the rule on rows made for it.
 */
describe("a level's part in its block's lesson", () => {
  const plain: LevelRow = ["2x2:h000", "0000", ""];
  const rows: LevelRow[] = [...Array.from({ length: 14 }, () => plain), ["2x2:h000", "0000", "locked"], ["2x2:h000", "0000", "locked walls"]];

  it("is none for levels 1 to 14 of a block", () => {
    for (let level = 1; level <= 14; level += 1) expect(twistRole(rows, level)).toBeNull();
  });

  it("names the 15th as the one that teaches, with what is new in it, and the 16th as the test", () => {
    expect(twistRole(rows, 15)).toEqual({ role: "teaches", twists: ["locked"], newOnes: ["locked"] });
    expect(twistRole(rows, 16)).toEqual({ role: "tests", twists: ["locked", "walls"], newOnes: ["walls"] });
  });

  it("is none for a 15th or 16th with no twist, and for a level there is not", () => {
    const left = [...rows.slice(0, 14), plain, plain];
    expect(twistRole(left, 15)).toBeNull();
    expect(twistRole(left, 16)).toBeNull();
    expect(twistRole(rows, 17)).toBeNull();
  });

  it("counts what an earlier block taught as no longer new", () => {
    const second = [...rows, ...Array.from({ length: 14 }, () => plain), ["2x2:h000", "0000", "locked wrap"] as LevelRow, ["2x2:h000", "0000", "walls"] as LevelRow];
    expect(twistRole(second, 31)).toEqual({ role: "teaches", twists: ["locked", "wrap"], newOnes: ["wrap"] });
    expect(twistRole(second, 32)).toEqual({ role: "tests", twists: ["walls"], newOnes: [] });
  });
});
