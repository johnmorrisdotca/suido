import { BIG_MIXES, type BigMix, bigMasksOf, type Placed, placeBlocks } from "./bigPieces.ts";
import { blockCells } from "./blocks.ts";
import { type Kind, type Layout, MAX_SIDE, neighboursOf } from "./code.ts";
import { canTurn } from "./game.ts";
import type { MakeOptions } from "./generate.ts";
import { armsOf, opposite, rotationsOf, SHAPE_MASKS } from "./pieces.ts";
import { type Random, shuffled } from "./random.ts";

/** The shapes a spare piece is drawn from, with how often. */
const SPARE_SHAPES = [
  SHAPE_MASKS.end,
  SHAPE_MASKS.end,
  SHAPE_MASKS.end,
  SHAPE_MASKS.straight,
  SHAPE_MASKS.straight,
  SHAPE_MASKS.straight,
  SHAPE_MASKS.elbow,
  SHAPE_MASKS.elbow,
  SHAPE_MASKS.elbow,
  SHAPE_MASKS.tee,
];

/** A board being made: the pipes as a forest growing from the pumps, and the pieces that stand where no pipe goes. */
export type Plan = {
  width: number;
  height: number;
  kind: Kind;
  wrap: boolean;
  /** The cell each cell's water comes from, -1 for a pump. */
  parent: Int32Array;
  sources: number[];
  /** Drains: the cells the water must reach; none for a network. */
  drains: number[];
  /** What stands on each cell the pipes do not use (a drains board), 0 for bare ground. */
  spare: number[];
  /** The cells to lock, and the walls to build: kept as the board is mended, and only used where they fit. */
  locked: Set<number>;
  walls: Set<number>;
  /** The squares that turn as one (`blocks.ts`), which block each cell is in (-1 for none), the edges a big piece's pipes run along and no move may take away, and the edges no pipe may use. */
  placed: Placed[];
  inBlock: Int32Array;
  pinned: Set<number>;
  banned: Set<number>;
};

/** What a plan's pipes must keep to, so that every big piece comes out as it was placed: the cells each cell's pipe is joined to, and the edges nothing may use. */
type Rules = { forced: number[][]; banned: Set<number> };

/** What stands where the water does not go on an inlet-outlet board: decoys, and what stops a decoy being a way through. */
const DECOYS = [
  SHAPE_MASKS.end,
  SHAPE_MASKS.end,
  SHAPE_MASKS.straight,
  SHAPE_MASKS.straight,
  SHAPE_MASKS.elbow,
  SHAPE_MASKS.elbow,
  SHAPE_MASKS.tee,
  SHAPE_MASKS.tee,
  SHAPE_MASKS.cross,
];
export const BLOCKERS = [0, SHAPE_MASKS.end, SHAPE_MASKS.tee, SHAPE_MASKS.cross];

/** A cell picked for each pump, spread out: each is the best of a few tries at being far from the ones before. */
function pickSources(
  width: number,
  height: number,
  wrap: boolean,
  count: number,
  random: Random,
  avoid: Int32Array | null = null,
): number[] {
  const out: number[] = [];
  const gap = (a: number, b: number): number => {
    let dx = Math.abs((a % width) - (b % width));
    let dy = Math.abs(Math.floor(a / width) - Math.floor(b / width));
    if (wrap) {
      dx = Math.min(dx, width - dx);
      dy = Math.min(dy, height - dy);
    }
    return dx + dy;
  };
  while (out.length < count) {
    let best = -1;
    let far = -1;
    for (let tries = 0; tries < (out.length === 0 ? 1 : 8); tries += 1) {
      const cell = Math.floor(random() * width * height);
      if (out.includes(cell) || (avoid !== null && avoid[cell]! >= 0)) continue;
      const apart = out.length === 0 ? 0 : Math.min(...out.map((other) => gap(cell, other)));
      if (apart > far) {
        far = apart;
        best = cell;
      }
    }
    if (best !== -1) out.push(best);
  }
  return out;
}

