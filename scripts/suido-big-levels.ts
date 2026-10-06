/**
 * THE BIG-PIECES LEVELS, MADE ON A DESK:
 *
 *     node scripts/suido-big-levels.ts            make the set: src/levels/big.data.ts and src/levels/bigInfo.data.ts
 *     node scripts/suido-big-levels.ts --probe    print the set it would make, and write nothing
 *
 * Sixty-four levels, every one with big pieces in it, from the easiest to the hardest, on boards of every size from 5×5 to 20×20.
 * For each of fourteen sizes it makes a POOL of boards of each kind a level can be (big pieces alone, or with blocks that turn as
 * one, a second pump, walls, locked pieces or edges that join), every one with exactly one answer, each from a seed taken from
 * the size, the kind and its number, so the same run writes the same files. Every board is a MIX: ordinary 1×1 pieces with some 2×2 big pieces
 * among them, drawn from the shapes a size's boards use (`MIXES`): pipes side by side, a cross or a tee inside a plate, three pipes in one. A board is dropped when it
 * starts solved, has no more than two turns to make, has no big piece left in it, or is the same puzzle as one already kept
 * turned or mirrored (`symmetryKey`). Each is scored across the whole set (`exactBigScoreOf`: how much of the board its answer
 * uses, and how tangled it is for its size), from 1 to 100.
 *
 * The levels are then taken one place at a time. Level `i` of 64 has an aim in score, 1 to 100 in even steps, and a kind of
 * board its place asks for (`PROFILES`): big pieces alone until the 15th level teaches blocks that turn as one and the 16th
 * tests them, and so on up the four blocks of sixteen. A level is the board of its kind nearest its aim that is no easier than
 * the level before and of a size near the one its aim calls for, so every level is at least as hard as the one before, the
 * steps are even, and the sizes climb.
 *
 * Nothing here runs on a site. The files are the levels everybody plays: a level's number is its place, and the tests prove every
 * one again on every build.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";

import { decodeLayout } from "../src/code.ts";

import type { Layout } from "../src/code.ts";
import { blendBigScore, sizeTermOf } from "../src/bigDifficulty.ts";
import { bigShapesIn, inBigMix, type BigMix } from "../src/bigPieces.ts";
import { exactDifficultyOf } from "../src/difficulty.ts";
import { flowOf } from "../src/flow.ts";
import { makeUnscored, turnsFromAnswer, type MakeOptions } from "../src/generate.ts";
import { sizeOf, SUIDO_BIG_COUNT, type LevelRow } from "../src/levelCounts.ts";
import { turnsOf } from "../src/levelRow.ts";
import { seededRandom, type Random } from "../src/random.ts";
import { solve } from "../src/solve.ts";
import { symmetryKey } from "../src/symmetry.ts";
import { SUIDO_TWISTS, twistsOf, type Twist } from "../src/twists.ts";

/** The sizes the set draws on, smallest first: the square sizes 5×5 to 14×14, three pipe shapes, and the huge 20×20. */
const SIZES = ["5x5", "6x6", "5x7", "7x7", "8x8", "6x10", "9x9", "10x10", "11x11", "12x12", "8x14", "13x13", "14x14", "20x20"];

