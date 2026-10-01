import { encodeLayout, MAX_SIDE, neighboursOf, type Kind, type Layout } from "./code.ts";
import { difficultyOf } from "./difficulty.ts";
import { flowOf } from "./flow.ts";
import { armsOf, opposite, rotationsOf, SHAPE_MASKS, turn } from "./pieces.ts";
import { seededRandom, shuffled, type Random } from "./random.ts";
import { solve } from "./solve.ts";

/** What a new board may be asked for. Everything has a default but the seed, and a seed has one too. */
export type MakeOptions = {
  /** The same seed and the same options make the same board, in every browser and every Node. */
  seed?: number;
  /** The side of a square board; or `width` and `height` for one that is not. Default 7. */
  size?: number;
  width?: number;
  height?: number;
  /** `network` (every piece wet) or `drains` (every drain reached, spare pieces allowed). Default network. */
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
};

/** A cell picked for each pump, spread out: each is the best of a few tries at being far from the ones before. */
function pickSources(width: number, height: number, wrap: boolean, count: number, random: Random): number[] {
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
      if (out.includes(cell)) continue;
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
function grow(width: number, height: number, wrap: boolean, sources: number[], bias: number, random: Random): Int32Array {
  const near = neighboursOf({ width, height, wrap });
  const parent = new Int32Array(width * height).fill(-2);
  const frontier: number[] = [];
  const add = (cell: number): void => {
    for (const side of shuffled([0, 1, 2, 3], random)) frontier.push(cell * 4 + side);
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
    parent[next] = from;
    add(next);
  }
  return parent;
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
  const near = neighboursOf(plan);
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

/** The board a plan makes with its pieces facing as `given` says. */
function layoutOf(plan: Plan, given: readonly number[], truth: readonly number[]): Layout {
  const drains = plan.kind === "drains" ? [...plan.drains].sort((a, b) => a - b) : truth.flatMap((mask, cell) => (armsOf(mask) === 1 && !plan.sources.includes(cell) ? [cell] : []));
  return { width: plan.width, height: plan.height, kind: plan.kind, wrap: plan.wrap, cells: [...given], sources: [...plan.sources].sort((a, b) => a - b), drains };
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
  const near = neighboursOf(plan);
  const children = childrenOf(plan.parent);
  const branch = new Set<number>([cell]);
  for (const member of branch) for (const child of children[member]!) branch.add(child);
  const options: [number, number][] = [];
  for (const inside of branch) {
    for (let side = 0; side < 4; side += 1) {
      const outside = near[inside * 4 + side]!;
      if (outside === -1 || branch.has(outside) || (inside === cell && outside === plan.parent[cell])) continue;
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
type Settings = { width: number; height: number; kind: Kind; wrap: boolean; sources: number; drains: number; spares: number; bias: number | undefined; seed: number };

function settingsOf(options: MakeOptions): Settings {
  const width = options.width ?? options.size ?? 7;
  const height = options.height ?? options.size ?? width;
  const wrap = options.wrap ?? false;
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < (wrap ? 3 : 2) || height < (wrap ? 3 : 2) || width > MAX_SIDE || height > MAX_SIDE) throw new Error(`Not a board size: ${width}×${height}`);
  const cells = width * height;
  const sources = Math.min(Math.max(1, Math.floor(options.sources ?? 1)), Math.max(1, Math.floor(cells / 6)));
  return {
    width,
    height,
    kind: options.kind ?? "network",
    wrap,
    sources,
    drains: Math.max(sources, Math.floor(options.drains ?? Math.round(Math.sqrt(cells) * 0.8))),
    spares: Math.min(1, Math.max(0, options.spares ?? 0.5)),
    bias: options.bias,
    seed: (options.seed ?? 1) >>> 0,
  };
}

/** A plan for a new board, or null when the forest left a pump with no pipe to run through. */
function planOf(settings: Settings, random: Random): Plan | null {
  const { width, height, kind, wrap, sources, drains: drainCount, spares } = settings;
  const cells = width * height;
  const bias = settings.bias ?? 0.15 + random() * 0.75;
  const pumps = pickSources(width, height, wrap, sources, random);
  const parent = grow(width, height, wrap, pumps, bias, random);
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
  return { width, height, kind, wrap, parent, sources: pumps, drains, spare };
}

function madeOf(plan: Plan, random: Random, seed: number, discarded: number): Made {
  const truth = solved(plan);
  let layout = layoutOf(plan, scramble(truth, random), truth);
  while (flowOf(layout, layout.cells).solved) layout = layoutOf(plan, scramble(truth, random), truth);
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

/**
 * Makes a board that has exactly one answer. A random forest rarely has one
 * the first time: where the solver finds a second answer, the cells the two
 * answers disagree on are where to look, and a pipe beside one of them is
 * moved (or a spare piece taken off) until it does. A board the solver cannot
 * prove inside its budget is thrown away.
 */
export function makeUnscored(options: MakeOptions = {}): Made {
  const settings = settingsOf(options);
  const cells = settings.width * settings.height;
  const random = seededRandom(settings.seed);
  let discarded = 0;
  for (;;) {
    const plan = planOf(settings, random);
    if (plan === null) {
      discarded += 1;
      continue;
    }
    for (let round = 0; round < 40; round += 1) {
      const made = madeOf(plan, random, settings.seed, discarded);
      const result = solve(made.layout, 2, 20_000);
      if (!result.complete) break;
      if (result.count === 1) return made;
      // A second answer: find where the two disagree and change the board there.
      const [one, two] = result.solutions as [number[], number[]];
      const differ = shuffled(Array.from({ length: cells }, (_, cell) => cell).filter((cell) => one[cell] !== two[cell]), random);
      const need = used(plan);
      let changed = false;
      for (const cell of differ) {
        if (need[cell] !== true) {
          if (plan.spare[cell] === 0) continue;
          plan.spare[cell] = 0;
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