/**
 * A random spanning forest growing from the pumps: a frontier of cells beside
 * the forest, and each step takes one. With `bias` 1 it always takes the newest
 * (a depth-first walk: long snakes, few ends), with 0 a random one (a Prim
 * tree: bushy, many ends and tees); between, a mix.
 */
function grow(
  width: number,
  height: number,
  wrap: boolean,
  sources: number[],
  bias: number,
  random: Random,
  rules: Rules | null = null,
): Int32Array | null {
  const near = neighboursOf({ width, height, wrap });
  const parent = new Int32Array(width * height).fill(-2);
  const frontier: number[] = [];
  let conflict = false;
  /** A cell reached: its edges go on the frontier, and every cell its pipe is joined to is reached with it. */
  const add = (cell: number): void => {
    for (const side of shuffled([0, 1, 2, 3], random)) frontier.push(cell * 4 + side);
    for (const joined of rules?.forced[cell] ?? []) {
      if (parent[joined] === -2) {
        parent[joined] = cell;
        add(joined);
      } else if (parent[joined] === -1 || (parent[cell] !== joined && parent[joined] !== cell)) conflict = true;
    }
  };
  for (const source of sources) {
    parent[source] = -1;
  }
  for (const source of sources) add(source);
  while (frontier.length > 0) {
    const at = random() < bias ? frontier.length - 1 : Math.floor(random() * frontier.length);
    const edge = frontier[at]!;
    frontier[at] = frontier[frontier.length - 1]!;
    frontier.pop();
    const from = Math.floor(edge / 4);
    const next = near[edge]!;
    if (next === -1 || parent[next] !== -2) continue;
    if (rules?.banned.has(edgeId(near, from, edge % 4))) continue;
    parent[next] = from;
    add(next);
  }
  return conflict ? null : parent;
}

/** Which cell is next to each, with no walls: a plan's pipes never cross a wall, so only a wall's own edge number needs the walls left out. */
export function bareNear(plan: Pick<Plan, "width" | "height" | "wrap">): Int32Array {
  return neighboursOf({ width: plan.width, height: plan.height, wrap: plan.wrap });
}

/** The side of `from` that faces `to`, which must be next to it. */
export function sideBetween(near: Int32Array, from: number, to: number): number {
  for (let side = 0; side < 4; side += 1) if (near[from * 4 + side] === to) return side;
  return -1;
}
/** The number of the edge on side `side` of `cell`, from the table of neighbours with no walls in it. */
export function edgeId(near: Int32Array, cell: number, side: number): number {
  const next = near[cell * 4 + side]!;
  return side === 1 ? cell * 2 : side === 2 ? cell * 2 + 1 : side === 3 ? next * 2 : next * 2 + 1;
}

/** The cells a plan's pipes run through: every cell of a network, and in a drains board the paths from the pumps to the drains. */
export function used(plan: Plan): boolean[] {
  const cells = plan.width * plan.height;
  if (plan.kind === "network") return new Array<boolean>(cells).fill(true);
  const need = new Array<boolean>(cells).fill(false);
  for (const source of plan.sources) need[source] = true;
  for (const drain of plan.drains)
    for (let cell = drain; cell !== -1 && !need[cell]; cell = plan.parent[cell]!) need[cell] = true;
  return need;
}

/** The plan as pieces: the sides each cell opens on when the board is solved. */
export function solved(plan: Plan): number[] {
  const near = bareNear(plan);
  const need = used(plan);
  const masks = plan.spare.map((mask, cell) => (need[cell] === true ? 0 : mask));
  for (let cell = 0; cell < masks.length; cell += 1) {
    const from = plan.parent[cell]!;
    if (from === -1 || need[cell] !== true) continue;
    const side = sideBetween(near, from, cell);
    masks[from] = masks[from]! | (1 << side);
    masks[cell] = masks[cell]! | (1 << opposite(side));
  }
  return masks;
}

