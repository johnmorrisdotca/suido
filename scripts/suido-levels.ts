/**
 * THE SUIDO LEVELS, MADE ON A DESK:
 *
 *     node scripts/suido-levels.ts 5x5 7x7 …     make those sizes (every size when none is named)
 *     node scripts/suido-levels.ts --marks       write src/levels/marks.data.ts from the size files
 *     node scripts/suido-levels.ts --probe 10x10 how hard each kind of level measures at a size (writes nothing)
 *
 * For each size it makes a POOL of boards: thousands of plain ones and hundreds
 * of each kind with twists (`makeUnscored`, every one with exactly one answer),
 * each from a seed taken from the size, the kind and its number, so the same run
 * writes the same files. A board is dropped when it starts solved, has no more
 * than two turns to make, or is the same puzzle as one already kept turned or
 * mirrored (`symmetryKey`). Each is measured: `exactDifficultyOf`, its place
 * among boards of its size, kind and wrap, from 1 to 100.
 *
 * The levels are then taken from the pool one place at a time, easiest first.
 * Level `i` of `N` has an aim in score, 1 to 100 in even steps, and a kind of
 * board its place in its block asks for (`profileAt`): plain in the first block,
 * then each block's 15th and 16th a twist, and from the eighth block twists in
 * its other places too. A level is the board of its kind nearest its aim that is
 * no easier than the level before, so every level is at least as hard as the one
 * before. Where a kind has nothing at or past the level before, the level is a
 * plain one and the run says so.
 *
 * Nothing here runs on a site. The files are the levels everybody plays: a
 * level's number is its place, and the tests prove every one again on every build.
 */
import { existsSync, writeFileSync } from "node:fs";

import type { Layout } from "../src/code.ts";
import { exactDifficultyOf, difficultyOf } from "../src/difficulty.ts";
import { flowOf } from "../src/flow.ts";
import { makeUnscored, turnsFromAnswer, type MakeOptions } from "../src/generate.ts";
import { twistRole, type TwistRole } from "../src/ladder.ts";
import { SUIDO_BLOCK } from "../src/levelBlocks.ts";
import { SUIDO_LEVEL_COUNTS, SUIDO_SIZES, sizeOf, type LevelRow } from "../src/levelCounts.ts";
import { levelBoard, levelSolution, turnsOf } from "../src/levelRow.ts";
import { seededRandom, type Random } from "../src/random.ts";
import { solve } from "../src/solve.ts";
import { symmetryKey } from "../src/symmetry.ts";
import { SUIDO_TWISTS, twistsOf, type Twist } from "../src/twists.ts";

/** A name for a size's constant and file: `5x7` is `5X7`. */
const upper = (size: string): string => size.toUpperCase();

