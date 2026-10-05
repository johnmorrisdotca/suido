import { neighboursOf, type Layout } from "./code.ts";
import { hasBlocks } from "./blocks.ts";
import { drainFacings, rotationsOfLayout, scanFacings, SCAN } from "./facing.ts";
import { opposite } from "./pieces.ts";
import { countBits, refreshCells, unitsOf, wayHolds, type CellSets } from "./units.ts";

/** What the solver found. */
export type SolveResult = {
  /** How many answers there are, counted up to the limit asked for. */
  count: number;
  /** Each answer found, as the sides every piece opens on. In a drains board a piece the water does not reach stays as it was given. */
  solutions: number[][];
  /** The positions the search looked at, and how many of them had more than one way on to try. */
  nodes: number;
  branches: number;
  /** The pieces fixed by deduction alone, before the search had to guess anything. */
  forced: number;
  /** False when the budget ran out before the search was finished: `count` is then only how many were found so far. */
  complete: boolean;
};

/**
 * Counts the answers to a board, up to `limit`, stopping early when `budget`
 * positions have been looked at. One answer is the whole point of a board:
 * `count === 1 && complete` is the proof.
 *
 * A network is solved as a puzzle of what each piece may face: every piece
 * starts with its rotations, and a piece's opening on a side must be matched by
 * its neighbour's opening back (and an absence by an absence) until nothing
 * more can be removed; the search then picks the piece with fewest ways left
 * and tries each. Pieces the water could never reach, in any way the rest could
 * still face, end that branch at once. A drains board is solved the other way
 * round, because a spare piece may face any way: it grows a network from the
 * sources and the drains, settling what its openings force and trying what they
 * do not, and counts each distinct network once. An inlet-outlet board is solved
 * as a drains board in which a piece the water goes through opens on two sides
 * at most. Locked pieces have the one way they are given, and walls are edges the
 * neighbour table does not cross, so neither needs a rule of its own. A network
 * is solved in units (`units.ts`): a single piece is one, and a block that turns
 * as one is one, with its four turns for its facings.
 */
export function solve(layout: Layout, limit = 2, budget = 200_000): SolveResult {
  if (layout.kind !== "network" && hasBlocks(layout)) throw new Error("Only a network can have big pieces or blocks that turn.");
  return layout.kind === "network" ? solveNetwork(layout, limit, budget) : solveDrains(layout, limit, budget);
}

/** How many answers there are, counted up to `limit`. */
export function countSolutions(layout: Layout, limit = 2, budget = 200_000): number {
  return solve(layout, limit, budget).count;
}

