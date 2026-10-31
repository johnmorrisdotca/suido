import type { BigMix } from "./bigPieces.ts";
import { blockCells, turnBlock } from "./blocks.ts";
import { encodeLayout, type Kind, type Layout } from "./code.ts";
import { difficultyOf } from "./difficulty.ts";
import { flowOf } from "./flow.ts";
import { opposite, turn } from "./pieces.ts";
import {
  BLOCKERS,
  bareNear,
  edgeId,
  layoutOf,
  lockable,
  type Plan,
  planOf,
  rewire,
  type Settings,
  scramble,
  settingsOf,
  sideBetween,
  solved,
  used,
} from "./plan.ts";
import { type Random, seededRandom, shuffled } from "./random.ts";
import { solve } from "./solve.ts";

/** What a new board may be asked for. Everything has a default but the seed, and a seed has one too.
 *
 * @example
 * ```ts
 * import type { MakeOptions } from "@johnmorrisdotca/suido";
 *
 * const value: MakeOptions = {size:5,seed:42,kind:"network"};
 * console.log(value);
 * ```
 */
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

/** A new board: its code, the code of its one answer, and what it was made from.
 *
 * @example
 * ```ts
 * import { SUIDO_5X5 } from "@johnmorrisdotca/suido/levels-5x5";
 * import { decodeLayout } from "@johnmorrisdotca/suido";
 * import { levelAnswer, levelSolution } from "@johnmorrisdotca/suido/levels";
 * import type { Made } from "@johnmorrisdotca/suido";
 *
 * const row = SUIDO_5X5[0];
 * const code = row[0];
 * const layout = decodeLayout(code)!;
 * const answer = levelAnswer(row)!;
 * const solution = levelSolution(row)!;
 * const value: Made = {code,answer,layout,solution,seed:42,discarded:0};
 * console.log(value);
 * ```
 */
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

/** A new board with how hard it is.
 *
 * @example
 * ```ts
 * import { SUIDO_5X5 } from "@johnmorrisdotca/suido/levels-5x5";
 * import { decodeLayout } from "@johnmorrisdotca/suido";
 * import { levelAnswer, levelSolution } from "@johnmorrisdotca/suido/levels";
 * import type { MadeScored } from "@johnmorrisdotca/suido";
 *
 * const row = SUIDO_5X5[0];
 * const code = row[0];
 * const layout = decodeLayout(code)!;
 * const answer = levelAnswer(row)!;
 * const solution = levelSolution(row)!;
 * const value: MadeScored = {...{code,answer,layout,solution,seed:42,discarded:0},difficulty:50,tried:1};
 * console.log(value);
 * ```
 */
export type MadeScored = Made & {
  /** 1 to 100 among boards of its size: see `difficultyOf`. */
  difficulty: number;
  /** How many boards were made to find it, when a difficulty was asked for. */
  tried: number;
};

function madeOf(plan: Plan, random: Random, seed: number, discarded: number): Made {
  const truth = solved(plan);
  /** The plan scrambled once: every piece that is not locked turned a random way. */
  const scrambled = (): Layout => {
    const given = scramble(truth, random);
    // A square turns as one: it is the way the answer has it, turned a random number of quarters.
    for (const block of plan.placed) {
      const cells = blockCells(block.anchor, plan.width);
      const turned = turnBlock(
        truth,
        { index: 0, anchor: block.anchor, big: block.kind !== null, cells },
        Math.floor(random() * 4),
      );
      for (const cell of cells) given[cell] = turned[cell]!;
    }
    const layout = layoutOf(plan, given, truth);
    for (const cell of layout.locked ?? []) layout.cells[cell] = truth[cell]!;
    return layout;
  };
  let layout = scrambled();
  // Locks can leave nothing to turn, in which case a board is never unsolved: it is given up on after a few tries.
  for (let tries = 0; flowOf(layout, layout.cells).solved && tries < 200; tries += 1) layout = scrambled();
  return {
    code: encodeLayout(layout),
    answer: encodeLayout({ ...layout, cells: truth }),
    layout,
    solution: truth,
    seed,
    discarded,
  };
}

