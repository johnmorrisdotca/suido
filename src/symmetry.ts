import type { Layout } from "./code.ts";
import { encodeLayout, neighboursOf } from "./code.ts";
import { flowOf } from "./flow.ts";
import { rotationsOf, turn } from "./pieces.ts";

/** A piece as the board looks in a mirror: east and west swapped. */
function mirrored(mask: number): number {
  return (mask & 5) | ((mask & 2) << 2) | ((mask & 8) >> 2);
}

/** A board's cells, pumps, drains, locks and walls moved by one of the eight turns and mirrors: `op` 0 to 3 turn it a quarter at a time, 4 to 7 do so after a mirror. */
export function transformLayout(layout: Layout, op: number): Layout {
  const flip = op >= 4;
  const quarters = op & 3;
  let { width, height } = layout;
  // Each cell as a (column, row) in a board `width` by `height`, taken through the mirror and then the turns.
  const place = (cell: number): [number, number] => {
    let x = cell % layout.width;
    let y = Math.floor(cell / layout.width);
    let w = layout.width;
    let h = layout.height;
    if (flip) x = w - 1 - x;
    for (let q = 0; q < quarters; q += 1) {
      [x, y] = [h - 1 - y, x];
      [w, h] = [h, w];
    }
    return [x, y];
  };
  if (quarters % 2 === 1) [width, height] = [layout.height, layout.width];
  const to = (cell: number): number => {
    const [x, y] = place(cell);
    return y * width + x;
  };
  const cells = new Array<number>(layout.cells.length).fill(0);
  layout.cells.forEach((mask, cell) => {
    cells[to(cell)] = turn(flip ? mirrored(mask) : mask, quarters);
  });
  const sort = (list: number[]): number[] => list.sort((a, b) => a - b);
  const out: Layout = { ...layout, width, height, cells, sources: sort(layout.sources.map(to)), drains: sort(layout.drains.map(to)) };
  delete out.locked;
  delete out.walls;
  if (layout.locked !== undefined && layout.locked.length > 0) out.locked = sort(layout.locked.map(to));
  if (layout.walls !== undefined && layout.walls.length > 0) {
    const near = neighboursOf({ width, height, wrap: layout.wrap });
    out.walls = sort(
      layout.walls.map((edge) => {
        const cell = to(edge >> 1);
        // The side of the wall, 1 (east) or 2 (south), through the mirror and the turns.
        let side = (edge & 1) === 0 ? 1 : 2;
        if (flip && side === 1) side = 3;
        side = (side + quarters) & 3;
        if (side === 1) return cell * 2;
        if (side === 2) return cell * 2 + 1;
        const next = near[cell * 4 + side]!;
        return side === 3 ? next * 2 : next * 2 + 1;
      }),
    );
  }
  return out;
}

/**
 * A board's identity up to turning and mirroring it: the smallest of the codes of
 * its eight turns and mirrors, with every piece the water does not go through
 * (it may face any way) set to one facing. Two boards with the same key are the
 * same puzzle. `solution` is the board with its pieces facing as an answer has them.
 */
export function symmetryKey(layout: Layout, solution: readonly number[]): string {
  const answer: Layout = { ...layout, cells: [...solution] };
  let best = "";
  for (let op = 0; op < 8; op += 1) {
    const turned = transformLayout(answer, op);
    // The spare pieces are set to one facing after the turn, since a turn changes the facing a piece was set to.
    const flow = flowOf(turned, turned.cells);
    const code = encodeLayout({ ...turned, cells: turned.cells.map((mask, cell) => (flow.wet[cell] === true ? mask : Math.min(...rotationsOf(mask)))) });
    if (best === "" || code < best) best = code;
  }
  return best;
}