function solveNetwork(layout: Layout, limit: number, budget: number): SolveResult {
  const count = layout.width * layout.height;
  const near = neighboursOf(layout);
  const units = unitsOf(layout);
  const solutions: number[][] = [];
  let nodes = 0;
  let branches = 0;
  let forced = 0;
  let complete = true;

  /** What the search knows at one position: which facings each unit may still have, and what that says of each cell. */
  type State = { dom: Uint8Array; sets: CellSets };
  const copy = (state: State): State => ({ dom: Uint8Array.from(state.dom), sets: { open: Uint8Array.from(state.sets.open), shut: Uint8Array.from(state.sets.shut), bare: Uint8Array.from(state.sets.bare) } });

  /** Removes from every unit the facings its neighbours rule out, until nothing more goes. False if a unit is left with none. */
  const propagate = ({ dom, sets }: State, queue: number[]): boolean => {
    const queued = new Uint8Array(units.count);
    for (const unit of queue) queued[unit] = 1;
    while (queue.length > 0) {
      const unit = queue.pop()!;
      queued[unit] = 0;
      const before = dom[unit]!;
      let keep = before;
      for (let way = 0; way < units.facings[unit]!.length; way += 1) if (((keep >> way) & 1) === 1 && !wayHolds(units, near, sets, unit, way)) keep &= ~(1 << way);
      if (keep === 0) return false;
      if (keep === before) continue;
      dom[unit] = keep;
      refreshCells(units, sets, unit, keep);
      for (const cell of units.cells[unit]!) {
        for (let side = 0; side < 4; side += 1) {
          const next = near[cell * 4 + side]!;
          if (next === -1) continue;
          const other = units.of[next]!;
          if (other !== unit && queued[other] === 0) {
            queued[other] = 1;
            queue.push(other);
          }
        }
      }
    }
    return true;
  };

  /** Whether the water could still reach every piece, if every piece faced the way it still may. */
  const reachesAll = ({ sets }: State): boolean => {
    const seen = new Uint8Array(count);
    const stack: number[] = [];
    for (const source of layout.sources) {
      seen[source] = 1;
      stack.push(source);
    }
    while (stack.length > 0) {
      const cell = stack.pop()!;
      for (let side = 0; side < 4; side += 1) {
        const next = near[cell * 4 + side]!;
        if (next === -1 || seen[next] === 1 || ((sets.open[cell]! >> side) & 1) === 0 || ((sets.open[next]! >> opposite(side)) & 1) === 0) continue;
        seen[next] = 1;
        stack.push(next);
      }
    }
    for (let cell = 0; cell < count; cell += 1) if (sets.bare[cell] === 0 && seen[cell] === 0) return false;
    return true;
  };

  const search = (state: State, queue: number[], root: boolean): void => {
    if (!complete || solutions.length >= limit) return;
    nodes += 1;
    if (nodes > budget) {
      complete = false;
      return;
    }
    if (!propagate(state, queue)) return;
    if (root) {
      for (let cell = 0; cell < count; cell += 1) if (state.sets.open[cell] !== 0 && (state.sets.open[cell]! & state.sets.shut[cell]!) === 0) forced += 1;
    }
    if (!reachesAll(state)) return;
    let pick = -1;
    let fewest = 17;
    for (let unit = 0; unit < units.count; unit += 1) {
      const ways = countBits(state.dom[unit]!);
      if (ways > 1 && ways < fewest) {
        fewest = ways;
        pick = unit;
      }
    }
    if (pick === -1) {
      const masks = new Array<number>(count).fill(0);
      units.cells.forEach((cells, unit) => {
        const way = Math.log2(state.dom[unit]!);
        cells.forEach((cell, at) => (masks[cell] = units.facings[unit]![way]![at]!));
      });
      solutions.push(masks);
      return;
    }
    branches += 1;
    for (let way = 0; way < units.facings[pick]!.length; way += 1) {
      if (((state.dom[pick]! >> way) & 1) === 0) continue;
      const next = copy(state);
      next.dom[pick] = 1 << way;
      refreshCells(units, next.sets, pick, 1 << way);
      search(next, [pick], false);
      if (!complete || solutions.length >= limit) return;
    }
  };

  const start: State = { dom: new Uint8Array(units.count), sets: { open: new Uint8Array(count), shut: new Uint8Array(count), bare: new Uint8Array(count) } };
  for (let unit = 0; unit < units.count; unit += 1) {
    start.dom[unit] = (1 << units.facings[unit]!.length) - 1;
    refreshCells(units, start.sets, unit, start.dom[unit]!);
  }
  search(start, Array.from({ length: units.count }, (_, unit) => unit), true);
  return { count: solutions.length, solutions, nodes, branches, forced, complete };
}

