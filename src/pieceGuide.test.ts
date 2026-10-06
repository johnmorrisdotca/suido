import { describe, expect, it } from "vitest";

import { BIG_FAMILIES, BIG_KINDS, bigShapeOf } from "./bigPieces.ts";
import { blockInfo, isJoinedInside } from "./blocks.ts";
import { drawGuidePiece } from "./drawGuide.ts";
import { flowOf } from "./flow.ts";
import { guidePieceById, guidePiecesOf, PIECE_GROUPS, SUIDO_BIG_FAMILIES_GUIDE, SUIDO_PIECE_GUIDE } from "./pieceGuide.ts";
import { shapeOf } from "./pieces.ts";

describe("the guide to every piece", () => {
  it("has the five groups, each with pieces, and every id once, named in words that end in a stop", () => {
    expect(PIECE_GROUPS).toEqual(["turn", "water", "twist", "big", "block"]);
    for (const group of PIECE_GROUPS) expect(guidePiecesOf(group).length, group).toBeGreaterThan(0);
    const ids = SUIDO_PIECE_GUIDE.map((piece) => piece.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const piece of SUIDO_PIECE_GUIDE) {
      expect(piece.id, piece.id).toMatch(/^[a-z]+(-[a-z]+)*$/);
      expect(piece.name.length, piece.id).toBeGreaterThan(2);
      expect(piece.text, piece.id).toMatch(/[.]$/);
      expect(guidePieceById(piece.id)).toBe(piece);
    }
    expect(guidePieceById("nothing")).toBeUndefined();
  });

  it("shows every shape of piece that is turned: ground, an end, a straight, an elbow, a tee and a cross, with the ways each faces", () => {
    const turned = guidePiecesOf("turn");
    expect(turned.map((piece) => shapeOf(piece.layout.cells[0]!))).toEqual(["blank", "end", "straight", "elbow", "tee", "cross"]);
    expect(turned.map((piece) => piece.facings)).toEqual([null, 4, 2, 4, 4, 1]);
  });

  it("shows a pump, a drain and the two joined with water between, a locked piece, a wall and edges that join", () => {
    expect(guidePieceById("pump")!.layout.sources).toEqual([0]);
    expect(guidePieceById("drain")!.layout.drains).toEqual([0]);
    const joined = guidePieceById("pump-and-drain")!;
    expect(flowOf(joined.layout).solved).toBe(true);
    expect(guidePieceById("locked")!.layout.locked).toEqual([0]);
    const wall = guidePieceById("wall")!;
    expect(wall.layout.walls).toEqual([0]);
    expect(flowOf(wall.layout).solved).toBe(false);
    const wrap = guidePieceById("wrap")!;
    expect(wrap.layout.wrap).toBe(true);
    expect(flowOf(wrap.layout).solved).toBe(true);
  });

  it("shows big pieces that are joined inside, are none of them just the five kinds, and hold one, two and three pipes", () => {
    const bigs = guidePiecesOf("big");
    expect(bigs.length).toBeGreaterThanOrEqual(12);
    const pipes = new Set<number>();
    const named = new Set<string>();
    for (const piece of bigs) {
      const info = blockInfo(piece.layout);
      expect(info.blocks, piece.id).toHaveLength(1);
      expect(info.blocks[0]!.big, piece.id).toBe(true);
      expect(isJoinedInside(piece.layout.cells, info.blocks[0]!), piece.id).toBe(true);
      const found = bigShapeOf(info.blocks[0]!.cells.map((cell) => piece.layout.cells[cell]!))!;
      expect(found, piece.id).not.toBeNull();
      pipes.add(found.shape.pipes);
      if (found.shape.named !== null) named.add(found.shape.named);
    }
    expect([...pipes].sort()).toEqual([1, 2, 3]);
    expect([...named].sort()).toEqual(Object.keys(BIG_KINDS).sort());
    expect(bigs.length - named.size).toBeGreaterThanOrEqual(7);
  });

  it("shows a block that turns as one, four ordinary pieces that are not joined inside", () => {
    const [block] = guidePiecesOf("block");
    const info = blockInfo(block!.layout);
    expect(info.blocks).toHaveLength(1);
    expect(info.blocks[0]!.big).toBe(false);
    expect(new Set(block!.layout.cells.map(shapeOf)).size).toBe(4);
  });

  it("has one big piece of each of the 32 families, each drawn, and names what each holds", () => {
    expect(SUIDO_BIG_FAMILIES_GUIDE).toHaveLength(BIG_FAMILIES.length);
    expect(SUIDO_BIG_FAMILIES_GUIDE).toHaveLength(32);
    for (const [at, piece] of SUIDO_BIG_FAMILIES_GUIDE.entries()) {
      const info = blockInfo(piece.layout);
      expect(bigShapeOf(info.blocks[0]!.cells.map((cell) => piece.layout.cells[cell]!))!.shape.family, piece.id).toBe(BIG_FAMILIES[at]!.family);
      expect(piece.text, piece.id).toContain(BIG_FAMILIES[at]!.family.split("+").join(", "));
    }
    expect(new Set(SUIDO_BIG_FAMILIES_GUIDE.map((piece) => piece.id)).size).toBe(32);
  });

  it("is drawn by the package, with the water in the pictures that show it, and the name for a screen reader", () => {
    for (const piece of [...SUIDO_PIECE_GUIDE, ...SUIDO_BIG_FAMILIES_GUIDE]) {
      const svg = drawGuidePiece(piece);
      expect(svg, piece.id).toMatch(/^<svg [^>]*class="suido"/);
      expect(svg, piece.id).toContain(`aria-label="${piece.name}"`);
      expect(svg.includes("sd-fill") || svg.includes("sd-water") || piece.water === false, piece.id).toBe(true);
    }
    expect(drawGuidePiece(guidePieceById("pump")!, { label: "A pump", style: true })).toContain("<style>");
  });
});
