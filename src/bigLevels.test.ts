import { beforeAll, describe, expect, it } from "vitest";

import { bigShapesIn, inBigMix } from "./bigPieces.ts";
import { blendBigScore, BIG_PIECES_LARGEST, BIG_PIECES_SMALLEST, coverageOf, exactBigScoreOf, sizeTermOf, usedPiecesOf } from "./bigDifficulty.ts";
import { firstUnsolvedSuidoBigLevel, isSuidoBigLevel, nextSuidoBigLevel, openSuidoBigLevels, SUIDO_BIG_BLOCKS, SUIDO_BIG_PIECES, SUIDO_BIG_SCORES, SUIDO_BIG_SIZES, SUIDO_BIG_TWISTS, suidoBigBand, suidoBigMarks, suidoBigPieces, suidoBigRole, suidoBigScore, suidoBigSize, suidoBigTwists } from "./bigLevels.ts";
import { checkSuidoAnswer } from "./check.ts";
import { decodeLayout, type Layout } from "./code.ts";
import { flowOf } from "./flow.ts";
import { SUIDO_BIG_COUNT, sizeOf } from "./levelCounts.ts";
import { declaredTwists, levelAnswer, levelSolution } from "./levelRow.ts";
import { loadSuidoBigLevels, suidoBigLevelOf, suidoBigLevelsLoaded } from "./levels.ts";
import { solve, type SolveResult } from "./solve.ts";
import { symmetryKey } from "./symmetry.ts";
import { SUIDO_TWISTS, twistsOf } from "./twists.ts";

/**
 * THE SIXTY-FOUR BIG-PIECES LEVELS, PROVED AGAIN ON EVERY BUILD. Nothing the level script did is trusted: each board is solved from scratch and must have
 * exactly one answer, the one its row stores; its twists, size and score are read again and held to the files a server reads without the boards.
 */
