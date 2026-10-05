import { beforeAll, describe, expect, it } from "vitest";

import { checkSuidoAnswer } from "./check.ts";
import { decodeLayout, neighboursOf, type Layout } from "./code.ts";
import { difficultyOf, exactDifficultyOf } from "./difficulty.ts";
import { flowOf } from "./flow.ts";
import { twistRole } from "./ladder.ts";
import { SUIDO_BLOCK } from "./levelBlocks.ts";
import { declaredTwists, levelAnswer, levelSolution } from "./levelRow.ts";
import { loadSuidoLevels, SUIDO_LEVEL_COUNTS, sizeOf, suidoBand, suidoLevelOf, suidoLevelsOf, suidoMarks, suidoRole } from "./levels.ts";
import { SUIDO_MARKS } from "./levels/marks.data.ts";
import { solve, type SolveResult } from "./solve.ts";
import { symmetryKey } from "./symmetry.ts";
import { SUIDO_LEVEL_TWISTS, SUIDO_TWISTS, twistsOf } from "./twists.ts";

/**
 * EVERY SUIDO LEVEL OF ONE SIZE, PROVED AGAIN ON EVERY BUILD: the tests one
 * `levels.<size>.test.ts` runs, one file a size so vitest proves the sizes side
 * by side. Nothing the level script did is trusted: each board is solved from
 * scratch and must have exactly one answer, the one its row stores, and the
 * twists a row declares must be the twists its board has. Each level is solved
 * ONCE, before the tests, and the proof reads that one solve.
 */
