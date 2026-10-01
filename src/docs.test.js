// The documents and the demo, held to the source. Plain JavaScript, so that reading files needs no Node types.
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import { VERSION } from "./version.ts";

const pkg = JSON.parse(readFileSync("package.json", "utf8"));
const readme = readFileSync("README.md", "utf8");

describe("the documents", () => {
  it("say the version package.json says, in the code and at the top of the changelog", () => {
    expect(VERSION).toBe(pkg.version);
    expect(readFileSync("CHANGELOG.md", "utf8")).toMatch(new RegExp(`^## ${pkg.version.replace(/\./g, "\\.")} `, "m"));
  });

  it("name in the README every entry package.json exports, and no other", () => {
    const exported = Object.keys(pkg.exports).filter((key) => key !== ".").map((key) => `${pkg.name}/${key.slice(2)}`);
    for (const entry of exported) expect(readme, entry).toContain(`\`${entry}\``);
    expect(readme).toContain(`\`${pkg.name}\``);
    const named = [...readme.matchAll(/`@johnmorrisdotca\/suido\/([\w-]+)`/g)].map((match) => `${pkg.name}/${match[1]}`);
    for (const entry of new Set(named)) expect(exported, entry).toContain(entry);
  });

  it("name in the README every function the package exports by name, in the API table", async () => {
    const api = readme.slice(readme.indexOf("## API"), readme.indexOf("## ", readme.indexOf("## API") + 5));
    const main = await import("./index.ts");
    const draw = await import("./draw-entry.ts");
    const levels = await import("./levels.ts");
    const functions = [...Object.entries({ ...main, ...draw, ...levels })].filter(([name, value]) => typeof value === "function" && /^[a-z]/.test(name)).map(([name]) => name);
    for (const name of functions) expect(api, name).toContain(name);
  });

  it("keep the family's stylesheet byte for byte, as its first line's hash says", () => {
    const [first, ...rest] = readFileSync("demo/family.css", "utf8").split("\n");
    const hash = /sha256 of every line after this one: ([0-9a-f]{64})/.exec(first)?.[1];
    expect(createHash("sha256").update(rest.join("\n")).digest("hex")).toBe(hash);
  });

  it("list this package in the family's shared template, which every demo copies unchanged", () => {
    expect(readFileSync("scripts/family-template.mjs", "utf8")).toContain('{ id: "suido", name: "Suido", kana: "水道" }');
  });

  it("say nothing of any other name for the game that is trademarked or belongs to somebody else's product", () => {
    const text = [readme, readFileSync("demo/demo.js", "utf8"), readFileSync("CHANGELOG.md", "utf8")].join("\n");
    expect(text).not.toMatch(/pipe\s*mania|pipe\s*dream|plumber/i);
  });
});