describe("the big-pieces levels", () => {
  let layouts: Layout[] = [];
  let solves: SolveResult[] = [];
  let rows: Awaited<ReturnType<typeof loadSuidoBigLevels>> = [];
  beforeAll(async () => {
    rows = await loadSuidoBigLevels();
    layouts = rows.map(([board]) => decodeLayout(board)!);
    solves = layouts.map((layout) => solve(layout, 2));
  }, 300_000);

  it("are sixty-four, four blocks of sixteen, each a board that decodes and none that starts solved", () => {
    expect(rows).toHaveLength(64);
    expect(SUIDO_BIG_COUNT).toBe(64);
    expect(SUIDO_BIG_BLOCKS).toBe(4);
    expect(suidoBigLevelsLoaded()).toBe(rows);
    for (const [index, layout] of layouts.entries()) {
      expect(layout, `level ${index + 1}`).not.toBeNull();
      expect(flowOf(layout).solved, `level ${index + 1} starts solved`).toBe(false);
    }
  });

  it("proves every level has exactly one answer, the stored one, and that it checks", () => {
    for (const [index, row] of rows.entries()) {
      const found = solves[index]!;
      expect(found.complete, `level ${index + 1} was not proved`).toBe(true);
      expect(found.count, `level ${index + 1} has ${found.count} answers`).toBe(1);
      const stored = levelSolution(row);
      expect(stored, `level ${index + 1}'s turns are not digits for its cells`).not.toBeNull();
      const flow = flowOf(layouts[index]!, stored!);
      expect(flow.solved, `level ${index + 1}'s stored answer is not solved`).toBe(true);
      const mine = found.solutions[0]!;
      for (let cell = 0; cell < mine.length; cell += 1) if (flow.wet[cell] === true) expect(stored![cell], `level ${index + 1}, cell ${cell}`).toBe(mine[cell]);
      expect(checkSuidoAnswer(row[0], levelAnswer(row)!), `level ${index + 1}`).toEqual({ ok: true });
    }
  });

  it("has big pieces in every level, and holds no two that are the same board turned or mirrored", () => {
    for (const [index, layout] of layouts.entries()) expect(layout.bigs?.length ?? 0, `level ${index + 1}`).toBeGreaterThan(0);
    const keys = rows.map((row, index) => symmetryKey(layouts[index]!, levelSolution(row)!));
    expect(new Set(keys).size).toBe(keys.length);
  }, 180_000);

  it("declares the twists its board has, and only those, with big pieces on every level", () => {
    for (const [index, row] of rows.entries()) {
      expect(row[2], `level ${index + 1}`).toBe(twistsOf(layouts[index]!).join(" "));
      expect(row[2], `level ${index + 1}`).toBe(SUIDO_BIG_TWISTS[index]);
      expect(declaredTwists(row)).toContain("big-pieces");
      expect(suidoBigTwists(index + 1)).toEqual(declaredTwists(row));
      for (const word of row[2].split(" ")) expect(SUIDO_TWISTS as readonly string[]).toContain(word);
    }
    expect(suidoBigTwists(0)).toEqual([]);
    expect(suidoBigTwists(65)).toEqual([]);
  });

  it("has a good mix of what is inside its big pieces: pipes side by side, a cross or a tee inside a plate, three pipes in one, few openings and many", () => {
    const shapes = layouts.flatMap((layout, index) => bigShapesIn(layout, levelSolution(rows[index]!)!).map((one) => one.shape));
    // Every big piece of every level is one of the shapes, and a level's own count agrees.
    expect(shapes.length).toBe(layouts.reduce((sum, layout) => sum + (layout.bigs?.length ?? 0), 0));
    const families = new Set(shapes.map((shape) => shape.family));
    expect(families.size).toBeGreaterThanOrEqual(15);
    expect(new Set(shapes.map((shape) => shape.id)).size).toBeGreaterThanOrEqual(80);
    expect(new Set(shapes.map((shape) => shape.pipes))).toEqual(new Set([1, 2, 3]));
    expect(shapes.filter((shape) => shape.pipes >= 2).length).toBeGreaterThan(shapes.length / 3);
    expect(shapes.some((shape) => shape.masks.some((mask) => mask === 15))).toBe(true);
    expect(shapes.some((shape) => shape.openings <= 2)).toBe(true);
    expect(shapes.some((shape) => shape.openings >= 6)).toBe(true);
    // The levels of the first block already have plates with two pipes side by side, and no level is only the five old kinds.
    const early = layouts.slice(0, 16).flatMap((layout, index) => bigShapesIn(layout, levelSolution(rows[index]!)!).map((one) => one.shape));
    expect(early.some((shape) => shape.pipes >= 2)).toBe(true);
    // Water in one pipe of a plate never reaches another: a plate's pipes are separate wherever the answer puts the water.
    for (const [index, layout] of layouts.entries()) for (const one of bigShapesIn(layout, levelSolution(rows[index]!)!)) expect(one.shape.pipes, `level ${index + 1}`).toBeGreaterThanOrEqual(1);
  });

  it("mixes ordinary 1×1 pieces with 2×2 big pieces in every level, and has more of them, and trickier ones, as the levels climb", () => {
    const counts = layouts.map((layout) => layout.bigs?.length ?? 0);
    expect(counts).toEqual([...SUIDO_BIG_PIECES]);
    const share = layouts.map((layout, index) => (4 * counts[index]!) / layout.cells.length);
    for (const [index, layout] of layouts.entries()) {
      // Big pieces among ordinary ones: some of the board is each, never all of it.
      expect(share[index]!, `level ${index + 1}`).toBeGreaterThan(0);
      expect(share[index]!, `level ${index + 1}`).toBeLessThan(0.5);
      expect(counts[index]! * 4, `level ${index + 1}`).toBeLessThan(layout.cells.length);
      expect(suidoBigPieces(index + 1)).toEqual({ count: counts[index], share: share[index] });
    }
    const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    const tricky = layouts.map((layout, index) => {
      const shapes = bigShapesIn(layout, levelSolution(rows[index]!)!).map((one) => one.shape);
      return mean(shapes.map((shape) => (inBigMix(shape, "simple") ? 1 : inBigMix(shape, "more") ? 2 : 3)));
    });
    // Each quarter of the set has a higher share of its boards covered by big pieces and trickier insides than the quarter before it, at least in their means over the half.
    expect(mean(share.slice(32))).toBeGreaterThan(mean(share.slice(0, 32)));
    expect(mean(tricky.slice(32))).toBeGreaterThan(mean(tricky.slice(0, 32)));
    expect(mean(tricky.slice(48))).toBeGreaterThan(mean(tricky.slice(0, 16)) + 0.4);
    // The first levels hold only plain ones (one or two pipes, four openings at most), and the last hold three pipes in one.
    const early = layouts.slice(0, 12).flatMap((layout, index) => bigShapesIn(layout, levelSolution(rows[index]!)!).map((one) => one.shape));
    for (const shape of early) expect(inBigMix(shape, "more"), shape.id).toBe(true);
    const late = layouts.slice(40).flatMap((layout, index) => bigShapesIn(layout, levelSolution(rows[index + 40]!)!).map((one) => one.shape));
    expect(late.some((shape) => shape.pipes === 3)).toBe(true);
    expect(suidoBigPieces(0)).toBeNull();
    expect(suidoBigPieces(65)).toBeNull();
  });

  it("are on boards of the size the info file says, from 5×5 up to 20×20, climbing with the levels", () => {
    expect(SUIDO_BIG_SIZES).toHaveLength(64);
    const used: number[] = [];
    for (const [index, layout] of layouts.entries()) {
      const size = SUIDO_BIG_SIZES[index]!;
      expect(sizeOf(size), `level ${index + 1}`).toEqual({ width: layout.width, height: layout.height });
      expect(suidoBigSize(index + 1)).toBe(size);
      used.push(usedPiecesOf(layout, levelSolution(rows[index]!)!));
    }
    // The order is the score's, and a size follows it loosely: no level is on a board much smaller than the one before, and every quarter of the set is bigger than the one before it.
    for (let at = 1; at < used.length; at += 1) expect(used[at]!, `level ${at + 1}`).toBeGreaterThanOrEqual(used[at - 1]! * 0.8);
    const mean = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
    for (const quarter of [1, 2, 3]) expect(mean(used.slice(quarter * 16, quarter * 16 + 16))).toBeGreaterThan(mean(used.slice((quarter - 1) * 16, quarter * 16)));
    expect(SUIDO_BIG_SIZES[0]).toBe("5x5");
    expect(SUIDO_BIG_SIZES[63]).toBe("20x20");
    expect(suidoBigSize(0)).toBeNull();
    expect(suidoBigSize(65)).toBeNull();
  });

  it("scores every level 1 to 100 by what the answer uses and how tangled it is, in order, first near 1 and last near 100, in fairly even steps", () => {
    const exact = layouts.map((layout, index) => exactBigScoreOf(layout, levelSolution(rows[index]!)!));
    expect(SUIDO_BIG_SCORES).toEqual(exact.map((score) => Math.min(100, Math.max(1, Math.round(score)))));
    for (let at = 1; at < exact.length; at += 1) expect(exact[at]!, `level ${at + 1} is easier than level ${at}`).toBeGreaterThanOrEqual(exact[at - 1]!);
    expect(SUIDO_BIG_SCORES[0]!).toBeLessThanOrEqual(3);
    expect(SUIDO_BIG_SCORES[63]!).toBeGreaterThanOrEqual(97);
    const steps = exact.slice(1).map((score, at) => score - exact[at]!);
    expect(Math.max(...steps)).toBeLessThanOrEqual(4.5);
    // Even in the large: every tenth of the range holds levels, and no stretch of eight levels climbs by under eight or over thirty-five.
    for (let from = 0; from + 8 < exact.length; from += 4) {
      const climb = exact[from + 8]! - exact[from]!;
      expect(climb, `levels ${from + 1} to ${from + 9}`).toBeGreaterThan(8);
      expect(climb, `levels ${from + 1} to ${from + 9}`).toBeLessThan(35);
    }
    for (let level = 1; level <= 64; level += 1) {
      expect(suidoBigScore(level)).toBe(SUIDO_BIG_SCORES[level - 1]);
      expect(suidoBigMarks(level)).toBe(Math.min(5, 1 + Math.floor(SUIDO_BIG_SCORES[level - 1]! / 20)));
    }
    expect(suidoBigScore(0)).toBeNull();
    expect(suidoBigMarks(65)).toBeNull();
  });

  it("counts every level's coverage: the share of pieces the water goes through is the whole board on a network, and the size term climbs with it", () => {
    for (const [index, layout] of layouts.entries()) {
      const answer = levelSolution(rows[index]!)!;
      expect(coverageOf(layout, answer), `level ${index + 1}`).toBe(1);
      expect(usedPiecesOf(layout, answer)).toBe(layout.cells.filter((mask) => mask !== 0).length);
    }
    expect(sizeTermOf(BIG_PIECES_SMALLEST)).toBe(0);
    expect(sizeTermOf(BIG_PIECES_LARGEST)).toBe(1);
    expect(sizeTermOf(100)).toBeGreaterThan(sizeTermOf(50));
    expect(blendBigScore(BIG_PIECES_SMALLEST, 1)).toBe(1);
    expect(blendBigScore(BIG_PIECES_LARGEST, 100)).toBe(100);
  });

  it("files each level by its board and in a third of the set, and teaches a twist at each block's 15th level and tests it at its 16th after the first block's blocks", () => {
    expect(suidoBigLevelOf(rows[11]![0])).toBe(12);
    expect(suidoBigLevelOf("nothing")).toBeNull();
    expect(suidoBigBand(1)).toBe("easy");
    expect(suidoBigBand(33)).toBe("medium");
    expect(suidoBigBand(64)).toBe("hard");
    for (let at = 0; at < 14; at += 1) expect(rows[at]![2], `level ${at + 1}`).toBe("big-pieces");
    for (let block = 1; block <= 4; block += 1) {
      expect(suidoBigRole(block * 16 - 1)?.role, `block ${block}`).toBe("teaches");
      expect(suidoBigRole(block * 16)?.role, `block ${block}`).toBe("tests");
    }
    expect(suidoBigRole(1)).toBeNull();
    expect(suidoBigRole(15)?.newOnes).toContain("block-turns");
    expect(suidoBigRole(31)?.newOnes).toContain("pumps");
    expect(suidoBigRole(47)?.newOnes).toContain("walls");
    expect(suidoBigRole(63)?.newOnes).toContain("wrap");
  });
});

