// Pictures of the demo for a person to look at: `node e2e/shots.mjs <folder> <name>`. Not a test.
// `node e2e/shots.mjs docs readme` takes the two pictures the README shows.
import { join } from "node:path";
import process from "node:process";

import { chromium } from "@playwright/test";

import { flowOf, newGame, quartersBetween } from "../dist/index.js";
import { boardFor, ready, serve } from "./demo.mjs";

const [folder = ".", name = "suido"] = process.argv.slice(2);
const browser = await chromium.launch();

/** A picture of a board with the first `share` of its water solved, in the order the water would flow. */
async function shot({ width, height = 844, colorScheme, lang = "en", settings, share, path, fullPage = false }) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme, reducedMotion: "reduce", locale: "en-US", deviceScaleFactor: 2 });
  const page = await context.newPage();
  await serve(page);
  const query = new URLSearchParams({ ...settings, lang });
  await page.goto(`http://suido.test/?${query}`);
  await ready(page);
  const made = boardFor({ size: Number(settings.size), kind: settings.kind, wrap: settings.wrap === "1", sources: Number(settings.sources ?? 1), difficulty: Number(settings.difficulty ?? 50), seed: Number(settings.seed) });
  const game = newGame(made.code);
  const flow = flowOf(made.layout, made.solution);
  for (const cell of flow.order.slice(0, Math.floor(flow.order.length * share))) {
    for (let n = quartersBetween(game.masks[cell], made.solution[cell]) ?? 0; n > 0; n -= 1) await page.locator(`.sd-cell[data-cell="${cell}"]`).click();
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path, fullPage, ...(path.endsWith(".jpg") ? { type: "jpeg", quality: 82 } : {}) });
  await context.close();
}

if (name === "readme") {
  await shot({ width: 1280, height: 1000, colorScheme: "light", settings: { size: "9", seed: "2026", difficulty: "60" }, share: 1, path: join(folder, "desktop.jpg") });
  await shot({ width: 390, height: 844, colorScheme: "dark", lang: "ja", settings: { size: "7", kind: "drains", sources: "2", seed: "77", difficulty: "40" }, share: 0.6, path: join(folder, "phone.jpg") });
} else {
  for (const width of [390, 1280]) for (const colorScheme of ["light", "dark"]) for (const lang of ["en", "ja"]) await shot({ width, colorScheme, lang, settings: { size: "8", seed: "5" }, share: 0.5, path: join(folder, `${name}-${width}-${colorScheme}-${lang}.png`), fullPage: true });
}
await browser.close();