function solveDrains(layout: Layout, limit: number, budget: number): SolveResult {
  const count = layout.width * layout.height;
  const near = neighboursOf(layout);
  const rotations = rotationsOfLayout(layout);
  const seed = new Uint8Array(count);
  for (const cell of [...layout.sources, ...layout.drains]) seed[cell] = 1;
  const solutions: number[][] = [];
  let nodes = 0;
  let branches = 0;
  let forced = 0;
  let complete = true;

  const ways = (val: Int8Array, cell: number): { masks: number[]; need: number } => drainFacings(layout, near, rotations, val, cell);

  /** Whether the water could still reach every faced piece, drain and piece an opening is pressed against. */
  const reachesAll = (val: Int8Array, pending: number[]): boolean => {
    const possible = new Int8Array(count);
    for (let cell = 0; cell < count; cell += 1) {
      if (layout.cells[cell] === 0) continue;
      if (val[cell]! >= 0) possible[cell] = val[cell]!;
      else {
        scanFacings(layout, near, rotations, val, cell);
        possible[cell] = SCAN.any;
      }
    }
    const seen = new Uint8Array(count);
    const stack: number[] = [];
    for (const source of layout.sources) {
      seen[source] = 1;
      stack.push(source);
    }
    while (stack.length > 0) {
      const cell = stack.pop()!;
      for (let side = 0; side < 4; side += 1) {
        const next = near[cell * 4 + side]!;
        if (next === -1 || seen[next] === 1 || ((possible[cell]! >> side) & 1) === 0 || ((possible[next]! >> opposite(side)) & 1) === 0) continue;
        seen[next] = 1;
        stack.push(next);
      }
    }
    for (let cell = 0; cell < count; cell += 1) if (val[cell]! >= 0 && seen[cell] === 0) return false;
    return pending.every((cell) => seen[cell] === 1);
  };

  /**
   * Settles whatever the faced pieces force, until nothing more is forced: a piece with only one way left to face is faced, and the
   * pieces beside it looked at again. `queue` is the pieces to look at first (all of them at the start, and after that the ones beside
   * the piece just faced, since every other was already settled). False where a piece is left with no way to face at all.
   */
  const settle = (val: Int8Array, queue: number[]): boolean => {
    const queued = new Uint8Array(count);
    for (const cell of queue) queued[cell] = 1;
    while (queue.length > 0) {
      const cell = queue.pop()!;
      queued[cell] = 0;
      if (val[cell]! >= 0 || layout.cells[cell] === 0) continue;
      scanFacings(layout, near, rotations, val, cell);
      if (seed[cell] === 0 && SCAN.need === 0) continue;
      if (SCAN.count === 0) return false;
      if (SCAN.count > 1) continue;
      val[cell] = ways(val, cell).masks[0]!;
      for (let side = 0; side < 4; side += 1) {
        const next = near[cell * 4 + side]!;
        if (next !== -1 && queued[next] === 0) {
          queued[next] = 1;
          queue.push(next);
        }
      }
    }
    return true;
  };

  const search = (val: Int8Array, root: boolean, queue: number[]): void => {
    if (!complete || solutions.length >= limit) return;
    nodes += 1;
    if (nodes > budget) {
      complete = false;
      return;
    }
    if (!settle(val, queue)) return;
    // What is left: the pieces the water can reach that are not yet faced (`pending`), and of them the one with fewest ways to face, the first of its kind.
    let pick = -1;
    let fewest = 17;
    const pending: number[] = [];
    for (let cell = 0; cell < count; cell += 1) {
      if (val[cell]! >= 0 || layout.cells[cell] === 0) continue;
      scanFacings(layout, near, rotations, val, cell);
      if (seed[cell] === 0 && SCAN.need === 0) continue;
      pending.push(cell);
      if (SCAN.count < fewest) {
        fewest = SCAN.count;
        pick = cell;
      }
    }
    if (root) forced = Array.from(val).filter((mask) => mask >= 0).length;
    if (!reachesAll(val, layout.drains)) return;
    if (pick === -1) {
      if (pending.length === 0 && layout.drains.every((cell) => val[cell]! >= 0)) solutions.push(Array.from(val, (mask, cell) => (mask >= 0 ? mask : layout.cells[cell]!)));
      return;
    }
    branches += 1;
    for (const mask of ways(val, pick).masks) {
      const next = Int8Array.from(val);
      next[pick] = mask;
      // Only the pieces beside the one just faced can have been changed by it.
      search(next, false, [0, 1, 2, 3].flatMap((side) => (near[pick * 4 + side]! === -1 ? [] : [near[pick * 4 + side]!])));
      if (!complete || solutions.length >= limit) return;
    }
  };

  search(new Int8Array(count).fill(-1), true, Array.from({ length: count }, (_, cell) => cell));
  return { count: solutions.length, solutions, nodes, branches, forced, complete };
}