/** Every piece turned a random way, the way a board is first shown. A piece that looks the same turned any way is left. */
export function scramble(masks: readonly number[], random: Random): number[] {
  return masks.map((mask) => {
    const ways = rotationsOf(mask);
    return ways[Math.floor(random() * ways.length)]!;
  });
}

/** The cells of a plan that can be locked: those the pipes use, with a piece that looks different turned. */
export function lockable(plan: Plan, truth: readonly number[]): number[] {
  const need = used(plan);
  return truth.flatMap((mask, cell) => (need[cell] === true && canTurn(mask) && plan.inBlock[cell]! < 0 ? [cell] : []));
}

/** The board a plan makes with its pieces facing as `given` says. */
export function layoutOf(plan: Plan, given: readonly number[], truth: readonly number[]): Layout {
  const drains =
    plan.kind !== "network"
      ? [...plan.drains].sort((a, b) => a - b)
      : truth.flatMap((mask, cell) =>
          armsOf(mask) === 1 && !plan.sources.includes(cell) && plan.inBlock[cell]! < 0 ? [cell] : [],
        );
  const layout: Layout = {
    width: plan.width,
    height: plan.height,
    kind: plan.kind,
    wrap: plan.wrap,
    cells: [...given],
    sources: [...plan.sources].sort((a, b) => a - b),
    drains,
  };
  if (plan.locked.size > 0) {
    // A lock only holds where there is a piece worth locking, as the plan stands now.
    const fit = new Set(lockable(plan, truth));
    const locked = [...plan.locked].filter((cell) => fit.has(cell)).sort((a, b) => a - b);
    if (locked.length > 0) layout.locked = locked;
  }
  if (plan.walls.size > 0) layout.walls = [...plan.walls].sort((a, b) => a - b);
  const bigs = plan.placed.filter((block) => block.kind !== null).map((block) => block.anchor);
  const turning = plan.placed.filter((block) => block.kind === null).map((block) => block.anchor);
  if (bigs.length > 0) layout.bigs = bigs;
  if (turning.length > 0) layout.blocks = turning;
  return layout;
}

/** The cells' children, as lists. */
function childrenOf(parent: Int32Array): number[][] {
  const children: number[][] = Array.from({ length: parent.length }, () => []);
  for (let cell = 0; cell < parent.length; cell += 1) if (parent[cell]! >= 0) children[parent[cell]!]!.push(cell);
  return children;
}

/**
 * Takes one pipe out of the forest and puts another in its place: the branch
 * below `cell` is cut off and joined back to the forest somewhere else, by a
 * different pipe. Still a forest, with the same pumps, and a different board.
 */
export function rewire(plan: Plan, cell: number, random: Random): boolean {
  const near = neighboursOf({ ...plan, walls: [...plan.walls] });
  const bare = bareNear(plan);
  // The pipe a big piece is made of is not taken away, and a pipe is never run where none may be.
  const edgeOf = (a: number, b: number): number => edgeId(bare, a, sideBetween(bare, a, b));
  if (plan.parent[cell]! >= 0 && plan.pinned.has(edgeOf(cell, plan.parent[cell]!))) return false;
  const children = childrenOf(plan.parent);
  const branch = new Set<number>([cell]);
  for (const member of branch) for (const child of children[member]!) branch.add(child);
  const options: [number, number][] = [];
  for (const inside of branch) {
    for (let side = 0; side < 4; side += 1) {
      const outside = near[inside * 4 + side]!;
      if (outside === -1 || branch.has(outside) || (inside === cell && outside === plan.parent[cell])) continue;
      if (plan.banned.has(edgeOf(inside, outside))) continue;
      options.push([inside, outside]);
    }
  }
  if (options.length === 0) return false;
  const [inside, outside] = options[Math.floor(random() * options.length)]!;
  let at = inside;
  let to = outside;
  for (;;) {
    const old = plan.parent[at]!;
    plan.parent[at] = to;
    if (at === cell) break;
    to = at;
    at = old;
  }
  return true;
}

