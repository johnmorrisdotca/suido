import type { Layout } from "./code.ts";
import { turn } from "./pieces.ts";

/**
 * BLOCKS: a square of four cells that turns as one. A tap on it moves the
 * whole square a quarter clockwise: the piece in each cell moves to the next
 * cell round the square and turns a quarter with it, so the square as a whole
 * is turned in place, like a bigger piece.
 *
 * Two twists use it, and they differ only in what the four pieces are:
 *
 *  - BIG PIECES (`Layout.bigs`): the four cells are one big piece. Wherever two of
 *    its cells meet, either both open towards each other or neither does, so its
 *    pipes join inside it, and it is drawn as one piece with up to eight openings
 *    (two on each side, one for each cell on that side).
 *  - BLOCK TURNS (`Layout.blocks`): four ordinary pieces that cannot be turned on
 *    their own. Only the square turns, from the corner where the four cells meet.
 *
 * A block is named by its top left cell, the anchor. Its cells go round it
 * clockwise: top left, top right, bottom right, bottom left. Blocks never
 * overlap, never cross the edge of a board that wraps, and hold no pump, no
 * locked piece and no wall between two of their own cells.
 */

/** A block: its anchor (top left cell), whether it is a big piece, and its four cells clockwise from the top left. */
export type Block = { index: number; anchor: number; big: boolean; cells: readonly [number, number, number, number] };

/** The blocks of a board, in the order of their anchors, and which block each cell is in (-1 for none). */
export type BlockInfo = { blocks: readonly Block[]; of: Int32Array };

const NONE: BlockInfo = { blocks: [], of: new Int32Array(0) };
const cache = new WeakMap<object, BlockInfo>();

/** The four cells of the block whose top left cell is `anchor`, clockwise from it. */
export function blockCells(anchor: number, width: number): [number, number, number, number] {
  return [anchor, anchor + 1, anchor + width + 1, anchor + width];
}

/** The blocks of a board and the block each cell is in; read once for a layout and kept. */
export function blockInfo(layout: Pick<Layout, "width" | "height" | "bigs" | "blocks">): BlockInfo {
  const bigs = layout.bigs ?? [];
  const turns = layout.blocks ?? [];
  if (bigs.length === 0 && turns.length === 0) return NONE;
  const kept = cache.get(layout);
  if (kept !== undefined) return kept;
  const all = [...bigs.map((anchor) => ({ anchor, big: true })), ...turns.map((anchor) => ({ anchor, big: false }))].sort((a, b) => a.anchor - b.anchor);
  const of = new Int32Array(layout.width * layout.height).fill(-1);
  const blocks = all.map(({ anchor, big }, index) => {
    const cells = blockCells(anchor, layout.width);
    for (const cell of cells) of[cell] = index;
    return { index, anchor, big, cells };
  });
  const info = { blocks, of };
  cache.set(layout, info);
  return info;
}

/** The block a cell is in, or null. */
export function blockAt(layout: Pick<Layout, "width" | "height" | "bigs" | "blocks">, cell: number): Block | null {
  const info = blockInfo(layout);
  const at = info.of[cell];
  return at === undefined || at < 0 ? null : info.blocks[at]!;
}

/** Whether a board has any block. */
export function hasBlocks(layout: Pick<Layout, "bigs" | "blocks">): boolean {
  return (layout.bigs?.length ?? 0) > 0 || (layout.blocks?.length ?? 0) > 0;
}

/**
 * The pieces of a board after a block is turned `by` quarters clockwise (a negative number turns it the other
 * way): the piece in each cell of the block moves round to the next and turns with the block. A new array.
 */
export function turnBlock(masks: readonly number[], block: Block, by = 1): number[] {
  const quarters = ((by % 4) + 4) % 4;
  const out = [...masks];
  for (let at = 0; at < 4; at += 1) out[block.cells[(at + quarters) % 4]!] = turn(masks[block.cells[at]!]!, quarters);
  return out;
}

/** How many quarters clockwise, 0 to 3, make the block's pieces in `from` the ones in `to`; null when no turn does. */
export function blockQuartersBetween(from: readonly number[], to: readonly number[], block: Block): number | null {
  for (let quarters = 0; quarters < 4; quarters += 1) {
    let same = true;
    for (let at = 0; at < 4 && same; at += 1) same = turn(from[block.cells[at]!]!, quarters) === to[block.cells[(at + quarters) % 4]!];
    if (same) return quarters;
  }
  return null;
}

/** Every distinct way a block can face, as the four masks of its cells (in `Block.cells` order), the turn of 0 quarters first. */
export function blockFacings(masks: readonly number[], block: Block): number[][] {
  const out: number[][] = [];
  const seen = new Set<string>();
  for (let quarters = 0; quarters < 4; quarters += 1) {
    const turned = turnBlock(masks, block, quarters);
    const facing = block.cells.map((cell) => turned[cell]!);
    const key = facing.join();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(facing);
  }
  return out;
}

/** Whether turning a block changes anything: a block of four crosses, or four pieces that look alike all round, never does. */
export function canTurnBlock(masks: readonly number[], block: Block): boolean {
  return blockFacings(masks, block).length > 1;
}

/**
 * Where the piece that stood in `cell` when the board was given is now, once its block has been turned
 * `quarters` times clockwise. A cell in no block never moves.
 */
export function placeAfter(block: Block | null, cell: number, quarters: number): number {
  if (block === null) return cell;
  const at = block.cells.indexOf(cell);
  return block.cells[(((at + quarters) % 4) + 4) % 4]!;
}

/** Whether two cells of a board are in the same block. */
export function sameBlock(layout: Pick<Layout, "width" | "height" | "bigs" | "blocks">, a: number, b: number): boolean {
  const info = blockInfo(layout);
  const x = info.of[a];
  return x !== undefined && x >= 0 && x === info.of[b];
}

/**
 * Whether the inside of a big piece is as it must be: wherever two of its cells meet, either both open towards
 * each other or neither does. A block turn has no such rule.
 */
export function isJoinedInside(masks: readonly number[], block: Block): boolean {
  const [tl, tr, br, bl] = block.cells;
  const bit = (cell: number, side: number): number => (masks[cell]! >> side) & 1;
  return bit(tl, 1) === bit(tr, 3) && bit(tr, 2) === bit(br, 0) && bit(bl, 1) === bit(br, 3) && bit(tl, 2) === bit(bl, 0);
}
