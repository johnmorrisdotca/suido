// Takes the pictures the README shows, from the built demo in `site/`: `pnpm screenshots:readme` (builds the demo, then runs this).
// The family's standard is in johnmorrisdotca/.github (README-STANDARD.md); the shared part is readme-pictures-lib.mjs.
// The page is served to a browser without a port and never fetched from the live site. Every picture is a numbered level, so it is
// the same each run: the water is shown by solving a share of the level, tapping its pieces in the order the water would flow.
// Output: docs/images/<subject>-<desk|phone>-<light|dark>.webp.
import { takePictures } from "./readme-pictures-lib.mjs";

import { flowOf, newGame, quartersBetween } from "../dist/index.js";
import { declaredTwists, levelBoard, levelSolution, loadSuidoLevels } from "../dist/levels.js";

const BOARD = '[data-testid="board"]';

/** Tap the pieces of a level until `share` of its water (in the order it flows) is solved, then wait for the water to be painted. */
const solved = (size, level, share) => async (page) => {
  const rows = await loadSuidoLevels(size);
  const row = rows[level - 1];
  const layout = levelBoard(row);
  const solution = levelSolution(row);
  const game = newGame(row[0]);
  const flow = flowOf(layout, solution);
  const cells = share === 1 ? [...Array(game.masks.length).keys()] : flow.order.slice(0, Math.floor(flow.order.length * share));
  for (const cell of cells) {
    for (let n = quartersBetween(game.masks[cell], solution[cell]) ?? 0; n > 0; n -= 1) await page.locator(`${BOARD} .sd-cell[data-cell="${cell}"]`).click({ force: true });
  }
  await page.waitForFunction(() => document.querySelector('[data-testid="board"]').dataset.painted === "true");
};

const url = (size, level, lang = "en") => `/?${new URLSearchParams({ mode: "levels", size, level: String(level), lang })}`;
const ready = `${BOARD}[data-painted="true"] svg`;

/** One level, its board cropped. */
const level = (subject, size, number, share) => ({ subject, views: ["desk"], scale: 1, url: url(size, number), ready, target: `${BOARD} svg`, prepare: solved(size, number, share) });

const twist = async (name, size) => {
  const rows = await loadSuidoLevels(size);
  return rows.findIndex((row) => declaredTwists(row).includes(name)) + 1;
};

/** The guide's sheets, cropped: every name and no sentence, so each picture is a row of pieces to look at. */
const sheet = (subject, testid) => ({
  subject,
  views: ["desk"],
  scale: 1,
  url: url("5x5", 1),
  ready: `[data-testid="${testid}"] figure svg`,
  target: `[data-testid="${testid}"]`,
  prepare: (page) => page.evaluate(() => document.querySelector("#pieces").classList.add("compact")),
});

await takePictures({
  shots: [
    // Level 95 of 9×9, solved, from the top of the page; on a phone, in Japanese, the long 8×14 level 63 with its water part way.
    {
      subject: "hero",
      views: ["desk", "phone"],
      height: 1300,
      url: url("9x9", 95),
      ready,
      async prepare(page, { view }) {
        if (view === "phone") {
          await page.goto(`http://suido.test${url("8x14", 63, "ja")}`);
          await page.waitForSelector(ready);
          await solved("8x14", 63, 0.6)(page);
          await page.evaluate(() => document.querySelector("#role").scrollIntoView());
        } else {
          await solved("9x9", 95, 1)(page);
          await page.evaluate(() => window.scrollTo(0, 0));
        }
      },
    },
    level("network", "8x8", 12, 0.5),
    level("drains", "8x8", await twist("drains", "8x8"), 1),
    level("several-pumps", "8x8", await twist("pumps", "8x8"), 1),
    level("locked-pieces", "8x8", await twist("locked", "8x8"), 1),
    level("walls", "8x8", await twist("walls", "8x8"), 1),
    level("wrap", "8x8", await twist("wrap", "8x8"), 1),
    level("inlet-to-outlet", "8x8", await twist("inlet-outlet", "8x8"), 1),
    level("long-board", "8x14", 40, 0.7),
    sheet("pieces-strip", "pieces-small"),
    sheet("big-pieces", "pieces-big"),
    sheet("big-families", "pieces-families"),
    { subject: "huge-board", views: ["desk"], scale: 1, url: url("20x20", 1), ready, target: `${BOARD} svg` },
  ],
});
