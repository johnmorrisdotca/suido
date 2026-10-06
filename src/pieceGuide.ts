import { BIG_FAMILIES, BIG_SHAPES, bigMasksOf } from "./bigPieces.ts";
import type { Layout } from "./code.ts";
import { NORTH, SHAPE_MASKS, rotationsOf } from "./pieces.ts";

/**
 * A GUIDE TO EVERY PIECE. Each entry is a piece of Suido and a tiny board with just that piece on it, drawn by the package's own
 * `drawSuido` (`drawGuidePiece` in `@johnmorrisdotca/suido/draw`), so the guide on a page, in the README and in `docs/PIECES.md`
 * shows what a board shows. Five groups:
 *
 *     turn    the pieces a tap turns: ground, an end, a straight, an elbow, a tee, a cross
 *     water   where the water starts and where it must end: a pump, a drain, and the two joined
 *     twist   what a board adds to a piece or to an edge: a locked piece, a wall, edges that join
 *     big     big pieces: a square of four cells that is one piece, with one, two or three separate pipes inside
 *     block   a block that turns as one: four ordinary pieces that a tap turns together
 */
export type PieceGroup = "turn" | "water" | "twist" | "big" | "block";

/** The groups, in the order a guide shows them. */
export const PIECE_GROUPS: readonly PieceGroup[] = ["turn", "water", "twist", "big", "block"];

/** One piece of the guide. */
export type GuidePiece = {
  /** Its name in the address of a page or the name of a picture: lower case words joined with hyphens. */
  id: string;
  group: PieceGroup;
  /** Its name, in English. */
  name: string;
  /** What it is and what it does, in a sentence or two, in English. */
  text: string;
  /** A board with the piece on it. Drawn as it is, so a pump the water leaves from shows its water. */
  layout: Layout;
  /** Whether the picture shows the water. */
  water: boolean;
  /** How many ways it faces when it is turned: 1, 2 or 4; null for a thing that is not turned. */
  facings: number | null;
};

const board = (width: number, height: number, cells: number[], more: Partial<Layout> = {}): Layout => ({ width, height, kind: "drains", wrap: false, cells, sources: [], drains: [], ...more });

const ways = (mask: number): number => rotationsOf(mask).length;

const turning = (id: string, name: string, mask: number, text: string): GuidePiece => ({ id, group: "turn", name, text, layout: { ...board(1, 1, [mask]), kind: "network" }, water: false, facings: mask === 0 ? null : ways(mask) });

/** A big piece drawn alone, facing north: a square of four cells, one piece. */
const plate = (shape: string): Layout => {
  const [tl, tr, br, bl] = bigMasksOf(shape, 0);
  return { ...board(2, 2, [tl!, tr!, bl!, br!]), kind: "network", bigs: [0] };
};

const big = (shape: string, id: string, name: string, text: string): GuidePiece => ({ id, group: "big", name, text, layout: plate(shape), water: false, facings: bigFacings(shape) });

function bigFacings(shape: string): number {
  const faces = new Set([0, 1, 2, 3].map((quarters) => bigMasksOf(shape, quarters).join()));
  return faces.size;
}

/**
 * EVERY PIECE, with a picture to draw it by. The big pieces here are the five kinds the generator always drew (`BIG_KINDS`) and a few of
 * the 699 shapes a big piece can be (`BIG_SHAPES`), picked to show what can be inside one; `SUIDO_BIG_FAMILIES_GUIDE` has one of each of its 32 families.
 */
