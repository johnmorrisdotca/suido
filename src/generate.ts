import { BIG_MIXES, bigMasksOf, placeBlocks, type BigMix, type Placed } from "./bigPieces.ts";
import { blockCells, turnBlock } from "./blocks.ts";
import { encodeLayout, MAX_SIDE, neighboursOf, type Kind, type Layout } from "./code.ts";
import { difficultyOf } from "./difficulty.ts";
import { flowOf } from "./flow.ts";
import { armsOf, opposite, rotationsOf, SHAPE_MASKS, turn } from "./pieces.ts";
import { seededRandom, shuffled, type Random } from "./random.ts";
import { solve } from "./solve.ts";
import { canTurn } from "./game.ts";

/** What a new board may be asked for. Everything has a default but the seed, and a seed has one too. */
export type MakeOptions = {
  /** The same seed and the same options make the same board, in every browser and every Node. */
  seed?: number;
  /** The side of a square board; or `width` and `height` for one that is not. Default 7. */
  size?: number;
  width?: number;
  height?: number;
  /**
   * `network` (every piece wet), `drains` (every drain reached, spare pieces allowed) or `inlet-outlet`
   * (the water runs in one path from the pump at the top left to the drain at the bottom right, through
   * pieces that open on two sides; the rest are decoys). Default network. An inlet-outlet board has one
   * pump and one drain and its edges do not join.
   */
  kind?: Kind;
  /** Whether the edges join. Default false. */
  wrap?: boolean;
  /** How many pumps. Default 1. */
  sources?: number;
  /** In a drains board, how many drains. Default about four fifths of the board's side, at least one a pump. */
  drains?: number;
  /** In a drains board, the share of the ground the water does not need that holds a spare piece, the rest bare. Default 0.5. */
  spares?: number;
  /** How the pipes wind, 0 to 1: low branches everywhere, high runs in long snakes. Default is drawn from the seed. */
  bias?: number;
  /**
   * How many pieces are locked: shown facing as the answer has them and not to be turned. Where a board
   * would have a second answer, a locked piece is what makes it one before any pipe is moved. Default 0.
   */
  locked?: number;
  /**
   * How many walls: edges the water cannot cross, put where the pipes do not go. Where a board would have
   * a second answer, a wall across the edge the other answer uses is what makes it one. Default 0.
   */
  walls?: number;
  /**
   * How many big pieces: squares of four cells that are one piece, turned in place a quarter at a time (see
   * `BIG_KINDS`). Only a network has them. Fewer are made where the board has no room. Default 0.
   */
  bigs?: number;
  /**
   * Which big pieces `bigs` draws from: `five`, the five kinds of `BIG_KINDS` (the default, so a seed makes the board it always made), `simple`,
   * `more` or `all` of the 699 shapes of `BIG_SHAPES`, each a wider choice than the one before (`BigMix`): pipes side by side, a cross or a tee inside
   * a plate, three pipes in one, few openings or many.
   */
  bigKinds?: BigMix;
  /**
   * How many blocks that turn as one: squares of four ordinary pieces that a tap turns together, the pieces
   * moving round the square as they turn. Only a network has them. Default 0.
   */
  blocks?: number;
  /** The difficulty to aim for, 1 to 100 among boards of the size (see `difficultyOf`). Boards are made until one is near it. */
  difficulty?: number;
  /** How many boards to make, at most, looking for the difficulty asked for. Default 60. */
  attempts?: number;
  /** How far from the difficulty asked for is near enough. Default 4. */
  tolerance?: number;
};

/** A new board: its code, the code of its one answer, and what it was made from. */
export type Made = {
  /** The board as the player first sees it, every piece turned at random. */
  code: string;
  /** The board solved: the same pieces facing as the answer has them. */
  answer: string;
  layout: Layout;
  /** The sides the answer's pieces open on. */
  solution: number[];
  seed: number;
  /** How many boards were laid and thrown away before this one had exactly one answer. */
  discarded: number;
};