export function levelSuite(size: string): void {
  describe(`suido at ${size}`, () => {
    let layouts: Layout[] = [];
    let solves: SolveResult[] = [];
    beforeAll(async () => {
      await loadSuidoLevels(size);
      layouts = suidoLevelsOf(size).map(([board]) => decodeLayout(board)!);
      solves = layouts.map((layout) => solve(layout, 2));
    }, 240_000);

    it("has as many levels as the board of levels counts, in whole blocks of sixteen, and at least sixty-four", () => {
      expect(suidoLevelsOf(size).length).toBe(SUIDO_LEVEL_COUNTS[size]);
      expect(suidoLevelsOf(size).length % SUIDO_BLOCK).toBe(0);
      expect(suidoLevelsOf(size).length).toBeGreaterThanOrEqual(64);
    });

    it("is a board of this size, with every board a code that decodes and none that starts solved", () => {
      const { width, height } = sizeOf(size)!;
      for (const [index, layout] of layouts.entries()) {
        expect(layout, `level ${index + 1}`).not.toBeNull();
        expect([layout.width, layout.height], `level ${index + 1}`).toEqual([width, height]);
        expect(flowOf(layout).solved, `level ${index + 1} starts solved`).toBe(false);
      }
    });

    it("proves every level has exactly one answer, the stored one, and that it checks", () => {
      for (const [index, row] of suidoLevelsOf(size).entries()) {
        const found = solves[index]!;
        expect(found.complete, `level ${index + 1} was not proved`).toBe(true);
        expect(found.count, `level ${index + 1} has ${found.count} answers`).toBe(1);
        const stored = levelSolution(row);
        expect(stored, `level ${index + 1}'s turns are not digits for its cells`).not.toBeNull();
        // The stored answer is the solver's, on every piece the water goes through: a spare may face any way.
        const flow = flowOf(layouts[index]!, stored!);
        expect(flow.solved, `level ${index + 1}'s stored answer is not solved`).toBe(true);
        const mine = found.solutions[0]!;
        for (let cell = 0; cell < mine.length; cell += 1) if (flow.wet[cell] === true) expect(stored![cell], `level ${index + 1}, cell ${cell}`).toBe(mine[cell]);
        expect(checkSuidoAnswer(row[0], levelAnswer(row)!), `level ${index + 1}`).toEqual({ ok: true });
      }
    });

    it("declares the twists its board has, and only those", () => {
      for (const [index, row] of suidoLevelsOf(size).entries()) {
        expect(row[2], `level ${index + 1}`).toBe(twistsOf(layouts[index]!).join(" "));
        for (const word of row[2].split(" ").filter(Boolean)) expect(SUIDO_TWISTS as readonly string[], `level ${index + 1}`).toContain(word);
        expect(declaredTwists(row)).toEqual(twistsOf(layouts[index]!));
      }
    });

    it("holds no two levels that are the same board turned or mirrored", () => {
      const keys = suidoLevelsOf(size).map((row, index) => symmetryKey(layouts[index]!, levelSolution(row)!));
      expect(new Set(keys).size).toBe(keys.length);
    }, 180_000);

    it("keeps a locked piece as its answer has it, and a wall off every pipe of the answer", () => {
      for (const [index, row] of suidoLevelsOf(size).entries()) {
        const layout = layouts[index]!;
        const answer = levelSolution(row)!;
        for (const cell of layout.locked ?? []) expect(answer[cell], `level ${index + 1}, locked ${cell}`).toBe(layout.cells[cell]);
        // The water of the answer, run on the board with no walls, goes along no wall.
        const bare = neighboursOf({ width: layout.width, height: layout.height, wrap: layout.wrap });
        const flow = flowOf(layout, answer);
        for (const edge of layout.walls ?? []) {
          const cell = edge >> 1;
          const side = (edge & 1) === 0 ? 1 : 2;
          const next = bare[cell * 4 + side]!;
          const through = flow.wet[cell] === true && flow.wet[next] === true && ((answer[cell]! >> side) & 1) === 1 && ((answer[next]! >> ((side + 2) & 3)) & 1) === 1;
          expect(through, `level ${index + 1}: a wall across the answer's pipe`).toBe(false);
        }
      }
    });

    it("names each level by its board, and files it in the third of the size it sits in", () => {
      const count = SUIDO_LEVEL_COUNTS[size]!;
      expect(suidoLevelOf(size, suidoLevelsOf(size)[11]![0])).toBe(12);
      expect(suidoBand(size, 1)).toBe("easy");
      expect(suidoBand(size, Math.ceil(count / 2))).toBe("medium");
      expect(suidoBand(size, count)).toBe("hard");
    });

    it("is no easier at any level than at the one before, by the measured difficulty among boards of its size", () => {
      let before = 0;
      for (const [index, row] of suidoLevelsOf(size).entries()) {
        const score = exactDifficultyOf(layouts[index]!, levelSolution(row)!);
        expect(score, `level ${index + 1} is easier than level ${index}`).toBeGreaterThanOrEqual(before);
        before = score;
      }
    }, 180_000);

    it("rises over the whole of its range: the first level is among the easiest of its size and the last among the hardest", () => {
      const rows = suidoLevelsOf(size);
      expect(difficultyOf(layouts[0]!, levelSolution(rows[0]!)!)).toBeLessThanOrEqual(8);
      expect(difficultyOf(layouts[rows.length - 1]!, levelSolution(rows[rows.length - 1]!)!)).toBeGreaterThanOrEqual(92);
    }, 180_000);

    it("marks every level 1 to 5 by its measured score, in steps of twenty", () => {
      const digits = suidoLevelsOf(size).map((row, index) => String(Math.min(5, 1 + Math.floor(difficultyOf(layouts[index]!, levelSolution(row)!) / 20)))).join("");
      expect(SUIDO_MARKS[size]).toBe(digits);
      for (let level = 1; level <= digits.length; level += 1) expect(suidoMarks(size, level)).toBe(Number(digits[level - 1]));
    }, 180_000);

    it("is plain through the first block, then teaches a twist at each block's 15th level and tests it at its 16th", () => {
      const rows = suidoLevelsOf(size);
      for (let at = 0; at < SUIDO_BLOCK; at += 1) expect(rows[at]![2], `level ${at + 1}`).toBe("");
      const blocks = rows.length / SUIDO_BLOCK;
      for (let block = 2; block <= Math.min(blocks, 16); block += 1) {
        const fifteenth = rows[block * SUIDO_BLOCK - 2]!;
        const sixteenth = rows[block * SUIDO_BLOCK - 1]!;
        expect(declaredTwists(fifteenth).length, `block ${block}'s 15th`).toBeGreaterThan(0);
        expect(declaredTwists(sixteenth).length, `block ${block}'s 16th`).toBeGreaterThan(0);
        expect(suidoRole(size, block * SUIDO_BLOCK - 1)).toEqual(twistRole(rows, block * SUIDO_BLOCK - 1));
        expect(suidoRole(size, block * SUIDO_BLOCK)).toEqual(twistRole(rows, block * SUIDO_BLOCK));
        expect(twistRole(rows, block * SUIDO_BLOCK - 1)!.role).toBe("teaches");
        expect(twistRole(rows, block * SUIDO_BLOCK)!.role).toBe("tests");
      }
    });

    it("teaches each twist its blocks have, in the order the levels list them, at a 15th that says it is new", () => {
      const rows = suidoLevelsOf(size);
      // A size of 256 levels has the six twists of the fixed levels, one new in each of its blocks 2 to 7; a huge size of four blocks teaches drains, pumps and wrap.
      const taught = rows.length <= SUIDO_BLOCK * 4 ? (["drains", "pumps", "wrap"] as const) : SUIDO_LEVEL_TWISTS;
      const firsts = taught.map((twist) => ({ twist, at: rows.findIndex((row) => declaredTwists(row).includes(twist)) }));
      for (const { twist, at } of firsts) {
        expect(at, `a ${twist} level`).toBeGreaterThanOrEqual(0);
        const role = twistRole(rows, at + 1);
        expect(role?.role, twist).toBe("teaches");
        expect(role?.newOnes, twist).toContain(twist);
      }
      for (let each = 1; each < firsts.length; each += 1) expect(firsts[each]!.at, firsts[each]!.twist).toBeGreaterThan(firsts[each - 1]!.at);
      // None of the twists a level cannot have (made boards only) is on a level.
      for (const row of rows) for (const twist of declaredTwists(row)) expect(SUIDO_LEVEL_TWISTS).toContain(twist);
    });

    it("mixes twists into the later blocks' other places, and into none of the first seven blocks' first fourteen", () => {
      const rows = suidoLevelsOf(size);
      rows.forEach((row, at) => {
        const slot = (at % SUIDO_BLOCK) + 1;
        if (at < SUIDO_BLOCK * 7 && slot < SUIDO_BLOCK - 1) expect(row[2], `level ${at + 1}`).toBe("");
      });
      // The sizes of four blocks have no eighth block to mix them in.
      if (rows.length <= SUIDO_BLOCK * 7) return;
      const later = rows.slice(SUIDO_BLOCK * 7).filter((row, at) => (at % SUIDO_BLOCK) + 1 < SUIDO_BLOCK - 1 && row[2] !== "");
      expect(later.length).toBeGreaterThan(10);
    });
  });
}