export const SUIDO_PIECE_GUIDE: readonly GuidePiece[] = [
  turning("ground", "Ground", 0, "Bare ground, with nothing on it. Only boards whose water need not reach every piece have it, and it is never turned."),
  turning("end", "End", NORTH, "One opening: a pipe that stops. It faces any of four ways. Wherever the water reaches an end, the opening must meet the opening of a piece beside it, or the water runs out."),
  turning("straight", "Straight", SHAPE_MASKS.straight, "Two openings on opposite sides. It faces two ways, along or across, so a tap on it flips it."),
  turning("elbow", "Elbow", SHAPE_MASKS.elbow, "Two openings on sides that meet, a corner. It faces any of four ways."),
  turning("tee", "Tee", SHAPE_MASKS.tee, "Three openings, a pipe that branches. It faces any of four ways, and the water splits at it."),
  turning("cross", "Cross", SHAPE_MASKS.cross, "Four openings, a crossing where all four neighbours join. It looks the same turned, so a tap on it changes nothing."),
  { id: "pump", group: "water", name: "Pump", text: "Where the water comes from, drawn as a drop in a dark blue disc on a piece. A pump may sit on any piece but ground, and is turned like it. A board has one pump or several, and every pump fills its own pipes.", layout: board(1, 1, [SHAPE_MASKS.end], { sources: [0] }), water: false, facings: 4 },
  { id: "drain", group: "water", name: "Drain", text: "Where the water must end up, a round bowl on a piece that fills when the water reaches it. On a board of drains the water must reach every drain, and pieces it does not need may stay dry and face any way.", layout: board(1, 1, [SHAPE_MASKS.end], { drains: [0] }), water: false, facings: 4 },
  { id: "pump-and-drain", group: "water", name: "Pump to drain", text: "A pump and a drain with their openings joined: the water runs from the one to the other and fills both. It is the whole of the game: turn the pieces until every drain is reached and nothing leaks.", layout: board(2, 1, [2, 8], { sources: [0], drains: [1] }), water: true, facings: null },
  { id: "locked", group: "twist", name: "Locked piece", text: "A piece that cannot be turned, marked by a small padlock. It stays as the board gives it, so it is a fixed point to work from.", layout: { ...board(1, 1, [3]), kind: "network", locked: [0] }, water: false, facings: null },
  { id: "wall", group: "twist", name: "Wall", text: "A thick bar across the edge between two cells, which the water cannot cross: two pieces that face each other across it do not join.", layout: board(2, 1, [2, 8], { sources: [0], drains: [1], walls: [0] }), water: true, facings: null },
  { id: "wrap", group: "twist", name: "Edges that join", text: "A board with a dashed red rim: a pipe that leaves one side comes in at the opposite side, so the board is a ring and its edge is no edge.", layout: board(3, 3, [0, 0, 0, 8, 0, 2, 0, 0, 0], { wrap: true, sources: [3], drains: [5] }), water: true, facings: null },
  big("3c92", "big-snake", "Big piece: one pipe, one opening", "A square of four cells that is one piece, with one pipe in it that winds round and stops: a single opening. It turns as a whole, a quarter at a time."),
  big("5593", "big-hairpin", "Big piece: a hairpin", "One pipe that goes in and comes straight back out, so both of its openings are side by side on one edge of the square."),
  big("5555", "big-two-straights", "Big piece: two pipes side by side", "Two pipes that run past each other and never meet, however close: the water in one never reaches the other. Four openings, two on each of two opposite sides. It faces two ways."),
  big("53a3", "big-two-elbows", "Big piece: one corner inside another", "Two pipes, each a corner, one bending inside the other. They never meet. Four openings, on two sides that meet."),
  big("5775", "big-through-and-branch", "Big piece: one pipe through, one branching", "One pipe runs straight through the square while the other branches off to the side. Six openings, two on each of three sides."),
  big("39aa", "big-hairpin-over-straight", "Big piece: a hairpin and a straight pipe", "A U-shaped pipe with both openings on one edge, and a straight pipe running across the opposite side of the square. They never meet."),
  big("2baa", "big-branch-and-straight", "Big piece: a branching pipe and a straight one", "A pipe that comes in, branches, and has one branch ending inside the square, beside a pipe that runs straight across."),
  big("2b8e", "big-two-stubbed-pipes", "Big piece: two pipes with a stub inside", "Two pipes of two openings each. Each is a tee with one of its branches ending inside the square."),
  big("118a", "big-three-pipes", "Big piece: three pipes, one opening each", "Three separate pipes in a square of four cells: two short stubs and a longer one that goes in and stops inside. None is joined to another."),
  big("2b6c", "big-three-pipes-two-openings", "Big piece: three pipes, two openings each", "Three separate pipes of two openings each: two plain corners and a pipe with a branch that stops inside the square."),
  big("17fe", "big-crossing-and-stub", "Big piece: a crossing inside, and a stub", "One pipe with six openings, a cross and tees joined inside the square, and a stub of its own beside it."),
  big("bffe", "big-grid", "Big piece: a grid of crossings", "One pipe with eight openings, the most a square has: every cell a tee or a cross, so the water goes every way inside it."),
  big("bbee", "big-two-tee-pipes", "Big piece: two pipes of two tees", "Two pipes of four openings each, every cell a tee: eight openings in all, and water that never crosses from one pipe to the other."),
  { id: "block-turn", group: "block", name: "Block that turns as one", text: "Four ordinary pieces, a corner, an end, a straight and a tee, that cannot be turned on their own. A tap turns the whole square a quarter, and each piece moves round to the next place as it turns, like a bigger piece that is not joined inside.", layout: { ...board(2, 2, [3, 8, 5, 7]), kind: "network", blocks: [0] }, water: false, facings: 4 },
];

/** The entry with this id, or undefined. */
export function guidePieceById(id: string): GuidePiece | undefined {
  return SUIDO_PIECE_GUIDE.find((piece) => piece.id === id);
}

/** The pieces of one group, in the order of the guide. */
export function guidePiecesOf(group: PieceGroup): GuidePiece[] {
  return SUIDO_PIECE_GUIDE.filter((piece) => piece.group === group);
}

/**
 * ONE BIG PIECE OF EACH FAMILY. A family is the big pieces whose pipes have the same number of openings, written largest first: `2+2` is two
 * pipes of two openings each, and `1+1+1` is three pipes of one opening each. There are 32, and each entry shows the first shape of its family
 * (`BIG_SHAPES`), with how many shapes the family has in all.
 */
export const SUIDO_BIG_FAMILIES_GUIDE: readonly GuidePiece[] = BIG_FAMILIES.map((family) => {
  const shape = BIG_SHAPES.find((each) => each.family === family.family)!;
  const pipes = family.pipes === 1 ? "one pipe" : family.pipes === 2 ? "two separate pipes" : "three separate pipes";
  return {
    id: `family-${family.family.replace(/\+/g, "-")}`,
    group: "big" as const,
    name: family.family,
    text: `${pipes} with ${family.openings === 1 ? "one opening" : `${family.openings} openings`} in all (${family.family.split("+").join(", ")}): ${family.shapes} ${family.shapes === 1 ? "shape" : "shapes"}.`,
    layout: plate(shape.id),
    water: false,
    facings: bigFacings(shape.id),
  };
});
