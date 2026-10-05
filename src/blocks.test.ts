import { describe, expect, it } from "vitest";

import { BIG_KINDS, bigKindOf, bigMasksOf, placeBlocks, type BigKind } from "./bigPieces.ts";
import { blockAt, blockCells, blockFacings, blockInfo, blockQuartersBetween, canTurnBlock, hasBlocks, isJoinedInside, placeAfter, sameBlock, turnBlock } from "./blocks.ts";
import { decodeLayout, encodeLayout, neighboursOf, type Layout } from "./code.ts";
import { seededRandom } from "./random.ts";

/** A big piece's four masks (clockwise from the top left) as the masks of a 2 by 2 board, by cell. */
const byCell = (masks: readonly number[]): number[] => [masks[0]!, masks[1]!, masks[3]!, masks[2]!];

/** Four-by-three board with a block at cell 1 (cells 1, 2, 5, 6) and a big piece at cell 8 (cells 8, 9, 12, 13) on a 4-wide, 4-high board. */
const board: Layout = { width: 4, height: 4, kind: "network", wrap: false, cells: [3, 1, 3, 5, 9, 2, 6, 5, 5, 5, 6, 5, 5, 5, 6, 5], sources: [0], drains: [], blocks: [1] };

describe("a block", () => {
  it("is named by its top left cell and has four cells, clockwise from it", () => {
    expect(blockCells(5, 4)).toEqual([5, 6, 10, 9]);
    const info = blockInfo(board);
    expect(info.blocks).toHaveLength(1);
    expect(info.blocks[0]).toMatchObject({ anchor: 1, big: false, cells: [1, 2, 6, 5] });
    expect(blockAt(board, 6)?.anchor).toBe(1);
    expect(blockAt(board, 0)).toBeNull();
    expect(hasBlocks(board)).toBe(true);
    expect(hasBlocks({})).toBe(false);
    expect(sameBlock(board, 1, 6)).toBe(true);
    expect(sameBlock(board, 1, 0)).toBe(false);
  });

  it("turns as one: each piece moves to the next cell round and turns a quarter, and four turns bring it home", () => {
    const block = blockInfo(board).blocks[0]!;
    const once = turnBlock(board.cells, block, 1);
    // The piece in the top left (cell 1) is now in the top right (cell 2), turned a quarter clockwise: north becomes east.
    expect(once[2]).toBe(2);
    // The piece in the top right (cell 2, an elbow facing north and east) is now in the bottom right, turned: east and south.
    expect(once[6]).toBe(6);
    expect(board.cells).toEqual([3, 1, 3, 5, 9, 2, 6, 5, 5, 5, 6, 5, 5, 5, 6, 5]);
    let again = board.cells;
    for (let i = 0; i < 4; i += 1) again = turnBlock(again, block, 1);
    expect(again).toEqual(board.cells);
    expect(turnBlock(turnBlock(board.cells, block, 1), block, -1)).toEqual(board.cells);
    expect(turnBlock(board.cells, block, 5)).toEqual(once);
  });

  it("knows how many quarters make one facing of its pieces into another, and which facings it has", () => {
    const block = blockInfo(board).blocks[0]!;
    for (let quarters = 0; quarters < 4; quarters += 1) expect(blockQuartersBetween(board.cells, turnBlock(board.cells, block, quarters), block)).toBe(quarters);
    expect(blockQuartersBetween(board.cells, board.cells.map((mask, cell) => (cell === 1 ? 15 : mask)), block)).toBeNull();
    expect(blockFacings(board.cells, block)).toHaveLength(4);
    // Four crosses look the same however the block is turned: nothing to tap.
    const crosses = board.cells.map((mask, cell) => (block.cells.includes(cell) ? 15 : mask));
    expect(blockFacings(crosses, block)).toHaveLength(1);
    expect(canTurnBlock(crosses, block)).toBe(false);
    expect(canTurnBlock(board.cells, block)).toBe(true);
  });

  it("says where a piece is once its block has been turned", () => {
    const block = blockInfo(board).blocks[0]!;
    expect(placeAfter(block, 1, 1)).toBe(2);
    expect(placeAfter(block, 2, 1)).toBe(6);
    expect(placeAfter(block, 6, 3)).toBe(2);
    expect(placeAfter(block, 5, -1)).toBe(6);
    expect(placeAfter(null, 3, 2)).toBe(3);
  });
});

describe("a big piece", () => {
  const kinds = Object.keys(BIG_KINDS) as BigKind[];

  it("is joined inside in every kind and every facing: two cells that meet either both open towards each other or neither does", () => {
    for (const kind of kinds) {
      for (let quarters = 0; quarters < 4; quarters += 1) {
        const masks = bigMasksOf(kind, quarters);
        expect(masks, `${kind} ${quarters}`).toHaveLength(4);
        expect(isJoinedInside(byCell(masks), { index: 0, anchor: 0, big: true, cells: blockCells(0, 2) }), `${kind} ${quarters}`).toBe(true);
      }
    }
  });

  it("has the openings the kinds say: one, two, four, four and six, at most two on a side", () => {
    const ports = (kind: BigKind): number => {
      const masks = bigMasksOf(kind, 0);
      // The sides of a 2 by 2 square that face out: north of the top two, east of the right two, south of the bottom two, west of the left two.
      const out = [[0, 1], [1, 2], [2, 3], [0, 3]];
      return out.reduce((sum, cells, side) => sum + cells.filter((cell) => ((masks[cell]! >> side) & 1) === 1).length, 0);
    };
    expect(kinds.map(ports)).toEqual([1, 2, 4, 4, 6]);
  });

  it("is recognised in any facing, and refuses four pieces that are none of the kinds", () => {
    for (const kind of kinds) {
      for (let quarters = 0; quarters < 4; quarters += 1) expect(bigKindOf(bigMasksOf(kind, quarters))?.kind, kind).toBeDefined();
    }
    expect(bigKindOf([0, 0, 0, 0])).toBeNull();
    expect(bigKindOf([15, 15, 15, 15])).toBeNull();
  });

  it("faces two ways for a straight pair of pipes and four for every other kind", () => {
    const block = { index: 0, anchor: 0, big: true, cells: blockCells(0, 2) } as const;
    expect(kinds.map((kind) => blockFacings(byCell(bigMasksOf(kind, 0)), block).length)).toEqual([4, 4, 2, 4, 4]);
  });
});

