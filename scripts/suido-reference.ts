// Makes src/difficulty.reference.ts: for every size, kind and wrap, a set of boards from the package's own
// generator, each measured, and the measures kept as quantiles. Seeded, so the same run writes the same file.
//
//   node scripts/suido-reference.ts            every set, 600 boards each
//   node scripts/suido-reference.ts 12 40      one side only, as many boards as the second number says (prints, writes nothing)
//   node scripts/suido-reference.ts --part 28 150 drains wrap   one set (side, boards, kind, and `wrap` for edges that join), written as JSON to the file named by --out
//   node scripts/suido-reference.ts --merge a.json b.json …     adds the sets in those files to src/difficulty.reference.ts, and the sides they are for to DIFFICULTY_SIDES
import { writeFileSync } from "node:fs";

import { blendOf, MEASURE_NAMES, measureSuido, quantilesOf, referenceKey, type Measure, type Reference } from "../src/difficulty.ts";
import { makeUnscored } from "../src/generate.ts";
import type { Kind } from "../src/code.ts";

const SIDES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16];
const mode = process.argv[2]?.startsWith("--") ? process.argv[2] : null;
const only = mode !== null || process.argv[2] === undefined ? null : Number(process.argv[2]);
const boards = Number(process.argv[mode === "--part" ? 4 : 3] ?? 600);

function referenceOf(side: number, kind: Kind, wrap: boolean): Reference {
  const measures: Measure[] = [];
  for (let seed = 1; seed <= boards; seed += 1) {
    const made = makeUnscored({ size: side, kind, wrap, seed });
    measures.push(measureSuido(made.layout, made.solution));
  }
  const parts = Object.fromEntries(MEASURE_NAMES.map((name) => [name, quantilesOf(measures.map((measure) => measure[name]), 21)])) as Record<(typeof MEASURE_NAMES)[number], number[]>;
  const draft = { ...parts, blend: [] } as Reference;
  const blends = measures.map((measure) => blendOf(measure, draft));
  return { ...parts, blend: quantilesOf(blends, 101) };
}

if (mode === "--part") {
  // One set, for a machine with cores to spare: `--part <side> <boards> <kind> [wrap] --out <file>`.
  const [side, , kind, wrapWord] = [Number(process.argv[3]), process.argv[4], process.argv[5] as Kind, process.argv[6]];
  const out = process.argv[process.argv.indexOf("--out") + 1]!;
  const wrap = wrapWord === "wrap";
  const started = Date.now();
  const set = referenceOf(side, kind, wrap);
  writeFileSync(out, JSON.stringify({ key: referenceKey(side, kind, wrap), side, set }));
  console.log(`${referenceKey(side, kind, wrap)}: ${boards} boards in ${Math.round((Date.now() - started) / 1000)} s`);
  process.exit(0);
}
if (mode === "--merge") {
  const { readFileSync } = await import("node:fs");
  const { DIFFICULTY_REFERENCE, DIFFICULTY_SIDES } = await import("../src/difficulty.reference.ts");
  const merged: Record<string, Reference> = { ...DIFFICULTY_REFERENCE };
  const sides = new Set<number>(DIFFICULTY_SIDES);
  for (const file of process.argv.slice(3)) {
    const part = JSON.parse(readFileSync(file, "utf8")) as { key: string; side: number; set: Reference };
    merged[part.key] = part.set;
    sides.add(part.side);
  }
  const order = (key: string): [number, string] => [parseInt(key, 10), key.replace(/^\d+/, "")];
  const rows = Object.entries(merged)
    .sort(([a], [b]) => order(a)[0] - order(b)[0] || (order(a)[1] < order(b)[1] ? -1 : 1))
    .map(([key, set]) => `  ${JSON.stringify(key)}: ${JSON.stringify(set)},`);
  writeFileSync(
    new URL("../src/difficulty.reference.ts", import.meta.url),
    `import type { Reference } from "./difficulty.ts";

/** The sizes (side of the board) there is a reference set for. */
export const DIFFICULTY_SIDES: readonly number[] = ${JSON.stringify([...sides].sort((a, b) => a - b))};

/**
 * The reference sets, by key (see \`referenceKey\`): boards of each size, kind and wrap from the package's own
 * generator, each measure as quantiles (600 boards of each side to 16; the larger sides, which take a minute a
 * board, as many as the run that made them says: \`scripts/suido-reference.ts --part\`). Made by \`scripts/suido-reference.ts\`; never edited by hand.
 */
export const DIFFICULTY_REFERENCE: Record<string, Reference> = {
${rows.join("\n")}
};
`,
  );
  console.log("src/difficulty.reference.ts written with", Object.keys(merged).length, "sets");
  process.exit(0);
}

const sets: Record<string, Reference> = {};
for (const side of only === null ? SIDES : [only]) {
  for (const kind of ["network", "drains", "inlet-outlet"] as const) {
    for (const wrap of [false, true]) {
      // An inlet-outlet board does not wrap: its water runs from the top left to the bottom right.
      if (kind === "inlet-outlet" && wrap) continue;
      const started = Date.now();
      sets[referenceKey(side, kind, wrap)] = referenceOf(side, kind, wrap);
      console.log(`${referenceKey(side, kind, wrap).padEnd(5)} ${side}×${side} ${kind}${wrap ? " wrap" : ""}: ${boards} boards in ${Math.round((Date.now() - started) / 1000)} s`);
    }
  }
}
if (only === null) {
  const rows = Object.entries(sets).map(([key, set]) => `  ${JSON.stringify(key)}: ${JSON.stringify(set)},`);
  writeFileSync(
    new URL("../src/difficulty.reference.ts", import.meta.url),
    `import type { Reference } from "./difficulty.ts";

/** The sizes (side of the board) there is a reference set for. */
export const DIFFICULTY_SIDES: readonly number[] = ${JSON.stringify(SIDES)};

/**
 * The reference sets, by key (see \`referenceKey\`): \`${boards}\` boards of each size, kind and wrap from the package's own
 * generator, each measure as quantiles. Made by \`scripts/suido-reference.ts\`; never edited by hand.
 */
export const DIFFICULTY_REFERENCE: Record<string, Reference> = {
${rows.join("\n")}
};
`,
  );
  console.log("src/difficulty.reference.ts written");
}
