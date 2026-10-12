/** Documentation comments shared by the level-data writers; level values and order are never changed. */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import process from "node:process";
import { log } from "node:console";
import ts from "typescript";

const descriptions: Readonly<Record<string, string>> = {
  SUIDO_MARKS: "The native difficulty digits for each classic size, one digit per level in level order.",
  SUIDO_ROLES: "The teaching or testing role of classic twist levels, keyed by size and one-based level number.",
  SUIDO_BIG_SCORES: "The rounded difficulty scores of the big-piece levels, in level order.",
  SUIDO_BIG_TWISTS: "The declared twist names of the big-piece levels, in level order.",
  SUIDO_BIG_PIECES: "The number of big pieces in each big-piece level, in level order.",
};

/** Add checked import examples to generated public constants without changing their values. */
export function withLevelExamples(text: string, entry: string): string {
  const source = ts.createSourceFile("levels.ts", text, ts.ScriptTarget.Latest, true);
  const edits: {start: number; end: number; text: string}[] = [];
  for (const node of source.statements) {
    if (!ts.isVariableStatement(node) || !node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    const declaration = node.declarationList.declarations[0];
    if (!declaration || !ts.isIdentifier(declaration.name)) continue;
    const name = declaration.name.text;
    const doc = node.jsDoc?.at(-1);
    if (name === "DIFFICULTY_REFERENCE") continue;
    if (doc && text.slice(doc.pos, doc.end).includes("@example")) continue;
    let comment = doc ? text.slice(doc.pos, doc.end).replace(/\s*\*\/$/, "") : "/** " + descriptions[name] + "\n *";
    if (!doc && !descriptions[name]) throw new Error(`Missing level description: ${name}`);
    const value = /^SUIDO_(\d+X\d+|BIG)$/.test(name) ? `${name}.length, ${name}[0][0]` : name === "DIFFICULTY_SIDES" ? name : `Object.keys(${name})`;
    const example = ["", "@example", "```ts", `import { ${name} } from "${entry}";`, `console.log(${value});`, "```"].map(line => line ? ` * ${line}` : " *").join("\n");
    comment += "\n" + example + "\n */";
    edits.push({start:doc?.pos ?? node.getStart(source),end:doc?.end ?? node.getStart(source),text:comment+(doc?"":"\n")});
  }
  for (const edit of edits.sort((a,b) => b.start-a.start)) text = text.slice(0,edit.start)+edit.text+text.slice(edit.end);
  return text;
}

// Refresh comments from the same writer used by full generation, without regenerating or reordering puzzles.
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url) && process.argv.includes("--refresh")) {
  const pkg = JSON.parse(readFileSync("package.json", "utf8"));
  const files = new Map<string, string>();
  for (const [entry, conditions] of Object.entries(pkg.exports) as [string,{types:string}][]) {
    const file = conditions.types.replace(/^\.\/dist\//,"src/").replace(/\.d\.ts$/,".ts");
    if (file.startsWith("src/levels/")) files.set(file,pkg.name+entry.slice(1));
  }
  files.set("src/levels/bigInfo.data.ts",pkg.name+"/levels-info");
  files.set("src/difficulty.reference.ts",pkg.name);
  for (const [file, entry] of files) {
    const before = readFileSync(file,"utf8");
    const after = withLevelExamples(before,entry);
    if (after !== before) writeFileSync(file,after);
    log(file);
  }
}
