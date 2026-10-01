// What every demo test starts from: the built demo in `site/`, served to the page without a port,
// and the board's state read off the page, and a board made beside it by the package itself.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import { flowOf, makeSuido, newGame, quartersBetween } from "../dist/index.js";

const site = join(dirname(fileURLToPath(import.meta.url)), "..", "site");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml" };

/** Serve `site/` to a page at http://suido.test/. */
export async function serve(page) {
  if (!existsSync(join(site, "index.html"))) throw new Error("site/ is not built: run `pnpm site` first (`pnpm test:demo` does)");
  await page.route("http://suido.test/**", (route) => {
    const { pathname } = new URL(route.request().url());
    const file = join(site, pathname.endsWith("/") ? `${pathname}index.html` : pathname);
    if (!existsSync(file)) return route.fulfill({ status: 404, body: "" });
    return route.fulfill({ body: readFileSync(file), contentType: TYPES[file.slice(file.lastIndexOf("."))] ?? "application/octet-stream" });
  });
}

/** Open the demo with a query and wait until its board is made and drawn; collects anything the page complains of. */
export async function open(page, query = "") {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.goto(`http://suido.test/${query}`);
  await ready(page);
  return errors;
}

/** The board is made and drawn, and the first water has been painted onto it. */
export async function ready(page) {
  await page.waitForFunction(() => {
    const board = document.querySelector('[data-testid="board"]');
    return board.getAttribute("aria-busy") === null && board.dataset.painted === "true";
  });
}

export const at = (id) => `[data-testid="${id}"]`;
/** A part of the mounted board's own words: its status, its meter, its note, its chips. */
export const sdp = (name) => `[data-testid="board"] .sdp-${name}`;
/** One of the mounted board's own buttons: restart, hint, turning. */
export const action = (name) => `[data-testid="board"] [data-action="${name}"]`;
export const cell = (page, index) => page.locator(`${at("board")} .sd-cell[data-cell="${index}"]`);

/** Tap, as a finger would where the page is touched and as a mouse where it is not. */
export async function tap(page, selector) {
  const target = typeof selector === "string" ? page.locator(selector).first() : selector;
  await target.scrollIntoViewIfNeeded();
  if (test.info().project.use.hasTouch === true) await target.tap();
  else await target.click();
}

/** The board the demo makes for a query's settings, made here by the package: the same board, and its answer. */
export function boardFor({ size = 7, kind = "network", wrap = false, sources = 1, difficulty = 50, seed }) {
  return makeSuido({ size, kind, wrap, sources, difficulty, seed });
}

/** What the page shows of the board: which cells are wet, how each faces (quarter turns as drawn), and the status words. */
export async function state(page) {
  return page.evaluate(() => {
    const svg = document.querySelector('[data-testid="board"] svg');
    return {
      solved: svg.getAttribute("data-solved") === "true",
      wet: [...svg.querySelectorAll(".sd-cell")].map((cell) => cell.getAttribute("data-wet") === "true"),
      quarters: [...svg.querySelectorAll(".sd-cell")].map((cell) => Number(cell.querySelector(".sd-turn").style.getPropertyValue("--q"))),
      status: document.querySelector('[data-testid="board"] .sdp-status').textContent,
      meter: document.querySelector('[data-testid="board"] .sdp-meter').textContent,
    };
  });
}

/** Tap every piece of a board until it faces as the answer says, a quarter turn clockwise at a time. */
export async function solveByTapping(page, made) {
  const game = newGame(made.code);
  for (let index = 0; index < game.masks.length; index += 1) {
    const need = quartersBetween(game.masks[index], made.solution[index]) ?? 0;
    for (let n = 0; n < need; n += 1) await tap(page, cell(page, index));
  }
  await expect(page.locator(`${at("board")} svg`)).toHaveAttribute("data-solved", "true");
}

/** Nothing the demo drew sits beyond the page's own width. */
export async function noSidewaysScroll(page) {
  const [scroll, client] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
  expect(scroll).toBeLessThanOrEqual(client);
}

/** The level a size has at a number, as the package has it: its board, its answer, its twists. */
export async function levelFor(size, level) {
  const { declaredTwists, levelBoard, levelSolution, loadSuidoLevels } = await import("../dist/levels.js");
  const rows = await loadSuidoLevels(size);
  const row = rows[level - 1];
  return { code: row[0], solution: levelSolution(row), layout: levelBoard(row), twists: declaredTwists(row), rows };
}

/** Tap every piece the water goes through until it faces as the answer says, a quarter turn clockwise at a time. */
export async function solveLevel(page, made) {
  const game = newGame(made.code);
  const answer = flowOf(game.start, made.solution);
  for (let index = 0; index < game.masks.length; index += 1) {
    if (!answer.wet[index] && game.start.kind !== "network") continue;
    const need = quartersBetween(game.masks[index], made.solution[index]) ?? 0;
    for (let n = 0; n < need; n += 1) await tap(page, cell(page, index));
  }
  await expect(page.locator(`${at("board")} svg`)).toHaveAttribute("data-solved", "true");
}

/** A page holding only what is given, with the element defined from the built package. */
export async function bare(page, html, { lang = "en" } = {}) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.route("http://suido.test/bare.html", (route) =>
    route.fulfill({ contentType: "text/html", body: `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:12px;background:#2f5d4a;color:#fff;font-family:system-ui}</style></head><body>${html}<script type="module">import "./dist/element-define.js";</script></body></html>` }),
  );
  await page.goto("http://suido.test/bare.html");
  await page.waitForFunction(() => customElements.get("suido-board") !== undefined);
  return errors;
}