/** The settings a call to `makeSuido` or `laySuido` resolves its options to. */
export type Settings = {
  width: number;
  height: number;
  kind: Kind;
  wrap: boolean;
  sources: number;
  drains: number;
  spares: number;
  bias: number | undefined;
  seed: number;
  locked: number;
  walls: number;
  bigs: number;
  bigKinds: BigMix;
  blocks: number;
};

export function settingsOf(options: MakeOptions): Settings {
  const width = options.width ?? options.size ?? 7;
  const height = options.height ?? options.size ?? width;
  const wrap = options.wrap ?? false;
  if (
    !Number.isInteger(width) ||
    !Number.isInteger(height) ||
    width < (wrap ? 3 : 2) ||
    height < (wrap ? 3 : 2) ||
    width > MAX_SIDE ||
    height > MAX_SIDE
  )
    throw new Error(`Not a board size: ${width}×${height}`);
  const cells = width * height;
  const kind = options.kind ?? "network";
  if (kind === "inlet-outlet") {
    if (wrap)
      throw new Error("An inlet-outlet board does not wrap: its water runs from the top left to the bottom right.");
    if ((options.sources ?? 1) !== 1 || (options.drains ?? 1) !== 1)
      throw new Error("An inlet-outlet board has one pump and one drain.");
    if (width < 3 || height < 3) throw new Error(`Not an inlet-outlet board size: ${width}×${height}`);
  }
  if (kind !== "network" && (options.bigs ?? 0) + (options.blocks ?? 0) > 0)
    throw new Error("Only a network can have big pieces or blocks that turn.");
  const sources =
    kind === "inlet-outlet"
      ? 1
      : Math.min(Math.max(1, Math.floor(options.sources ?? 1)), Math.max(1, Math.floor(cells / 6)));
  return {
    width,
    height,
    kind,
    wrap,
    sources,
    drains:
      kind === "inlet-outlet" ? 1 : Math.max(sources, Math.floor(options.drains ?? Math.round(Math.sqrt(cells) * 0.8))),
    spares: Math.min(1, Math.max(0, options.spares ?? (kind === "inlet-outlet" ? 0.85 : 0.5))),
    bias: options.bias,
    seed: (options.seed ?? 1) >>> 0,
    locked: Math.max(0, Math.floor(options.locked ?? 0)),
    walls: Math.max(0, Math.floor(options.walls ?? 0)),
    bigs: Math.max(0, Math.floor(options.bigs ?? 0)),
    bigKinds: BIG_MIXES.includes(options.bigKinds as BigMix) ? (options.bigKinds as BigMix) : "five",
    blocks: Math.max(0, Math.floor(options.blocks ?? 0)),
  };
}

/** A plan for a new board, or null when the forest left a pump with no pipe to run through. */
export function planOf(settings: Settings, random: Random): Plan | null {
  const { width, height, kind, wrap, sources, drains: drainCount, spares } = settings;
  const cells = width * height;
  if (kind === "inlet-outlet") return pathPlanOf(settings, random);
  const bias = settings.bias ?? 0.15 + random() * 0.75;
  const squares = squaresOf(settings, random);
  const pumps = pickSources(width, height, wrap, sources, random, squares.inBlock);
  const parent = grow(width, height, wrap, pumps, bias, random, squares.rules);
  if (parent === null) return null;
  const children = childrenOf(parent);
  if (pumps.some((pump) => children[pump]!.length === 0)) return null;
  let drains: number[] = [];
  if (kind === "drains") {
    const leaves = Array.from({ length: cells }, (_, cell) => cell).filter(
      (cell) => children[cell]!.length === 0 && parent[cell] !== -1,
    );
    const rootOf = (cell: number): number => {
      let at = cell;
      while (parent[at] !== -1) at = parent[at]!;
      return at;
    };
    const chosen = new Set<number>();
    for (const pump of pumps) {
      const mine = shuffled(
        leaves.filter((leaf) => rootOf(leaf) === pump),
        random,
      );
      if (mine.length > 0) chosen.add(mine[0]!);
    }
    for (const leaf of shuffled(leaves, random)) if (chosen.size < drainCount) chosen.add(leaf);
    drains = [...chosen];
  }
  const spare = Array.from({ length: cells }, () =>
    random() < spares ? SPARE_SHAPES[Math.floor(random() * SPARE_SHAPES.length)]! : 0,
  );
  return {
    width,
    height,
    kind,
    wrap,
    parent,
    sources: pumps,
    drains,
    spare,
    locked: new Set(),
    walls: new Set(),
    placed: squares.placed,
    inBlock: squares.inBlock,
    pinned: squares.pinned,
    banned: squares.rules?.banned ?? new Set(),
  };
}