describe("how the big-pieces levels open", () => {
  const upTo = (last: number) => new Set(Array.from({ length: last }, (_, at) => at + 1));

  it("opens the first block to a newcomer and each next block once the one before is all solved", () => {
    expect(isSuidoBigLevel(1)).toBe(true);
    expect(isSuidoBigLevel(64)).toBe(true);
    expect(isSuidoBigLevel(0)).toBe(false);
    expect(isSuidoBigLevel(65)).toBe(false);
    expect(isSuidoBigLevel(2.5)).toBe(false);
    expect(openSuidoBigLevels(new Set())).toBe(16);
    expect(nextSuidoBigLevel(new Set())).toBe(1);
    expect(openSuidoBigLevels(upTo(15))).toBe(16);
    expect(nextSuidoBigLevel(upTo(15))).toBe(16);
    expect(openSuidoBigLevels(upTo(16))).toBe(32);
    expect(nextSuidoBigLevel(upTo(16))).toBe(17);
    expect(openSuidoBigLevels(upTo(64))).toBe(64);
    expect(nextSuidoBigLevel(upTo(64))).toBe(64);
    expect(firstUnsolvedSuidoBigLevel(new Set([1, 2, 4]))).toBe(3);
    expect(firstUnsolvedSuidoBigLevel(upTo(64))).toBeNull();
  });
});
