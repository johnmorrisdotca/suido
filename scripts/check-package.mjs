// Packs the package the way it is published (`npm pack`, npm and not pnpm),
// installs the tarball into an empty project, and uses it as somebody who
// installed it would: every entry in `exports` imported by ESM and loaded by
// `require`, and a board made, solved, checked and drawn. A package whose
// `exports` name a file that is not in the tarball fails here, before it can be
// published. `pnpm test:package` builds first.
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const windows = process.platform === "win32";
const scratch = mkdtempSync(join(tmpdir(), "suido-package-"));

/** Run a command and hand back what it printed. On Windows, npm is a .cmd file, which only a shell runs; node itself is run directly. */
function run(command, args, cwd, viaShell = false) {
  const shell = viaShell && windows;
  const ran = spawnSync(shell && /[\\/]/.test(command) ? `"${command}"` : command, args, { cwd, encoding: "utf8", shell });
  if (ran.status !== 0) {
    console.error(`FAIL ${command} ${args.join(" ")}\n${ran.stdout}\n${ran.stderr}`);
    process.exit(1);
  }
  return ran.stdout;
}

// 1. Pack, with npm.
const packed = JSON.parse(run("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", scratch], root, true));
const tarball = join(scratch, packed[0].filename);
const inTarball = new Set(packed[0].files.map((file) => file.path));
console.log(`ok   npm pack: ${packed[0].filename}, ${packed[0].files.length} files`);

// 2. Everything package.json points at is in the tarball.
const pointed = [pkg.main, pkg.module, pkg.types, ...Object.values(pkg.bin ?? {}), ...Object.values(pkg.exports).flatMap((entry) => (typeof entry === "string" ? [entry] : Object.values(entry)))];
for (const file of new Set(pointed)) {
  if (!inTarball.has(file.replace(/^\.\//, ""))) {
    console.error(`FAIL package.json points at ${file}, which is not in the tarball`);
    process.exit(1);
  }
}
console.log(`ok   every file package.json points at is in the tarball (${new Set(pointed).size})`);

for (const named of pkg.files) {
  if (![...inTarball].some((file) => file === named || file.startsWith(`${named}/`))) {
    console.error(`FAIL package.json's files names ${named}, which is not in the tarball`);
    process.exit(1);
  }
}
console.log(`ok   everything in package.json's files is in the tarball (${pkg.files.length})`);

// 3. Install it into an empty project.
const project = join(scratch, "project");
mkdirSync(project);
writeFileSync(join(project, "package.json"), JSON.stringify({ name: "scratch", private: true, version: "0.0.0" }));
run("npm", ["install", "--no-audit", "--no-fund", "--silent", tarball], project, true);
console.log("ok   npm install of the tarball");

// The board seed 12 makes at 6×6 as the built package in this checkout makes it: the installed one must make the same.
const { makeSuido } = await import(new URL("../dist/index.js", import.meta.url).href);
const board = makeSuido({ size: 6, seed: 12 });

// 4. Every entry in `exports`, by ESM and by require, and the package used.
const entries = Object.keys(pkg.exports).map((key) => (key === "." ? pkg.name : `${pkg.name}/${key.slice(2)}`));
writeFileSync(
  join(project, "esm.mjs"),
  `${entries.map((entry, i) => `import * as m${i} from ${JSON.stringify(entry)};`).join("\n")}
const all = [${entries.map((_, i) => `m${i}`).join(", ")}];
const names = ${JSON.stringify(entries)};
all.forEach((m, i) => { if (Object.keys(m).length === 0) throw new Error(names[i] + " exports nothing"); });
const { makeSuido, checkSuidoAnswer, decodeLayout, countSolutions, flowOf, VERSION } = m0;
const { drawSuido, drawSuidoThumb } = m1;
const { loadSuidoLevels, levelAnswer, levelBoard, SUIDO_SIZES, SUIDO_LEVEL_COUNTS, suidoMarks } = m2;
const made = makeSuido({ size: 6, seed: 12 });
if (made.code !== ${JSON.stringify(board.code)}) throw new Error("seed 12 made " + made.code);
if (!checkSuidoAnswer(made.code, made.answer).ok) throw new Error("the answer does not check");
if (checkSuidoAnswer(made.code, made.code).ok) throw new Error("the unsolved board checks");
const layout = decodeLayout(made.code);
if (countSolutions(layout, 2) !== 1) throw new Error("the board does not have exactly one answer");
if (!flowOf(layout, made.solution).solved) throw new Error("the answer is not solved");
if (!drawSuido(layout, { masks: made.solution }).startsWith("<svg")) throw new Error("the board is not drawn");
if (VERSION !== ${JSON.stringify(pkg.version)}) throw new Error("VERSION is " + VERSION);
// The levels, as a site would use them: each size loaded on its own, a level checked, drawn, and the size's own entry read.
if (!drawSuidoThumb(layout).startsWith("<svg")) throw new Error("the small board is not drawn");
for (const size of SUIDO_SIZES) {
  const rows = await loadSuidoLevels(size);
  if (rows.length !== SUIDO_LEVEL_COUNTS[size]) throw new Error(size + " has " + rows.length + " levels");
}
const rows = await loadSuidoLevels("8x8");
if (!checkSuidoAnswer(rows[11][0], levelAnswer(rows[11])).ok) throw new Error("level 12 of 8x8 does not check");
if (countSolutions(levelBoard(rows[11]), 2) !== 1) throw new Error("level 12 of 8x8 does not have exactly one answer");
if (suidoMarks("8x8", 12) !== 1) throw new Error("level 12 of 8x8 is not marked 1");
const direct = (await import(names.find((name) => name.endsWith("levels-8x8")))).SUIDO_8X8;
if (direct[11][0] !== rows[11][0]) throw new Error("levels-8x8 is not the 8x8 levels");
console.log(names.join(" "));
`,
);
writeFileSync(
  join(project, "cjs.cjs"),
  `const names = ${JSON.stringify(entries)};
for (const name of names) { const m = require(name); if (Object.keys(m).length === 0) throw new Error(name + " exports nothing"); }
const { makeSuido, checkSuidoAnswer } = require(${JSON.stringify(pkg.name)});
const made = makeSuido({ size: 6, seed: 12 });
if (!checkSuidoAnswer(made.code, made.answer).ok) throw new Error("the answer does not check by require");
console.log(names.join(" "));
`,
);
console.log(`ok   import:  ${run(process.execPath, ["esm.mjs"], project).trim()}`);
console.log(`ok   require: ${run(process.execPath, ["cjs.cjs"], project).trim()}`);

rmSync(scratch, { recursive: true, force: true });
console.log("the package installs and runs as published, on", process.platform, process.version);
