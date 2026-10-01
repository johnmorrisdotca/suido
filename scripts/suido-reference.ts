// Makes src/difficulty.reference.ts: for every size, kind and wrap, a set of boards from the package's own
// generator, each measured, and the measures kept as quantiles. Seeded, so the same run writes the same file.
//
//   node scripts/suido-reference.ts            every set, 600 boards each
//   node scripts/suido-reference.ts 12 40      one side only, as many boards as the second number says (prints, writes nothing)
import { writeFileSync } from "node:fs";

import { blendOf, MEASURE_NAMES, measureSuido, quantilesOf, referenceKey, type Measure, type Reference } from "../src/difficulty.ts";
import { makeUnscored } from "../src/generate.ts";
import type { Kind } from "../src/code.ts";

const SIDES = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 16];
const only = process.argv[2] === undefined ? null : Number(process.argv[2]);
const boards = Number(process.argv[3] ?? 600);

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

const sets: Record<string, Reference> = {};
for (const side of only === null ? SIDES : [only]) {
  for (const kind of ["network", "drains"] as const) {
    for (const wrap of [false, true]) {
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
