// Pictures of the demo for a person to look at: `node e2e/shots.mjs <folder> <name>`. Not a test.
// `node e2e/shots.mjs docs readme` (or `pnpm pictures`) takes the two pictures the README shows, from the built demo in `site/`.
import { join } from "node:path";
import process from "node:process";

import { chromium } from "@playwright/test";

import { flowOf, newGame, quartersBetween } from "../dist/index.js";
import { levelFor, ready, serve } from "./demo.mjs";

const [folder = ".", name = "suido"] = process.argv.slice(2);
const browser = await chromium.launch();

/** A picture of a level with the first `share` of its water solved, in the order the water would flow. */
async function shot({ width, height = 844, colorScheme, lang = "en", size, level, share, path, fullPage = false }) {
  const context = await browser.newContext({ viewport: { width, height }, colorScheme, reducedMotion: "reduce", locale: "en-US", deviceScaleFactor: 2 });
  const page = await context.newPage();
  await serve(page);
  await page.goto(`http://suido.test/?${new URLSearchParams({ mode: "levels", size, level: String(level), lang })}`);
  await ready(page);
  const made = await levelFor(size, level);
  const game = newGame(made.code);
  const flow = flowOf(made.layout, made.solution);
  const cells = share === 1 ? [...Array(game.masks.length).keys()] : flow.order.slice(0, Math.floor(flow.order.length * share));
  for (const cell of cells) {
    for (let n = quartersBetween(game.masks[cell], made.solution[cell]) ?? 0; n > 0; n -= 1) await page.locator(`.sd-cell[data-cell="${cell}"]`).click({ force: true });
  }
  // The level's chips and board in view: the top of the page for a desk, the line above the board for a phone.
  await page.evaluate((top) => (top ? window.scrollTo(0, 0) : document.querySelector("#role").scrollIntoView()), width >= 700);
  await page.waitForTimeout(300);
  await page.screenshot({ path, fullPage, ...(path.endsWith(".jpg") ? { type: "jpeg", quality: 76 } : {}) });
  await context.close();
}

if (name === "readme") {
  await shot({ width: 1280, height: 1300, colorScheme: "light", size: "9x9", level: 95, share: 1, path: join(folder, "desktop.jpg") });
  await shot({ width: 390, height: 844, colorScheme: "dark", lang: "ja", size: "8x14", level: 63, share: 0.6, path: join(folder, "phone.jpg") });
} else {
  for (const width of [390, 1280]) for (const colorScheme of ["light", "dark"]) for (const lang of ["en", "ja"]) await shot({ width, colorScheme, lang, size: "8x8", level: 95, share: 0.5, path: join(folder, `${name}-${width}-${colorScheme}-${lang}.png`), fullPage: true });
}
await browser.close();