/** A new board with how hard it is. */
export type MadeScored = Made & {
  /** 1 to 100 among boards of its size: see `difficultyOf`. */
  difficulty: number;
  /** How many boards were made to find it, when a difficulty was asked for. */
  tried: number;
};

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
type Plan = {
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
const DECOYS = [SHAPE_MASKS.end, SHAPE_MASKS.end, SHAPE_MASKS.straight, SHAPE_MASKS.straight, SHAPE_MASKS.elbow, SHAPE_MASKS.elbow, SHAPE_MASKS.tee, SHAPE_MASKS.tee, SHAPE_MASKS.cross];
const BLOCKERS = [0, SHAPE_MASKS.end, SHAPE_MASKS.tee, SHAPE_MASKS.cross];

/** A cell picked for each pump, spread out: each is the best of a few tries at being far from the ones before. */
function pickSources(width: number, height: number, wrap: boolean, count: number, random: Random, avoid: Int32Array | null = null): number[] {
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
function grow(width: number, height: number, wrap: boolean, sources: number[], bias: number, random: Random, rules: Rules | null = null): Int32Array | null {
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
    if (rules !== null && rules.banned.has(edgeId(near, from, edge % 4))) continue;
    parent[next] = from;
    add(next);
  }
  return conflict ? null : parent;
}

/** Which cell is next to each, with no walls: a plan's pipes never cross a wall, so only a wall's own edge number needs the walls left out. */
function bareNear(plan: Pick<Plan, "width" | "height" | "wrap">): Int32Array {
  return neighboursOf({ width: plan.width, height: plan.height, wrap: plan.wrap });
}

/** The side of `from` that faces `to`, which must be next to it. */
function sideBetween(near: Int32Array, from: number, to: number): number {
  for (let side = 0; side < 4; side += 1) if (near[from * 4 + side] === to) return side;
  return -1;
}

/** The cells a plan's pipes run through: every cell of a network, and in a drains board the paths from the pumps to the drains. */
function used(plan: Plan): boolean[] {
  const cells = plan.width * plan.height;
  if (plan.kind === "network") return new Array<boolean>(cells).fill(true);
  const need = new Array<boolean>(cells).fill(false);
  for (const source of plan.sources) need[source] = true;
  for (const drain of plan.drains) for (let cell = drain; cell !== -1 && !need[cell]; cell = plan.parent[cell]!) need[cell] = true;
  return need;
}

/** The plan as pieces: the sides each cell opens on when the board is solved. */
function solved(plan: Plan): number[] {
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
function scramble(masks: readonly number[], random: Random): number[] {
  return masks.map((mask) => {
    const ways = rotationsOf(mask);
    return ways[Math.floor(random() * ways.length)]!;
  });
}

/** The cells of a plan that can be locked: those the pipes use, with a piece that looks different turned. */
function lockable(plan: Plan, truth: readonly number[]): number[] {
  const need = used(plan);
  return truth.flatMap((mask, cell) => (need[cell] === true && canTurn(mask) && plan.inBlock[cell]! < 0 ? [cell] : []));
}

/** The board a plan makes with its pieces facing as `given` says. */
function layoutOf(plan: Plan, given: readonly number[], truth: readonly number[]): Layout {
  const drains = plan.kind !== "network" ? [...plan.drains].sort((a, b) => a - b) : truth.flatMap((mask, cell) => (armsOf(mask) === 1 && !plan.sources.includes(cell) && plan.inBlock[cell]! < 0 ? [cell] : []));
  const layout: Layout = { width: plan.width, height: plan.height, kind: plan.kind, wrap: plan.wrap, cells: [...given], sources: [...plan.sources].sort((a, b) => a - b), drains };
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
function rewire(plan: Plan, cell: number, random: Random): boolean {
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
type Settings = { width: number; height: number; kind: Kind; wrap: boolean; sources: number; drains: number; spares: number; bias: number | undefined; seed: number; locked: number; walls: number; bigs: number; bigKinds: BigMix; blocks: number };

function settingsOf(options: MakeOptions): Settings {
  const width = options.width ?? options.size ?? 7;
  const height = options.height ?? options.size ?? width;
  const wrap = options.wrap ?? false;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < (wrap ? 3 : 2) || height < (wrap ? 3 : 2) || width > MAX_SIDE || height > MAX_SIDE) throw new Error(`Not a board size: ${width}×${height}`);
  const cells = width * height;
  const kind = options.kind ?? "network";
  if (kind === "inlet-outlet") {
    if (wrap) throw new Error("An inlet-outlet board does not wrap: its water runs from the top left to the bottom right.");
    if ((options.sources ?? 1) !== 1 || (options.drains ?? 1) !== 1) throw new Error("An inlet-outlet board has one pump and one drain.");
    if (width < 3 || height < 3) throw new Error(`Not an inlet-outlet board size: ${width}×${height}`);
  }
  if (kind !== "network" && (options.bigs ?? 0) + (options.blocks ?? 0) > 0) throw new Error("Only a network can have big pieces or blocks that turn.");
  const sources = kind === "inlet-outlet" ? 1 : Math.min(Math.max(1, Math.floor(options.sources ?? 1)), Math.max(1, Math.floor(cells / 6)));
  return {
    width,
    height,
    kind,
    wrap,
    sources,
    drains: kind === "inlet-outlet" ? 1 : Math.max(sources, Math.floor(options.drains ?? Math.round(Math.sqrt(cells) * 0.8))),
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
function planOf(settings: Settings, random: Random): Plan | null {
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
    const leaves = Array.from({ length: cells }, (_, cell) => cell).filter((cell) => children[cell]!.length === 0 && parent[cell] !== -1);
    const rootOf = (cell: number): number => {
      let at = cell;
      while (parent[at] !== -1) at = parent[at]!;
      return at;
    };
    const chosen = new Set<number>();
    for (const pump of pumps) {
      const mine = shuffled(leaves.filter((leaf) => rootOf(leaf) === pump), random);
      if (mine.length > 0) chosen.add(mine[0]!);
    }
    for (const leaf of shuffled(leaves, random)) if (chosen.size < drainCount) chosen.add(leaf);
    drains = [...chosen];
  }
  const spare = Array.from({ length: cells }, () => (random() < spares ? SPARE_SHAPES[Math.floor(random() * SPARE_SHAPES.length)]! : 0));
  return { width, height, kind, wrap, parent, sources: pumps, drains, spare, locked: new Set(), walls: new Set(), placed: squares.placed, inBlock: squares.inBlock, pinned: squares.pinned, banned: squares.rules?.banned ?? new Set() };
}

/** The squares of a new board: placed, the cell each is in, and what the pipes must keep to for the big pieces among them to come out as placed. */
function squaresOf(settings: Settings, random: Random): { placed: Placed[]; inBlock: Int32Array; pinned: Set<number>; rules: Rules | null } {
  const { width, height, wrap } = settings;
  const inBlock = new Int32Array(width * height).fill(-1);
  const pinned = new Set<number>();
  if (settings.bigs + settings.blocks === 0 || settings.kind !== "network") return { placed: [], inBlock, pinned, rules: null };
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
  const spare = Array.from({ length: cells }, () => (random() < spares ? DECOYS[Math.floor(random() * DECOYS.length)]! : 0));
  return { width, height, kind: "inlet-outlet", wrap: false, parent, sources: [0], drains: [cells - 1], spare, locked: new Set(), walls: new Set(), placed: [], inBlock: new Int32Array(cells).fill(-1), pinned: new Set(), banned: new Set() };
}

function madeOf(plan: Plan, random: Random, seed: number, discarded: number): Made {
  const truth = solved(plan);
  /** The plan scrambled once: every piece that is not locked turned a random way. */
  const scrambled = (): Layout => {
    const given = scramble(truth, random);
    // A square turns as one: it is the way the answer has it, turned a random number of quarters.
    for (const block of plan.placed) {
      const cells = blockCells(block.anchor, plan.width);
      const turned = turnBlock(truth, { index: 0, anchor: block.anchor, big: block.kind !== null, cells }, Math.floor(random() * 4));
      for (const cell of cells) given[cell] = turned[cell]!;
    }
    const layout = layoutOf(plan, given, truth);
    for (const cell of layout.locked ?? []) layout.cells[cell] = truth[cell]!;
    return layout;
  };
  let layout = scrambled();
  // Locks can leave nothing to turn, in which case a board is never unsolved: it is given up on after a few tries.
  for (let tries = 0; flowOf(layout, layout.cells).solved && tries < 200; tries += 1) layout = scrambled();
  return { code: encodeLayout(layout), answer: encodeLayout({ ...layout, cells: truth }), layout, solution: truth, seed, discarded };
}

/**
 * A board laid out and turned at random, with no promise about how many answers
 * it has: the raw material `makeSuido` shapes. Its `solution` is one answer.
 */
export function laySuido(options: MakeOptions = {}): Made {
  const settings = settingsOf(options);
  const random = seededRandom(settings.seed);
  let discarded = 0;
  for (;;) {
    const plan = planOf(settings, random);
    if (plan !== null) return madeOf(plan, random, settings.seed, discarded);
    discarded += 1;
  }
}

/** The number of the edge on side `side` of `cell`, from the table of neighbours with no walls in it. */
function edgeId(near: Int32Array, cell: number, side: number): number {
  const next = near[cell * 4 + side]!;
  return side === 1 ? cell * 2 : side === 2 ? cell * 2 + 1 : side === 3 ? next * 2 : next * 2 + 1;
}

/**
 * The edges of a plan's forest, whether or not the water goes through them now: the ones no wall may be built
 * on. A wall on an edge the forest does not use stays off every pipe however the pipes are moved later, since
 * moving one only ever joins cells by an edge that is not walled.
 */
function forestEdges(plan: Plan, near: Int32Array): Set<number> {
  const edges = new Set<number>();
  for (let cell = 0; cell < plan.parent.length; cell += 1) {
    const from = plan.parent[cell]!;
    if (from >= 0) edges.add(edgeId(near, from, sideBetween(near, from, cell)));
  }
  return edges;
}

/** The edges the water runs along in an answer: between two wet pieces that open on each other. */
function waterEdges(layout: Layout, masks: readonly number[], near: Int32Array): Set<number> {
  const flow = flowOf(layout, masks);
  const edges = new Set<number>();
  for (let cell = 0; cell < masks.length; cell += 1) {
    if (flow.wet[cell] !== true) continue;
    for (const side of [1, 2]) {
      const next = near[cell * 4 + side]!;
      if (next !== -1 && flow.wet[next] === true && ((masks[cell]! >> side) & 1) === 1 && ((masks[next]! >> opposite(side)) & 1) === 1) edges.add(edgeId(near, cell, side));
    }
  }
  return edges;
}

/** Whether an edge is between two cells of one square, where a wall cannot stand. */
function insideBlock(plan: Plan, edge: number, bare: Int32Array): boolean {
  const cell = edge >> 1;
  const next = bare[cell * 4 + ((edge & 1) === 0 ? 1 : 2)]!;
  return next !== -1 && plan.inBlock[cell]! >= 0 && plan.inBlock[cell] === plan.inBlock[next];
}

/** How many of a plan's locks hold, as the plan stands. */
function locksHeld(plan: Plan, truth: readonly number[]): number {
  const fit = new Set(lockable(plan, truth));
  return [...plan.locked].filter((cell) => fit.has(cell)).length;
}

/**
 * Makes a second answer impossible with a wall or a lock instead of moving a pipe, where the settings ask for
 * either and have some left: a wall across an edge one of the two answers uses and the plan's pipes do not, or
 * a lock on a piece the two answers face differently. True when it built one.
 */
function tighten(plan: Plan, settings: Settings, layout: Layout, one: readonly number[], two: readonly number[], random: Random): boolean {
  const truth = solved(plan);
  const bare = bareNear(plan);
  const first = waterEdges(layout, one, bare);
  const second = waterEdges(layout, two, bare);
  const wallEdges = [...first].filter((edge) => !second.has(edge)).concat([...second].filter((edge) => !first.has(edge)));
  const pipes = forestEdges(plan, bare);
  const walls = settings.walls > plan.walls.size ? wallEdges.filter((edge) => !pipes.has(edge) && !plan.walls.has(edge) && !insideBlock(plan, edge, bare)) : [];
  const fit = new Set(lockable(plan, truth));
  const locks = settings.locked > locksHeld(plan, truth) ? Array.from({ length: truth.length }, (_, cell) => cell).filter((cell) => one[cell] !== two[cell] && fit.has(cell) && !plan.locked.has(cell)) : [];
  if (walls.length === 0 && locks.length === 0) return false;
  if (locks.length === 0 || (walls.length > 0 && random() < 0.5)) plan.walls.add(walls[Math.floor(random() * walls.length)]!);
  else plan.locked.add(locks[Math.floor(random() * locks.length)]!);
  return true;
}

/** The walls and locks the settings asked for that mending did not need: walls beside the pipes, locks on pieces that turn. */
function furnish(plan: Plan, settings: Settings, random: Random): void {
  const truth = solved(plan);
  const bare = bareNear(plan);
  if (settings.walls > plan.walls.size) {
    const pipes = forestEdges(plan, bare);
    const need = used(plan);
    const options: number[] = [];
    for (let cell = 0; cell < truth.length; cell += 1) {
      for (const side of [1, 2]) {
        const next = bare[cell * 4 + side]!;
        const edge = edgeId(bare, cell, side);
        if (next !== -1 && !pipes.has(edge) && !plan.walls.has(edge) && !insideBlock(plan, edge, bare) && (need[cell] === true || need[next] === true)) options.push(edge);
      }
    }
    for (const edge of shuffled(options, random).slice(0, settings.walls - plan.walls.size)) plan.walls.add(edge);
  }
  const held = locksHeld(plan, truth);
  if (settings.locked > held) {
    const open = lockable(plan, truth).filter((cell) => !plan.locked.has(cell));
    for (const cell of shuffled(open, random).slice(0, settings.locked - held)) plan.locked.add(cell);
  }
}

/**
 * Makes a board that has exactly one answer. A random forest rarely has one
 * the first time: where the solver finds a second answer, the cells the two
 * answers disagree on are where to look, and a pipe beside one of them is
 * moved (or a spare piece taken off) until it does. Where walls or locks are
 * asked for, they are what is built first, and any not needed are added at the
 * end. A board the solver cannot prove inside its budget is thrown away.
 */
export function makeUnscored(options: MakeOptions = {}): Made {
  const settings = settingsOf(options);
  const cells = settings.width * settings.height;
  const random = seededRandom(settings.seed);
  const furnished = settings.walls + settings.locked > 0;
  // A board of more than four hundred cells that the solver cannot prove in four thousand positions is thrown away rather than searched on: most are proved in a few hundred, and a hopeless one costs seconds a phone does not have.
  const budget = cells > 400 ? 4000 : 20_000;
  let discarded = 0;
  for (;;) {
    const plan = planOf(settings, random);
    if (plan === null) {
      discarded += 1;
      continue;
    }
    for (let round = 0; round < 40; round += 1) {
      const made = madeOf(plan, random, settings.seed, discarded);
      const result = solve(made.layout, 2, budget);
      if (!result.complete) break;
      if (result.count === 1) {
        if (!furnished) return made;
        furnish(plan, settings, random);
        return madeOf(plan, random, settings.seed, discarded);
      }
      // No answer at all cannot happen to a plan whose walls and locks fit it, and a plan that somehow has none is thrown away.
      if (result.count < 2) break;
      // A second answer: find where the two disagree and change the board there.
      const [one, two] = result.solutions as [number[], number[]];
      let changed = furnished && tighten(plan, settings, made.layout, one, two, random);
      const differ = shuffled(Array.from({ length: cells }, (_, cell) => cell).filter((cell) => one[cell] !== two[cell]), random);
      const need = used(plan);
      for (const cell of changed ? [] : differ) {
        if (need[cell] !== true) {
          if (plan.spare[cell] === 0) continue;
          plan.spare[cell] = plan.kind === "inlet-outlet" ? BLOCKERS[Math.floor(random() * BLOCKERS.length)]! : 0;
          changed = true;
        } else if (plan.parent[cell]! !== -1) changed = rewire(plan, cell, random);
        if (changed) break;
      }
      // A repair that leaves a pump with no pipe to run through is no repair: that board is thrown away.
      if (!changed || solved(plan).some((mask, cell) => mask === 0 && plan.sources.includes(cell))) break;
    }
    discarded += 1;
  }
}

/**
 * Makes a board with exactly one answer and says how hard it is. With a
 * `difficulty` asked for it makes boards (each its own seed, the first the
 * seed given) until one is within `tolerance` of it, or `attempts` have been
 * made, and gives the nearest. The board's `seed` is the one that made it, so
 * `makeSuido({ ...options, seed: made.seed })` makes it again.
 */
export function makeSuido(options: MakeOptions = {}): MadeScored {
  const aim = options.difficulty;
  const attempts = aim === undefined ? 1 : Math.max(1, Math.floor(options.attempts ?? 60));
  const tolerance = options.tolerance ?? 4;
  const first = (options.seed ?? 1) >>> 0;
  let best: MadeScored | null = null;
  let tried = 0;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const made = makeUnscored({ ...options, seed: (first + Math.imul(attempt, 0x9e3779b1)) >>> 0 });
    tried += 1;
    const difficulty = difficultyOf(made.layout, made.solution);
    if (best === null || aim === undefined || Math.abs(difficulty - aim) < Math.abs(best.difficulty - aim)) best = { ...made, difficulty, tried: 0 };
    if (aim === undefined || Math.abs(difficulty - aim) <= tolerance) break;
  }
  return { ...best!, tried };
}

/** The turns a board needs, when taps turn a piece either way: how far it is from solved. */
export function turnsFromAnswer(given: readonly number[], solution: readonly number[]): number {
  let total = 0;
  for (let cell = 0; cell < given.length; cell += 1) {
    for (let quarters = 0; quarters < 4; quarters += 1) {
      if (turn(given[cell]!, quarters) === solution[cell]) {
        total += Math.min(quarters, 4 - quarters) % 4;
        break;
      }
    }
  }
  return total;
}
