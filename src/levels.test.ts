import { describe, expect, it } from "vitest";

import { blockOf, blockRange, blocksIn, firstUnsolvedSuidoLevel, isSuidoLevel, nextSuidoLevel, openSuidoLevels, sizeOf, SUIDO_LEVEL_COUNTS, SUIDO_SIZES, suidoBand } from "./levels.ts";

/**
 * HOW SUIDO'S LEVELS OPEN AND WHICH COMES NEXT. Every level itself, proved to
 * have one answer, measured and marked, is in `levels.<size>.test.ts`, one file a
 * size (`levelSuite.fixture.ts`).
 */
describe("the sizes", () => {
  it("are the square sizes 5×5 to 14×14, then the pipe shapes 5×7, 6×10 and 8×14", () => {
    expect(SUIDO_SIZES).toEqual(["5x5", "6x6", "7x7", "8x8", "9x9", "10x10", "11x11", "12x12", "13x13", "14x14", "5x7", "6x10", "8x14"]);
    expect(sizeOf("8x14")).toEqual({ width: 8, height: 14 });
    expect(sizeOf("14x14")).toEqual({ width: 14, height: 14 });
    expect(sizeOf("14")).toBeNull();
    expect(sizeOf("5x7x2")).toBeNull();
  });

  it("each have whole blocks of sixteen levels and at least sixty-four", () => {
    for (const size of SUIDO_SIZES) {
      expect(SUIDO_LEVEL_COUNTS[size]! % 16, size).toBe(0);
      expect(SUIDO_LEVEL_COUNTS[size]!, size).toBeGreaterThanOrEqual(64);
    }
  });

  it("know which levels they have", () => {
    expect(isSuidoLevel("5x5", 1)).toBe(true);
    expect(isSuidoLevel("5x5", SUIDO_LEVEL_COUNTS["5x5"]!)).toBe(true);
    expect(isSuidoLevel("5x5", 0)).toBe(false);
    expect(isSuidoLevel("5x5", SUIDO_LEVEL_COUNTS["5x5"]! + 1)).toBe(false);
    expect(isSuidoLevel("5x5", 1.5)).toBe(false);
    expect(isSuidoLevel("9x3", 1)).toBe(false);
  });

  it("file a level in the first, middle or last third of its size", () => {
    expect(suidoBand("5x5", 1)).toBe("easy");
    expect(suidoBand("5x5", 86)).toBe("easy");
    expect(suidoBand("5x5", 87)).toBe("medium");
    expect(suidoBand("5x5", 171)).toBe("medium");
    expect(suidoBand("5x5", 172)).toBe("hard");
  });
});

describe("a block is sixteen levels", () => {
  it("has a number, a range, and a count of how many a size has", () => {
    expect(blockOf(1)).toBe(1);
    expect(blockOf(16)).toBe(1);
    expect(blockOf(17)).toBe(2);
    expect(blockRange(2, 256)).toEqual({ first: 17, last: 32 });
    expect(blockRange(2, 20)).toEqual({ first: 17, last: 20 });
    expect(blocksIn(256)).toBe(16);
    expect(blocksIn(20)).toBe(2);
  });
});

describe("the levels open a block of sixteen at a time", () => {
  const upTo = (last: number) => Array.from({ length: last }, (_, at) => at + 1);
  const top = SUIDO_LEVEL_COUNTS["5x5"]!;

  it("opens the first block to a newcomer", () => {
    expect(openSuidoLevels("5x5", new Set())).toBe(16);
    expect(nextSuidoLevel("5x5", new Set())).toBe(1);
  });

  it("opens the next block only once every level of the one before is solved", () => {
    const fifteen = new Set(upTo(15));
    expect(openSuidoLevels("5x5", fifteen)).toBe(16);
    expect(nextSuidoLevel("5x5", fifteen)).toBe(16);
    const sixteen = new Set(upTo(16));
    expect(openSuidoLevels("5x5", sixteen)).toBe(32);
    expect(nextSuidoLevel("5x5", sixteen)).toBe(17);
    // Levels solved past the open blocks open nothing beyond a block left unfinished.
    expect(openSuidoLevels("5x5", new Set([...fifteen, 17, 18]))).toBe(16);
  });

  it("opens every block when every level is solved, and offers the last", () => {
    expect(openSuidoLevels("8x14", new Set(upTo(SUIDO_LEVEL_COUNTS["8x14"]!)))).toBe(SUIDO_LEVEL_COUNTS["8x14"]);
    expect(nextSuidoLevel("8x14", new Set(upTo(SUIDO_LEVEL_COUNTS["8x14"]!)))).toBe(SUIDO_LEVEL_COUNTS["8x14"]);
    expect(openSuidoLevels("5x5", new Set(upTo(top)))).toBe(top);
  });

  it("opens nothing for a size there is not", () => {
    expect(openSuidoLevels("3x3", new Set())).toBe(0);
  });
});

describe("the next level is the lowest one not yet solved", () => {
  it("sends somebody who solved only level 10 back to level 1, never on to 11", () => {
    const solved = new Set([10]);
    expect(firstUnsolvedSuidoLevel("5x5", solved)).toBe(1);
    expect(openSuidoLevels("5x5", solved)).toBe(16);
  });

  it("names the gap, and the level after it when that is the gap", () => {
    expect(firstUnsolvedSuidoLevel("5x5", new Set([1, 2, 4, 5]))).toBe(3);
    expect(firstUnsolvedSuidoLevel("5x5", new Set([1, 2, 3]))).toBe(4);
  });

  it("goes on to the next block once a block is all solved, and to nothing once every level is", () => {
    const block = new Set(Array.from({ length: 16 }, (_, at) => at + 1));
    expect(firstUnsolvedSuidoLevel("7x7", block)).toBe(17);
    const all = new Set(Array.from({ length: SUIDO_LEVEL_COUNTS["7x7"]! }, (_, at) => at + 1));
    expect(firstUnsolvedSuidoLevel("7x7", all)).toBeNull();
  });
});