function hash(text: string): number {
  let h = 2166136261;
  for (const char of text) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** What a kind of level adds to big pieces, written as parts joined with `+`: `plain` for big pieces alone. */
const PART_TWIST: Record<string, Twist> = { blocks: "block-turns", pumps: "pumps", walls: "walls", locked: "locked", wrap: "wrap" };

function twistsOfProfile(profile: string): Twist[] {
  const parts = profile === "plain" ? [] : profile.split("+");
  return SUIDO_TWISTS.filter((twist) => twist === "big-pieces" || parts.some((part) => PART_TWIST[part] === twist));
}

/** The big pieces a board of a size draws from, one of these at random (`BigMix`): the small boards the plainest, the huge ones every shape there is. */
const MIXES: Record<string, readonly BigMix[]> = {
  "5x5": ["simple"],
  "6x6": ["simple", "simple", "more"],
  "5x7": ["simple", "simple", "more"],
  "7x7": ["simple", "more"],
  "8x8": ["simple", "more", "more"],
  "6x10": ["simple", "more", "more"],
  "9x9": ["more", "more", "all"],
  "10x10": ["more", "all"],
  "11x11": ["more", "all"],
  "12x12": ["more", "all", "all"],
  "8x14": ["more", "all"],
  "13x13": ["more", "all", "all"],
  "14x14": ["more", "all", "all"],
  "20x20": ["simple", "more", "all", "all"],
};

/** The share of a board's cells that big pieces cover: from a plate or two on a small board to a board thick with them, a number between these at random. */
const COVER = [0.1, 0.34] as const;

/** The options for one board of a kind, with its numbers drawn from `random`. */
function optionsFor(profile: string, width: number, height: number, random: Random): MakeOptions {
  const cells = width * height;
  const parts = profile === "plain" ? [] : profile.split("+");
  const mixes = MIXES[`${width}x${height}`]!;
  const cover = COVER[0] + (COVER[1] - COVER[0]) * random() ** 1.3;
  const options: MakeOptions = { width, height, bigKinds: mixes[Math.floor(random() * mixes.length)]!, bigs: Math.max(1, Math.round((cells * cover) / 4)) };
  if (parts.includes("blocks")) options.blocks = Math.max(1, Math.round(cells * (0.01 + 0.03 * random())));
  if (parts.includes("pumps")) options.sources = cells >= 100 && random() < 0.4 ? 3 : 2;
  if (parts.includes("locked")) options.locked = Math.max(1, Math.round(cells * (0.01 + 0.12 * random() ** 2)));
  if (parts.includes("walls")) options.walls = Math.max(1, Math.round(cells * (0.02 + 0.15 * random() ** 2)));
  if (parts.includes("wrap")) options.wrap = true;
  return options;
}

/**
 * The kind of board each of the sixty-four places asks for. Big pieces alone for the first fourteen of the first block; its 15th teaches blocks that turn
 * as one and its 16th tests them. Each block after teaches one more in its 15th and 16th (a second pump, walls, edges that join) and mixes the ones taught
 * so far into more of its places as it goes.
 */
export const PROFILES: readonly string[] = (() => {
  const out = Array.from({ length: SUIDO_BIG_COUNT }, () => "plain");
  const set = (level: number, profile: string): void => {
    out[level - 1] = profile;
  };
  // The teaching places, and what each tests together with what came before.
  set(15, "blocks");
  set(16, "blocks");
  set(31, "pumps");
  set(32, "pumps");
  set(47, "walls");
  set(48, "walls");
  set(63, "wrap");
  set(64, "wrap");
  // Mixed in once taught, in the blocks after the one that teaches it: blocks that turn from the second block, a second pump from the third, walls in the fourth.
  for (const level of [26, 29]) set(level, "blocks");
  for (const level of [34, 38, 41, 45]) set(level, "blocks");
  for (const level of [36, 42]) set(level, "pumps");
  set(44, "blocks+pumps");
  for (const level of [49, 55, 61]) set(level, "blocks");
  for (const level of [51, 57]) set(level, "pumps");
  for (const level of [52, 53, 58, 59]) set(level, "walls");
  set(56, "blocks+pumps");
  set(60, "walls+pumps");
  set(62, "blocks+pumps");
  return out;
})();

type Candidate = { layout: Layout; code: string; turns: string; score: number; used: number; tangle: number; key: string; profile: string; size: string; plates: number; share: number; variety: number };

/** How tricky a big piece is, 1 to 3: 1 for a plain one (one or two pipes, four openings at most), 2 for one or two pipes with more, 3 for three pipes in one. */
const plateLevel = (shape: { pipes: number; openings: number }): number => (inBigMix(shape, "simple") ? 1 : inBigMix(shape, "more") ? 2 : 3);

/** What a board has of big pieces: how many, the share of its cells they cover, and how tricky they are on average, 1 to 3. */
function platesOf(layout: Layout): { plates: number; share: number; variety: number } {
  const found = bigShapesIn(layout, layout.cells);
  const levels = found.map((one) => plateLevel(one.shape));
  return { plates: found.length, share: (4 * found.length) / layout.cells.length, variety: levels.length === 0 ? 0 : levels.reduce((sum, level) => sum + level, 0) / levels.length };
}

/** A candidate as the desk's cache keeps it: everything but the layout, which its code makes again. */
function withoutLayout(one: Candidate): Omit<Candidate, "layout"> {
  const copy: Partial<Candidate> = { ...one };
  delete copy.layout;
  return copy as Omit<Candidate, "layout">;
}

/**
 * How many boards of a kind to make at a size. Plenty, since only the board nearest each aim is kept, and most where
 * the choice is thinnest: the hardest levels can only be big boards that are tangled for their size, a few in a hundred of them.
 */
function poolCount(size: string, profile: string): number {
  const { width, height } = sizeOf(size)!;
  const cells = width * height;
  const plain = profile === "plain";
  if (cells >= 400) return plain ? 4000 : profile === "wrap" ? 3000 : 600;
  if (cells >= 150) return plain ? 1400 : 220;
  if (cells >= 100) return plain ? 800 : 150;
  return plain ? 400 : 110;
}

/** A pool of boards of one kind at one size: every one with one answer, no two the same puzzle, each scored. `from` is the first seed number, so a pool can be made longer without making its first boards again. */
function poolOf(size: string, profile: string, seen: Set<string>, from = 0): Candidate[] {
  const { width, height } = sizeOf(size)!;
  const want = twistsOfProfile(profile).join();
  const out: Candidate[] = [];
  const count = poolCount(size, profile);
  for (let at = from; at < count; at += 1) {
    const seed = hash(`big|${size}|${profile}|${at}`);
    const options = optionsFor(profile, width, height, seededRandom(seed ^ 0x9e3779b9));
    const made = makeUnscored({ ...options, seed });
    const { layout } = made;
    if (twistsOf(layout).join() !== want || flowOf(layout).solved || turnsFromAnswer(layout.cells, made.solution) <= 2) continue;
    const found = solve(layout, 2, 200_000);
    if (found.count !== 1 || !found.complete) continue;
    const key = symmetryKey(layout, made.solution);
    if (seen.has(key)) continue;
    seen.add(key);
    const used = flowOf(layout, made.solution).wetPieces;
    const tangle = exactDifficultyOf(layout, made.solution);
    out.push({ layout, code: made.code, turns: "", score: blendBigScore(used, tangle), used, tangle, key, profile, size, ...platesOf(layout) });
  }
  return out;
}

/** The size term a level's aim calls for: where the aim falls with the tangle at the middle of its range, so a level is neither the easiest nor the hardest of its size. */
const sizeCallFor = (aim: number): number => Math.min(1, Math.max(0, (aim - 25) / 50));

/** The share of the board big pieces cover that a place at this aim asks for, and how tricky it asks them to be (1 to 3): a few plain ones early, more of them and trickier ones as the levels climb. */
const shareCallFor = (aim: number): number => 0.14 + 0.2 * (aim / 100);
const varietyCallFor = (aim: number): number => 1 + 1.1 * (aim / 100);

/** How far a candidate is from what a place wants: its score from the aim, and, much less, its size from the size the aim calls for, how much of the board its big pieces cover and how tricky they are. */
const costOf = (one: Candidate, aim: number): number =>
  Math.abs(one.score - aim) + 18 * Math.abs(sizeTermOf(one.used) - sizeCallFor(aim)) + 30 * Math.abs(one.share - shareCallFor(aim)) + 5 * Math.abs(one.variety - varietyCallFor(aim));

function build(): { rows: LevelRow[]; picked: Candidate[] } {
  const started = performance.now();
  const seen = new Set<string>();
  const pools = new Map<string, Candidate[]>();
  const kinds = [...new Set(PROFILES)].sort((a, b) => (a === "plain" ? -1 : b === "plain" ? 1 : 0));
  // Plain first: its boards keep their place when another kind finds the same puzzle.
  // A desk keeps the pools in a file named by BIG_POOLS while it tunes the choice, so a run need not make them again.
  const cache = process.env.BIG_POOLS;
  if (cache !== undefined && existsSync(cache)) {
    const kept = JSON.parse(readFileSync(cache, "utf8")) as Record<string, Omit<Candidate, "layout">[]>;
    for (const kind of kinds) pools.set(kind, kept[kind]!.map((one) => ({ ...one, layout: decodeLayout(one.code)!, ...platesOf(decodeLayout(one.code)!) })));
  } else {
    for (const kind of kinds) pools.set(kind, SIZES.flatMap((size) => poolOf(size, kind, seen)));
    if (cache !== undefined) writeFileSync(cache, JSON.stringify(Object.fromEntries([...pools].map(([kind, pool]) => [kind, pool.map(withoutLayout)]))));
  }
  console.error(`pools made in ${Math.round((performance.now() - started) / 1000)} s: ${[...pools].map(([kind, pool]) => `${kind} ${pool.length}`).join(", ")}`);
  // BIG_EXTEND=kind:size:from makes a kind's boards at a size from that seed number on, onto the pools kept in BIG_POOLS, when a place has too few to choose from.
  const extend = process.env.BIG_EXTEND?.split(":");
  if (cache !== undefined && extend !== undefined) {
    const [kind, size, from] = extend as [string, string, string];
    const more = poolOf(size, kind, new Set(), Number(from));
    pools.get(kind)!.push(...more);
    writeFileSync(cache, JSON.stringify(Object.fromEntries([...pools].map(([name, pool]) => [name, pool.map(withoutLayout)]))));
    console.error(`${more.length} more ${kind} boards at ${size}`);
  }
  const used = new Set<Candidate>();
  const usedKeys = new Set<string>();
  const rows: LevelRow[] = [];
  const picked: Candidate[] = [];
  let before = 0;
  const fallbacks: string[] = [];
  for (let at = 0; at < SUIDO_BIG_COUNT; at += 1) {
    const aim = 1 + (99 * at) / (SUIDO_BIG_COUNT - 1);
    let best: Candidate | null = null;
    for (const one of pools.get(PROFILES[at]!)!) {
      if (used.has(one) || usedKeys.has(one.key) || one.score < before) continue;
      if (best === null || costOf(one, aim) < costOf(best, aim)) best = one;
    }
    if (best === null) {
      // A kind whose boards are all easier than the level before has nothing here: the level is a plain one, and the run says so.
      fallbacks.push(`level ${at + 1}: ${PROFILES[at]} -> plain`);
      for (const one of pools.get("plain")!) {
        if (used.has(one) || usedKeys.has(one.key) || one.score < before) continue;
        if (best === null || costOf(one, aim) < costOf(best, aim)) best = one;
      }
    }
    if (best === null) throw new Error(`No board left for level ${at + 1} (${PROFILES[at]}).`);
    used.add(best);
    usedKeys.add(best.key);
    picked.push(best);
    before = best.score;
    // The answer is solved again here, and written as the turns of the pieces and of the squares (`turnsOf`).
    const answer = solve(best.layout, 2, 200_000);
    const turns = answer.count === 1 && answer.complete ? turnsOf(best.layout, answer.solutions[0]!) : null;
    if (turns === null) throw new Error(`Level ${at + 1} has no single answer to write.`);
    rows.push([best.code, turns, twistsOf(best.layout).join(" ")]);
  }
  for (const line of fallbacks) console.error(line);
  return { rows, picked };
}

function dataFile(rows: readonly LevelRow[]): string {
  const lines = rows.map(([code, turns, twists]) => `  ["${code}", "${turns}", "${twists}"],`);
  return [
    "/**",
    ` * SUIDO'S BIG-PIECES LEVELS: ${rows.length} levels with big pieces in every one, from the easiest to the hardest across the whole set (\`bigDifficulty.ts\`), on boards of many sizes.`,
    " *",
    " * WRITTEN BY `node scripts/suido-big-levels.ts`, NEVER BY HAND. Each line is one",
    " * level: its board as a code (`code.ts`), its answer as a digit for each cell (the",
    " * quarter turns clockwise from the way the board gives the piece to the way the",
    " * answer has it), and the twists it declares. Every level is proved to have exactly",
    " * one answer by `bigLevels.test.ts`, no two are the same board under a turn or a",
    " * mirror, and the order is held to the score.",
    " */",
    "export const SUIDO_BIG: readonly (readonly [string, string, string])[] = [",
    ...lines,
    "];",
    "",
  ].join("\n");
}

function infoFile(picked: readonly Candidate[]): string {
  const sizes = picked.map((one) => one.size);
  const scores = picked.map((one) => Math.min(100, Math.max(1, Math.round(one.score))));
  const twists = picked.map((one) => twistsOf(one.layout).join(" "));
  const pieces = picked.map((one) => one.plates);
  return [
    "/**",
    " * WHAT IS KNOWN OF EVERY BIG-PIECES LEVEL WITHOUT ITS BOARD: the size of its board, how hard it is across the whole set (1 to 100,",
    " * `bigDifficulty.ts`), the twists it has and how many big pieces it has among its ordinary ones, in level order, so a page lists the set",
    " * and a server names a level's size without loading sixty-four boards. Written by `node scripts/suido-big-levels.ts`, never by hand;",
    " * `bigLevels.test.ts` holds all four to the levels.",
    " */",
    `export const SUIDO_BIG_SIZES: readonly string[] = ${JSON.stringify(sizes)};`,
    "",
    `export const SUIDO_BIG_SCORES: readonly number[] = ${JSON.stringify(scores)};`,
    "",
    `export const SUIDO_BIG_TWISTS: readonly string[] = ${JSON.stringify(twists)};`,
    "",
    `export const SUIDO_BIG_PIECES: readonly number[] = ${JSON.stringify(pieces)};`,
    "",
  ].join("\n");
}

const { rows, picked } = build();
const probe = process.argv[2] === "--probe";
let lastScore = 0;
for (const [at, one] of picked.entries()) {
  const aim = 1 + (99 * at) / (SUIDO_BIG_COUNT - 1);
  const layout = one.layout;
  const step = one.score - lastScore;
  lastScore = one.score;
  console.log(
    `${String(at + 1).padStart(2)} ${one.size.padEnd(6)} score ${one.score.toFixed(1).padStart(5)} aim ${aim.toFixed(1).padStart(5)} step ${step.toFixed(1).padStart(4)}  bigs ${String(layout.bigs?.length ?? 0).padStart(2)} (${(one.share * 100).toFixed(0).padStart(2)}% of cells, variety ${one.variety.toFixed(1)}) blocks ${layout.blocks?.length ?? 0}  used ${String(one.used).padStart(3)} tangle ${one.tangle.toFixed(0).padStart(3)}  ${twistsOf(layout).join(" ")}`,
  );
}
if (!probe) {
  writeFileSync("src/levels/big.data.ts", dataFile(rows));
  writeFileSync("src/levels/bigInfo.data.ts", infoFile(picked));
  console.error("src/levels/big.data.ts and src/levels/bigInfo.data.ts written");
}