describe("placing blocks on a board", () => {
  it("puts them apart, with no big piece beside another big piece and no opening of a big piece off the board", () => {
    const random = seededRandom(5);
    for (const [width, height, wrap] of [[8, 8, false], [10, 7, false], [9, 9, true], [20, 20, false]] as const) {
      const near = neighboursOf({ width, height, wrap });
      const placed = placeBlocks(near, width, height, 5, 3, random);
      expect(placed.length).toBeGreaterThanOrEqual(5);
      const taken = new Set<number>();
      for (const block of placed) {
        const cells = blockCells(block.anchor, width);
        expect(block.anchor % width).toBeLessThanOrEqual(width - 2);
        for (const cell of cells) {
          expect(taken.has(cell)).toBe(false);
          taken.add(cell);
        }
        if (block.kind === null) continue;
        const masks = bigMasksOf(block.kind, block.quarters);
        cells.forEach((cell, at) => {
          for (let side = 0; side < 4; side += 1) if (((masks[at]! >> side) & 1) === 1 && !cells.includes(near[cell * 4 + side]!)) expect(near[cell * 4 + side]).not.toBe(-1);
        });
      }
      for (const block of placed.filter((one) => one.kind !== null)) {
        const cells = blockCells(block.anchor, width);
        for (const cell of cells) for (let side = 0; side < 4; side += 1) {
          const next = near[cell * 4 + side]!;
          if (next !== -1 && !cells.includes(next)) expect(placed.some((other) => other !== block && other.kind !== null && blockCells(other.anchor, width).includes(next)), `${width}x${height}`).toBe(false);
        }
      }
    }
  });

  it("places fewer where there is no room, and none on a board with no square to put one in", () => {
    const near = neighboursOf({ width: 3, height: 3, wrap: false });
    expect(placeBlocks(near, 3, 3, 0, 9, seededRandom(1)).length).toBeLessThanOrEqual(1);
    expect(placeBlocks(neighboursOf({ width: 2, height: 2, wrap: false }), 2, 2, 0, 4, seededRandom(1))).toHaveLength(1);
  });
});

describe("a board with blocks, as a code", () => {
  const big: Layout = { width: 4, height: 3, kind: "network", wrap: false, cells: [...bigMasksOf("elbow", 0).slice(0, 2), 5, 1, ...[1, 1, 1, 1], ...bigMasksOf("elbow", 0).slice(2).reverse(), 1, 1], sources: [8], drains: [] };

  it("writes the big pieces after `;b` and the blocks that turn after `;k`, and reads them back", () => {
    const layout: Layout = { ...board, bigs: [8], blocks: [1] };
    // Cells 8, 9, 12 and 13 must be joined inside for a big piece: the board's are (5, 5, 5, 5).
    const code = encodeLayout(layout);
    expect(code.endsWith(";b8;k1")).toBe(true);
    expect(decodeLayout(code)).toEqual(layout);
    expect(encodeLayout(big)).not.toContain(";b");
  });

  it("refuses blocks that are not as they must be", () => {
    const base = encodeLayout(board);
    expect(decodeLayout(base)).toEqual(board);
    // Off the edge of the board.
    expect(decodeLayout(encodeLayout({ ...board, blocks: [3] }))).toBeNull();
    expect(decodeLayout(encodeLayout({ ...board, blocks: [12] }))).toBeNull();
    // Overlapping, or in both lists.
    expect(decodeLayout(encodeLayout({ ...board, blocks: [1, 2] }))).toBeNull();
    expect(decodeLayout(encodeLayout({ ...board, bigs: [5], blocks: [1] }))).toBeNull();
    // The source is in the block.
    expect(decodeLayout(encodeLayout({ ...board, blocks: [0] }))).toBeNull();
    // A big piece not joined inside: cell 1 opens east, cell 2 does not open back.
    expect(decodeLayout(encodeLayout({ ...board, blocks: undefined, bigs: [1], cells: board.cells.map((mask, cell) => (cell === 1 ? 2 : mask)) }))).toBeNull();
    // Only a network has blocks.
    expect(decodeLayout(encodeLayout({ ...board, kind: "drains", drains: [15] }))).toBeNull();
    // A wall between two cells of one block, but not one on its outer edge.
    for (const inside of [2, 3, 5, 10]) expect(decodeLayout(encodeLayout({ ...board, walls: [inside] })), `wall ${inside}`).toBeNull();
    for (const outside of [4, 0, 7, 11]) expect(decodeLayout(encodeLayout({ ...board, walls: [outside] }))?.walls, `wall ${outside}`).toEqual([outside]);
  });
});
