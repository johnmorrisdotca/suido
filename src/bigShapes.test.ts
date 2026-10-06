import { describe, expect, it } from "vitest";

import { BIG_FAMILIES, BIG_KINDS, BIG_SHAPES, bigMasksOf, bigShapeById, bigShapeOf, placeBlocks, type BigKind } from "./bigPieces.ts";
import { blockCells, blockFacings, isJoinedInside } from "./blocks.ts";
import { neighboursOf } from "./code.ts";
import { makeUnscored } from "./generate.ts";
import { seededRandom } from "./random.ts";
import { solve } from "./solve.ts";

/** A big piece's four masks (clockwise from the top left) as the masks of a 2 by 2 board, by cell. */
const byCell = (masks: readonly number[]): number[] => [masks[0]!, masks[1]!, masks[3]!, masks[2]!];

const square = { index: 0, anchor: 0, big: true, cells: blockCells(0, 2) } as const;

/**
 * EVERY BIG PIECE THERE CAN BE: four cells, each a small piece, joined inside wherever both open towards each other.
 * The generator draws from all of them when asked (`bigKinds: "all"`), and still draws the five it always drew by default.
 */
describe("the big pieces there can be", () => {
  it("are 699 shapes up to turning, in 32 families, the five kinds among them", () => {
    expect(BIG_SHAPES).toHaveLength(699);
    expect(BIG_FAMILIES).toHaveLength(32);
    expect(BIG_FAMILIES.reduce((sum, family) => sum + family.shapes, 0)).toBe(699);
    expect(new Set(BIG_SHAPES.map((shape) => shape.id)).size).toBe(699);
    expect(BIG_SHAPES.filter((shape) => shape.named !== null).map((shape) => shape.named).sort()).toEqual((Object.keys(BIG_KINDS) as BigKind[]).sort());
  });

  it("are joined inside in every facing, with a piece in every cell and a way in to every pipe", () => {
    for (const shape of BIG_SHAPES) {
      for (let quarters = 0; quarters < 4; quarters += 1) {
        const masks = bigMasksOf(shape.id, quarters);
        expect(isJoinedInside(byCell(masks), square), `${shape.id} ${quarters}`).toBe(true);
        expect(masks.every((mask) => mask !== 0), `${shape.id} ${quarters}`).toBe(true);
      }
      expect(shape.openings, shape.id).toBeGreaterThanOrEqual(shape.pipes);
      expect(shape.openings, shape.id).toBeLessThanOrEqual(8);
      expect(shape.family.split("+").map(Number).reduce((sum, openings) => sum + openings, 0), shape.id).toBe(shape.openings);
      expect(shape.family.split("+")).toHaveLength(shape.pipes);
    }
  });

  it("hold one, two or three separate pipes, and have no ring of four cells joined round the middle", () => {
    expect([...new Set(BIG_SHAPES.map((shape) => shape.pipes))].sort()).toEqual([1, 2, 3]);
    for (const shape of BIG_SHAPES) {
      const [tl, tr, br, bl] = shape.masks;
      const joins = [(tl >> 1) & (tr >> 3), (tr >> 2) & (br >> 0), (bl >> 1) & (br >> 3), (tl >> 2) & (bl >> 0)].reduce((sum, bit) => sum + (bit & 1), 0);
      expect(joins, shape.id).toBeLessThanOrEqual(3);
    }
  });

  it("are found by id and by their masks in any facing, and refuse four pieces that are none of them", () => {
    for (const shape of BIG_SHAPES) {
      expect(bigShapeById(shape.id)).toBe(shape);
      for (let quarters = 0; quarters < 4; quarters += 1) {
        const found = bigShapeOf(bigMasksOf(shape.id, quarters));
        expect(found?.shape.id, `${shape.id} ${quarters}`).toBe(shape.id);
        expect(bigMasksOf(shape.id, found!.quarters)).toEqual(bigMasksOf(shape.id, quarters));
      }
    }
    expect(bigShapeOf([0, 0, 0, 0])).toBeNull();
    expect(bigShapeOf([15, 15, 15, 15])).toBeNull();
    expect(bigShapeOf([3, 12, 9])).toBeNull();
    expect(bigShapeById("nothing")).toBeUndefined();
    expect(() => bigMasksOf("nothing", 0)).toThrow();
  });

  it("face two ways for the straight pairs of pipes and four for the others", () => {
    const counts = new Set(BIG_SHAPES.map((shape) => blockFacings(byCell(shape.masks), square).length));
    expect([...counts].sort()).toEqual([2, 4]);
    expect(BIG_SHAPES.filter((shape) => blockFacings(byCell(shape.masks), square).length === 2).length).toBeGreaterThan(0);
  });

  it("have a cross, a tee, and pipes side by side inside them among the shapes", () => {
    const cellsOf = (shape: (typeof BIG_SHAPES)[number]) => shape.masks;
    expect(BIG_SHAPES.some((shape) => cellsOf(shape).some((mask) => mask === 15))).toBe(true);
    expect(BIG_SHAPES.some((shape) => cellsOf(shape).some((mask) => [7, 11, 13, 14].includes(mask)))).toBe(true);
    expect(BIG_SHAPES.some((shape) => shape.pipes === 3)).toBe(true);
  });
});

describe("placing big pieces drawn from all of them", () => {
  it("puts each where every opening has a cell beside it, and none beside another, and draws five kinds by default", () => {
    for (const mix of ["all", "five"] as const) {
      const placed = placeBlocks(neighboursOf({ width: 12, height: 12, wrap: false }), 12, 12, 8, 2, seededRandom(11), mix);
      expect(placed.filter((one) => one.kind !== null).length).toBeGreaterThanOrEqual(6);
      for (const one of placed) if (one.kind !== null && mix === "five") expect(Object.keys(BIG_KINDS)).toContain(one.kind);
    }
    const ids = new Set(placeBlocks(neighboursOf({ width: 20, height: 20, wrap: false }), 20, 20, 30, 0, seededRandom(3), "all").map((one) => one.kind));
    expect(ids.size).toBeGreaterThan(8);
  });

  it("keeps the boards a seed made before: the default is the five", () => {
    const board = makeUnscored({ size: 8, bigs: 3, seed: 21 });
    expect(makeUnscored({ size: 8, bigs: 3, bigKinds: "five", seed: 21 }).code).toBe(board.code);
    expect(makeUnscored({ size: 8, bigs: 3, bigKinds: "all", seed: 21 }).code).not.toBe(board.code);
  });

  it("makes boards with exactly one answer, whichever big pieces they hold", () => {
    for (let seed = 1; seed <= 12; seed += 1) {
      const made = makeUnscored({ size: 7 + (seed % 4), bigs: 2 + (seed % 3), blocks: seed % 2, bigKinds: "all", seed: seed * 977 });
      const found = solve(made.layout, 2);
      expect(found.complete, `seed ${seed}`).toBe(true);
      expect(found.count, `seed ${seed}`).toBe(1);
      expect(made.layout.bigs?.length ?? 0, `seed ${seed}`).toBeGreaterThan(0);
    }
  });
});