function hash(text: string): number {
  let h = 2166136261;
  for (const char of text) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The kinds of level: `plain`, or one to four twists joined with `+`. */
const PART_TWIST: Record<string, Twist> = { drains: "drains", pumps: "pumps", locked: "locked", walls: "walls", wrap: "wrap", path: "inlet-outlet" };

function twistsOfProfile(name: string): Twist[] {
  const parts = name === "plain" ? [] : name.split("+");
  return SUIDO_TWISTS.filter((twist) => parts.some((part) => PART_TWIST[part] === twist));
}

/** The options for one board of a kind, with its numbers drawn from `random`. */
function optionsFor(name: string, width: number, height: number, random: Random): MakeOptions {
  const cells = width * height;
  const parts = name === "plain" ? [] : name.split("+");
  const options: MakeOptions = { width, height };
  if (parts.includes("drains")) {
    options.kind = "drains";
    options.spares = 0.3 + random() * 0.5;
  }
  if (parts.includes("path")) {
    options.kind = "inlet-outlet";
    options.spares = 0.6 + random() * 0.35;
  }
  if (parts.includes("pumps")) options.sources = cells >= 100 && random() < 0.4 ? 3 : 2;
  // Mostly a few locks and walls, sometimes many: a few leave a board nearly as hard as it was, many make it easy.
  if (parts.includes("locked")) options.locked = Math.max(1, Math.round(cells * (0.01 + 0.15 * random() ** 2)));
  if (parts.includes("walls")) options.walls = Math.max(1, Math.round(cells * (0.02 + 0.18 * random() ** 2)));
  if (parts.includes("wrap")) options.wrap = true;
  return options;
}

/** The kinds a block introduces: its 15th level teaches the first of its kind, its 16th tests it. */
const TEACH: Record<number, string> = { 2: "drains", 3: "pumps", 4: "locked", 5: "walls", 6: "wrap", 7: "path" };
const COMBO: Record<number, string> = { 8: "wrap+locked", 9: "walls+locked", 10: "pumps+drains", 11: "path+locked", 12: "drains+wrap", 13: "pumps+wrap", 14: "path+walls", 15: "pumps+wrap+drains", 16: "wrap+drains+walls" };
/** Every kind in the order it is introduced, with the block it comes in at. */
const INTRODUCED: [string, number][] = [...Object.entries(TEACH), ...Object.entries(COMBO)].map(([block, name]) => [name, Number(block)]);

/** The kind of level the `slot`th place (1 to 16) of a block asks for. */
export function profileAt(block: number, slot: number): string {
  if (block === 1) return "plain";
  if (block <= 7) return slot >= SUIDO_BLOCK - 1 ? TEACH[block]! : "plain";
  if (slot >= SUIDO_BLOCK - 1) return COMBO[Math.min(block, 16)]!;
  // From the eighth block, twists in the places before the 15th too: one more each block, up to six.
  const places = [14, 12, 10, 13, 11, 9].slice(0, Math.min(6, block - 7));
  if (!places.includes(slot)) return "plain";
  const known = INTRODUCED.filter(([, at]) => at <= block).map(([name]) => name);
  return known[(block * 5 + slot) % known.length]!;
}

type Candidate = { layout: Layout; code: string; turns: string; score: number; key: string; profile: string };

/** A pool of boards of one kind: every one with one answer, no two the same puzzle, each measured. */
function poolOf(size: string, profile: string, count: number, seen: Set<string>): Candidate[] {
  const { width, height } = sizeOf(size)!;
  const want = twistsOfProfile(profile).join();
  const out: Candidate[] = [];
  for (let at = 0; at < count; at += 1) {
    const seed = hash(`${size}|${profile}|${at}`);
    const options = optionsFor(profile, width, height, seededRandom(seed ^ 0x9e3779b9));
    const made = makeUnscored({ ...options, seed });
    const { layout } = made;
    if (twistsOf(layout).join() !== want || flowOf(layout).solved || turnsFromAnswer(layout.cells, made.solution) <= 2) continue;
    const found = solve(layout, 2, 200_000);
    if (found.count !== 1 || !found.complete) continue;
    const key = symmetryKey(layout, made.solution);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ layout, code: made.code, turns: turnsOf(layout, made.solution)!, score: exactDifficultyOf(layout, made.solution), key, profile });
  }
  return out.sort((a, b) => a.score - b.score || (a.key < b.key ? -1 : 1));
}

function fileFor(size: string, rows: readonly LevelRow[]): string {
  const lines = rows.map(([code, turns, twists]) => `  ["${code}", "${turns}", "${twists}"],`);
  return [
    "/**",
    ` * SUIDO AT ${size.replace("x", "×")}: ${rows.length} levels in blocks of 16, each no easier than the one before by the measured difficulty (\`difficulty.ts\`), each block's 15th and 16th its twist from the second block on.`,
    " *",
    " * WRITTEN BY `node scripts/suido-levels.ts`, NEVER BY HAND. Each line is one",
    " * level: its board as a code (`code.ts`), its answer as a digit for each cell (the",
    " * quarter turns clockwise from the way the board gives the piece to the way the",
    " * answer has it), and the twists it declares. Every level is proved to have exactly",
    " * one answer by `levels.test.ts`, no two are the same board under a turn or a",
    " * mirror, and the order is held to the measure.",
    " */",
    `export const SUIDO_${upper(size)}: readonly (readonly [string, string, string])[] = [`,
    ...lines,
    "];",
    "",
  ].join("\n");
}

/** How many of each kind to make for a size: plenty, since only the board nearest each aim is kept. */
function poolSizes(size: string): { plain: number; twist: number } {
  const { width, height } = sizeOf(size)!;
  const cells = width * height;
  return cells <= 100 ? { plain: 3200, twist: 700 } : { plain: 2600, twist: 450 };
}