/**
 * A board laid out and turned at random, with no promise about how many answers
 * it has: the raw material `makeSuido` shapes. Its `solution` is one answer.
 *
 * @param options - Drawing, mounting or generator choices specified by the signature.
 * @returns A board laid out and turned at random, with no promise about how many answers it has: the raw material `makeSuido` shapes. Its `solution` is one answer.
 * @example
 * ```ts no-run
 * import { SUIDO_5X5 } from "@johnmorrisdotca/suido/levels-5x5";
 * import { laySuido } from "@johnmorrisdotca/suido";
 *
 * const row = SUIDO_5X5[0];
 * const code = row[0];
 * console.log(laySuido({size:5,seed:42}).code);
 * ```
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
      if (
        next !== -1 &&
        flow.wet[next] === true &&
        ((masks[cell]! >> side) & 1) === 1 &&
        ((masks[next]! >> opposite(side)) & 1) === 1
      )
        edges.add(edgeId(near, cell, side));
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
function tighten(
  plan: Plan,
  settings: Settings,
  layout: Layout,
  one: readonly number[],
  two: readonly number[],
  random: Random,
): boolean {
  const truth = solved(plan);
  const bare = bareNear(plan);
  const first = waterEdges(layout, one, bare);
  const second = waterEdges(layout, two, bare);
  const wallEdges = [...first]
    .filter((edge) => !second.has(edge))
    .concat([...second].filter((edge) => !first.has(edge)));
  const pipes = forestEdges(plan, bare);
  const walls =
    settings.walls > plan.walls.size
      ? wallEdges.filter((edge) => !pipes.has(edge) && !plan.walls.has(edge) && !insideBlock(plan, edge, bare))
      : [];
  const fit = new Set(lockable(plan, truth));
  const locks =
    settings.locked > locksHeld(plan, truth)
      ? Array.from({ length: truth.length }, (_, cell) => cell).filter(
          (cell) => one[cell] !== two[cell] && fit.has(cell) && !plan.locked.has(cell),
        )
      : [];
  if (walls.length === 0 && locks.length === 0) return false;
  if (locks.length === 0 || (walls.length > 0 && random() < 0.5))
    plan.walls.add(walls[Math.floor(random() * walls.length)]!);
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
        if (
          next !== -1 &&
          !pipes.has(edge) &&
          !plan.walls.has(edge) &&
          !insideBlock(plan, edge, bare) &&
          (need[cell] === true || need[next] === true)
        )
          options.push(edge);
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
 *
 * @param options - Drawing, mounting or generator choices specified by the signature.
 * @returns Makes a board that has exactly one answer. A random forest rarely has one the first time: where the solver finds a second answer, the cells the two answers disagree on are where to look, and a pipe beside one of them is moved (or a spare piece taken off) until it does. Where walls or locks are asked for, they are what is built first, and any not needed are added at the end. A board the solver cannot prove inside its budget is thrown away.
 * @example
 * ```ts no-run
 * import { SUIDO_5X5 } from "@johnmorrisdotca/suido/levels-5x5";
 * import { makeUnscored } from "@johnmorrisdotca/suido";
 *
 * const row = SUIDO_5X5[0];
 * const code = row[0];
 * console.log(makeUnscored({size:5,seed:42}).code);
 * ```
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
      const differ = shuffled(
        Array.from({ length: cells }, (_, cell) => cell).filter((cell) => one[cell] !== two[cell]),
        random,
      );
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
 *
 * @param options - Drawing, mounting or generator choices specified by the signature.
 * @returns Makes a board with exactly one answer and says how hard it is. With a `difficulty` asked for it makes boards (each its own seed, the first the seed given) until one is within `tolerance` of it, or `attempts` have been made, and gives the nearest. The board's `seed` is the one that made it, so `makeSuido({ ...options, seed: made.seed })` makes it again.
 * @example
 * ```ts no-run
 * import { makeSuido } from "@johnmorrisdotca/suido";
 *
 * console.log(makeSuido({size:5,seed:42,difficulty:50,attempts:3}).difficulty);
 * ```
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
    if (best === null || aim === undefined || Math.abs(difficulty - aim) < Math.abs(best.difficulty - aim))
      best = { ...made, difficulty, tried: 0 };
    if (aim === undefined || Math.abs(difficulty - aim) <= tolerance) break;
  }
  return { ...best!, tried };
}

/** The turns a board needs, when taps turn a piece either way: how far it is from solved.
 *
 * @param given - The starting pipe masks.
 * @param solution - The solved pipe masks in row-major cell order.
 * @returns The turns a board needs, when taps turn a piece either way: how far it is from solved.
 * @example
 * ```ts
 * import { SUIDO_5X5 } from "@johnmorrisdotca/suido/levels-5x5";
 * import { decodeLayout, turnsFromAnswer } from "@johnmorrisdotca/suido";
 * import { levelSolution } from "@johnmorrisdotca/suido/levels";
 *
 * const row = SUIDO_5X5[0];
 * const code = row[0];
 * const layout = decodeLayout(code)!;
 * const solution = levelSolution(row)!;
 * console.log(turnsFromAnswer(layout.cells,solution));
 * ```
 */
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