/** The squares of a new board: placed, the cell each is in, and what the pipes must keep to for the big pieces among them to come out as placed. */
function squaresOf(
  settings: Settings,
  random: Random,
): { placed: Placed[]; inBlock: Int32Array; pinned: Set<number>; rules: Rules | null } {
  const { width, height, wrap } = settings;
  const inBlock = new Int32Array(width * height).fill(-1);
  const pinned = new Set<number>();
  if (settings.bigs + settings.blocks === 0 || settings.kind !== "network")
    return { placed: [], inBlock, pinned, rules: null };
  const bare = neighboursOf({ width, height, wrap });
  const placed = placeBlocks(bare, width, height, settings.bigs, settings.blocks, random, settings.bigKinds);
  const forced: number[][] = Array.from({ length: width * height }, () => []);
  const banned = new Set<number>();
  placed.forEach((block, at) => {
    const cells = blockCells(block.anchor, width);
    for (const cell of cells) inBlock[cell] = at;
    if (block.kind === null) return;
    const masks = bigMasksOf(block.kind, block.quarters);
    cells.forEach((cell, i) => {
      for (let side = 0; side < 4; side += 1) {
        const next = bare[cell * 4 + side]!;
        if (next === -1) continue;
        const edge = edgeId(bare, cell, side);
        if (((masks[i]! >> side) & 1) === 1) {
          pinned.add(edge);
          forced[cell]!.push(next);
          if (!cells.includes(next)) forced[next]!.push(cell);
        } else banned.add(edge);
      }
    });
  });
  return { placed, inBlock, pinned, rules: { forced, banned } };
}

/**
 * A plan for an inlet-outlet board: the pump at the top left, the drain at the bottom right, and the way
 * between them the path a random spanning tree grows from the pump to the drain (long and winding with a high
 * `bias`). Every other cell is a decoy or bare ground.
 */
function pathPlanOf(settings: Settings, random: Random): Plan | null {
  const { width, height, spares } = settings;
  const cells = width * height;
  const bias = settings.bias ?? 0.55 + random() * 0.45;
  const parent = grow(width, height, false, [0], bias, random)!;
  let length = 1;
  for (let cell = cells - 1; cell !== 0; cell = parent[cell]!) length += 1;
  // A way that is nearly a straight run is no puzzle: the path takes a good share of the board.
  if (length < Math.max(width + height + 2, Math.floor(cells * 0.35))) return null;
  const spare = Array.from({ length: cells }, () =>
    random() < spares ? DECOYS[Math.floor(random() * DECOYS.length)]! : 0,
  );
  return {
    width,
    height,
    kind: "inlet-outlet",
    wrap: false,
    parent,
    sources: [0],
    drains: [cells - 1],
    spare,
    locked: new Set(),
    walls: new Set(),
    placed: [],
    inBlock: new Int32Array(cells).fill(-1),
    pinned: new Set(),
    banned: new Set(),
  };
}
