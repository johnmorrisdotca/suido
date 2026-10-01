// What every demo test starts from: the built demo in `site/`, served to the page without a port,
// and the board's state read off the page, and a board made beside it by the package itself.
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";

import { makeSuido, newGame, quartersBetween } from "../dist/index.js";

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
      status: document.querySelector('[data-testid="status"]').textContent,
      meter: document.querySelector('[data-testid="meter"]').textContent,
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
