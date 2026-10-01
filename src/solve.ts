import { neighboursOf, type Layout } from "./code.ts";
import { bits, drainFacings, HAS, LACKS, members, rotationsOfLayout, sidesOf } from "./facing.ts";
import { opposite } from "./pieces.ts";

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
 * neighbour table does not cross, so neither needs a rule of its own.
 */
export function solve(layout: Layout, limit = 2, budget = 200_000): SolveResult {
  return layout.kind === "network" ? solveNetwork(layout, limit, budget) : solveDrains(layout, limit, budget);
}

/** How many answers there are, counted up to `limit`. */
export function countSolutions(layout: Layout, limit = 2, budget = 200_000): number {
  return solve(layout, limit, budget).count;
}

function solveNetwork(layout: Layout, limit: number, budget: number): SolveResult {
  const count = layout.width * layout.height;
  const near = neighboursOf(layout);
  const solutions: number[][] = [];
  let nodes = 0;
  let branches = 0;
  let forced = 0;
  let complete = true;

  /** Removes from every piece the facings its neighbours rule out, until nothing more goes. False if a piece is left with none. */
  const propagate = (dom: Uint16Array, queue: number[]): boolean => {
    const queued = new Uint8Array(count);
    for (const cell of queue) queued[cell] = 1;
    while (queue.length > 0) {
      const cell = queue.pop()!;
      queued[cell] = 0;
      const before = dom[cell]!;
      let keep = before;
      for (let side = 0; side < 4; side += 1) {
        const next = near[cell * 4 + side]!;
        const back = opposite(side);
        const hasArm = next !== -1 && (dom[next]! & HAS[back]!) !== 0;
        const lacks = next === -1 || (dom[next]! & LACKS[back]!) !== 0;
        if (!hasArm) keep &= LACKS[side]!;
        if (!lacks) keep &= HAS[side]!;
      }
      if (keep === 0) return false;
      if (keep !== before) {
        dom[cell] = keep;
        for (let side = 0; side < 4; side += 1) {
          const next = near[cell * 4 + side]!;
          if (next !== -1 && queued[next] === 0) {
            queued[next] = 1;
            queue.push(next);
          }
        }
      }
    }
    return true;
  };

  /** Whether the water could still reach every piece, if every piece faced the way it still may. */
  const reachesAll = (dom: Uint16Array): boolean => {
    const possible = Array.from(dom, sidesOf);
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
    for (let cell = 0; cell < count; cell += 1) if (dom[cell] !== 1 && seen[cell] === 0) return false;
    return true;
  };

  const search = (dom: Uint16Array, queue: number[], root: boolean): void => {
    if (!complete || solutions.length >= limit) return;
    nodes += 1;
    if (nodes > budget) {
      complete = false;
      return;
    }
    if (!propagate(dom, queue)) return;
    if (root) forced = Array.from(dom).filter((set) => set !== 1 && bits(set) === 1).length;
    if (!reachesAll(dom)) return;
    let pick = -1;
    let fewest = 17;
    for (let cell = 0; cell < count; cell += 1) {
      const ways = bits(dom[cell]!);
      if (ways > 1 && ways < fewest) {
        fewest = ways;
        pick = cell;
      }
    }
    if (pick === -1) {
      solutions.push(Array.from(dom, (set) => members(set)[0]!));
      return;
    }
    branches += 1;
    for (const mask of members(dom[pick]!)) {
      const next = Uint16Array.from(dom);
      next[pick] = 1 << mask;
      search(next, [pick], false);
      if (!complete || solutions.length >= limit) return;
    }
  };

  const dom = new Uint16Array(count);
  const rotations = rotationsOfLayout(layout);
  for (let cell = 0; cell < count; cell += 1) for (const mask of rotations[cell]!) dom[cell]! |= 1 << mask;
  search(dom, Array.from({ length: count }, (_, cell) => cell), true);
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
      possible[cell] = val[cell]! >= 0 ? val[cell]! : ways(val, cell).masks.reduce((all, mask) => all | mask, 0);
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

  const search = (val: Int8Array, root: boolean): void => {
    if (!complete || solutions.length >= limit) return;
    nodes += 1;
    if (nodes > budget) {
      complete = false;
      return;
    }
    let pick = -1;
    let fewest = 17;
    let pending: number[] = [];
    // Settle whatever the faced pieces force, until nothing more is forced.
    for (let changed = true; changed; ) {
      changed = false;
      pick = -1;
      fewest = 17;
      pending = [];
      for (let cell = 0; cell < count; cell += 1) {
        if (val[cell]! >= 0 || layout.cells[cell] === 0) continue;
        const { masks, need } = ways(val, cell);
        if (seed[cell] === 0 && need === 0) continue;
        if (masks.length === 0) return;
        pending.push(cell);
        if (masks.length === 1) {
          val[cell] = masks[0]!;
          changed = true;
        } else if (masks.length < fewest) {
          fewest = masks.length;
          pick = cell;
        }
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
      search(next, false);
      if (!complete || solutions.length >= limit) return;
    }
  };

  search(new Int8Array(count).fill(-1), true);
  return { count: solutions.length, solutions, nodes, branches, forced, complete };
}