function make(size: string): void {
  const started = performance.now();
  const count = SUIDO_LEVEL_COUNTS[size]!;
  const slots = Array.from({ length: count }, (_, at) => profileAt(Math.floor(at / SUIDO_BLOCK) + 1, (at % SUIDO_BLOCK) + 1));
  const kinds = [...new Set(slots)];
  const sizes = poolSizes(size);
  const seen = new Set<string>();
  const pools = new Map<string, Candidate[]>();
  // Plain first: its boards keep their place when another kind finds the same puzzle.
  for (const kind of kinds.sort((a, b) => (a === "plain" ? -1 : b === "plain" ? 1 : 0))) pools.set(kind, poolOf(size, kind, kind === "plain" ? sizes.plain : sizes.twist, seen));
  const made = performance.now();
  const used = new Set<Candidate>();
  const rows: LevelRow[] = [];
  const picked: Candidate[] = [];
  let before = 0;
  const fallbacks: string[] = [];
  for (let at = 0; at < count; at += 1) {
    const aim = 1 + (99 * at) / (count - 1);
    const choose = (kind: string): Candidate | null => {
      let best: Candidate | null = null;
      for (const one of pools.get(kind)!) {
        if (used.has(one) || one.score < before) continue;
        if (best === null || Math.abs(one.score - aim) < Math.abs(best.score - aim)) best = one;
        // The pool is in order of score: past the aim, every one is farther.
        if (one.score > aim) break;
      }
      return best;
    };
    let pick = choose(slots[at]!);
    if (pick === null) {
      fallbacks.push(`level ${at + 1}: ${slots[at]} → plain`);
      pick = choose("plain");
    }
    if (pick === null) throw new Error(`${size}: no board left for level ${at + 1}`);
    used.add(pick);
    picked.push(pick);
    before = pick.score;
    rows.push([pick.code, pick.turns, twistsOf(pick.layout).join(" ")]);
  }
  writeFileSync(`src/levels/size${size}.data.ts`, fileFor(size, rows));
  const worst = Math.max(...picked.map((one, at) => Math.abs(one.score - (1 + (99 * at) / (count - 1)))));
  const twisted = picked.filter((one) => one.profile !== "plain").length;
  console.log(`${size}: ${count} levels (${twisted} with twists), furthest from its aim ${worst.toFixed(1)}, ${fallbacks.length} fallbacks, pools in ${Math.round((made - started) / 1000)} s, all in ${Math.round((performance.now() - started) / 1000)} s`);
  for (const line of fallbacks) console.log(`  ${line}`);
}

function marksFile(marks: Record<string, string>, roles: Record<string, Record<number, TwistRole>>): string {
  return [
    "/**",
    " * EVERY SUIDO LEVEL'S DIFFICULTY, 1 TO 5: one digit a level, level 1 first, from",
    " * its measured score (`difficulty.ts`, 1 to 100 among boards of its size) in steps",
    " * of twenty: the marks a level shows. And each twist level's part in its block's",
    " * lesson (`twistRole`), so a board of levels can say it without loading a size's",
    " * boards. Written by `node scripts/suido-levels.ts --marks`, never by hand;",
    " * `levels.test.ts` holds both to the levels.",
    " */",
    'import type { TwistRole } from "../ladder.ts";',
    "",
    "export const SUIDO_MARKS: Readonly<Record<string, string>> = {",
    ...Object.entries(marks).map(([size, digits]) => `  "${size}": "${digits}",`),
    "};",
    "",
    "export const SUIDO_ROLES: Readonly<Record<string, Readonly<Record<number, TwistRole>>>> = {",
    ...Object.entries(roles).map(([size, bySize]) => `  "${size}": ${JSON.stringify(bySize)},`),
    "};",
    "",
  ].join("\n");
}

/** A level's marks: its score in steps of twenty, 1 to 5. */
export function marksOf(score: number): number {
  return Math.min(5, 1 + Math.floor(score / 20));
}

async function marks(): Promise<void> {
  const marksBy: Record<string, string> = {};
  const rolesBy: Record<string, Record<number, TwistRole>> = {};
  for (const size of SUIDO_SIZES) {
    if (!existsSync(`src/levels/size${size}.data.ts`)) continue;
    const rows = ((await import(`../src/levels/size${size}.data.ts`)) as Record<string, readonly LevelRow[]>)[`SUIDO_${upper(size)}`]!;
    marksBy[size] = rows.map((row) => String(marksOf(difficultyOf(levelBoard(row)!, levelSolution(row)!)))).join("");
    rolesBy[size] = Object.fromEntries(
      rows.flatMap((_, at) => {
        const role = twistRole(rows, at + 1);
        return role === null ? [] : [[at + 1, role]];
      }),
    );
    console.log(`${size}: marks and roles written (${Object.keys(rolesBy[size]!).length} twist levels in places 15 and 16)`);
  }
  writeFileSync("src/levels/marks.data.ts", marksFile(marksBy, rolesBy));
}

/** What a size's boards of each kind measure: their scores at a few places, and how long they take to make. */
function probe(size: string): void {
  const kinds = ["plain", ...Object.values(TEACH), ...Object.values(COMBO)];
  for (const kind of kinds) {
    const started = performance.now();
    const pool = poolOf(size, kind, 200, new Set());
    const at = (share: number): string => (pool.length === 0 ? "-" : pool[Math.min(pool.length - 1, Math.floor(share * (pool.length - 1)))]!.score.toFixed(0));
    console.log(`${size} ${kind.padEnd(20)} ${String(pool.length).padStart(3)} boards  ${[0, 0.1, 0.25, 0.5, 0.75, 0.9, 1].map(at).join(" ")}   ${Math.round(performance.now() - started)} ms`);
  }
}

const args = process.argv.slice(2);
if (args[0] === "--marks") await marks();
else if (args[0] === "--probe") probe(args[1] ?? "10x10");
else {
  const asked = args.filter((arg) => !arg.startsWith("--"));
  for (const size of asked.length > 0 ? asked : SUIDO_SIZES) make(size);
}
