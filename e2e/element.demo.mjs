// The <suido-board> tag, in a bare page with nothing but the built package: it draws a level or a board of its own,
// plays it by tap, speaks events, follows its attributes and the page's language.
import { expect, test } from "@playwright/test";

import { checkSuidoAnswer, makeSuido, newGame, quartersBetween } from "../dist/index.js";
import { loadSuidoLevels } from "../dist/levels.js";
import { at, bare } from "./demo.mjs";

const cells = (page, name = "t") => page.locator(`#${name} .sd-cell`);

/** Tap every piece of a board until it faces as the answer says. */
async function solve(page, made, name = "t") {
  const game = newGame(made.code);
  for (let index = 0; index < game.masks.length; index += 1) {
    const need = quartersBetween(game.masks[index], made.solution[index]) ?? 0;
    for (let n = 0; n < need; n += 1) await cells(page, name).nth(index).click();
  }
}

test("a tag with a size and a level draws that level's board with its twists as chips, and plays it", async ({ page }) => {
  const errors = await bare(page, `<suido-board id="t" size="6x6" level="3" chips></suido-board>`);
  await expect(cells(page)).toHaveCount(36);
  const rows = await loadSuidoLevels("6x6");
  expect(rows.length).toBeGreaterThan(2);
  await expect(page.locator("#t .sdp-chips li")).toHaveCount(1);
  await expect(page.locator("#t .sdp-status")).toContainText("The water reaches");
  expect(errors).toEqual([]);
});

test("a tag with a board of its own plays it, and fires change, turn and solve with an answer the server accepts", async ({ page }) => {
  const made = makeSuido({ size: 5, seed: 11 });
  await bare(page, `<suido-board id="t" code="${made.code}" answer="${made.answer}" hints></suido-board>`);
  await page.evaluate(() => {
    window.told = [];
    for (const name of ["suido-change", "suido-turn", "suido-solve"]) document.getElementById("t").addEventListener(name, (event) => window.told.push([name, event.detail]));
  });
  await expect(cells(page)).toHaveCount(25);
  await solve(page, made);
  await expect(page.locator("#t")).toHaveAttribute("data-solved", "true");
  const told = await page.evaluate(() => window.told);
  const solved = told.filter(([name]) => name === "suido-solve");
  expect(solved).toHaveLength(1);
  expect(told.filter(([name]) => name === "suido-turn").length).toBeGreaterThan(0);
  expect(checkSuidoAnswer(made.code, solved[0][1].code)).toEqual({ ok: true });
  expect(solved[0][1].progress).toMatch(/^[0-3]{25}:\d+$/);
});

test("Hint is offered when asked for and the board has an answer, lights a piece, and counts", async ({ page }) => {
  const made = makeSuido({ size: 5, seed: 12 });
  await bare(page, `<suido-board id="t" code="${made.code}" answer="${made.answer}" hints></suido-board>`);
  await page.locator('#t [data-action="hint"]').click();
  await expect(page.locator("#t .sd-cell[data-hint]")).toHaveCount(1);
  await expect(page.locator("#t .sdp-note")).toHaveText("Try turning the piece that is lit.");
  await expect(page.locator("#t .sdp-meter")).toContainText("1 hint");
  await bare(page, `<suido-board id="t" code="${made.code}"></suido-board>`);
  await expect(page.locator('#t [data-action="hint"]')).toBeHidden();
});

test("changing an attribute changes the board: the turning, the controls, a new level", async ({ page }) => {
  await bare(page, `<suido-board id="t" size="5x5" level="1"></suido-board>`);
  await expect(page.locator('#t [data-action="turning"]')).toHaveAttribute("aria-pressed", "false");
  await page.evaluate(() => document.getElementById("t").setAttribute("turning", "anticlockwise"));
  await expect(page.locator('#t [data-action="turning"]')).toHaveAttribute("aria-pressed", "true");
  await page.evaluate(() => document.getElementById("t").setAttribute("controls", "off"));
  await expect(page.locator("#t .sdp-controls")).toHaveCount(0);
  await page.evaluate(() => document.getElementById("t").setAttribute("size", "6x6"));
  await expect(cells(page)).toHaveCount(36);
});

test("a game half played is carried on from its progress, and the methods drive it", async ({ page }) => {
  const made = makeSuido({ size: 5, seed: 13 });
  await bare(page, `<suido-board id="t" code="${made.code}" answer="${made.answer}" hints></suido-board>`);
  await cells(page).nth(0).click();
  await cells(page).nth(1).click();
  const kept = await page.evaluate(() => document.getElementById("t").progress);
  await bare(page, `<suido-board id="t" code="${made.code}" progress="${kept}"></suido-board>`);
  await expect(page.locator("#t")).toHaveAttribute("data-turns", String(Number(kept.split(":")[1])));
  await page.evaluate(() => document.getElementById("t").restart());
  await expect(page.locator("#t")).toHaveAttribute("data-turns", "0");
});

test("it speaks Japanese by its lang, and follows the page when its language is switched", async ({ page }) => {
  await bare(page, `<suido-board id="t" size="5x5" level="1" lang="ja"></suido-board>`);
  await expect(page.locator("#t .sdp-status")).toContainText("個のパイプに水が届いています");
  await bare(page, `<suido-board id="t" size="5x5" level="1"></suido-board>`, { lang: "en" });
  await expect(page.locator("#t .sdp-status")).toContainText("The water reaches");
  await page.evaluate(() => document.documentElement.setAttribute("lang", "ja"));
  await expect(page.locator("#t .sdp-status")).toContainText("個のパイプに水が届いています");
});

test("a tag taken out of the page takes its drawing with it, and put back it draws again", async ({ page }) => {
  await bare(page, `<div id="box"><suido-board id="t" size="5x5" level="1"></suido-board></div>`);
  await expect(cells(page)).toHaveCount(25);
  await page.evaluate(() => {
    const tag = document.getElementById("t");
    window.tag = tag;
    tag.remove();
  });
  expect(await page.evaluate(() => window.tag.children.length)).toBe(0);
  await page.evaluate(() => document.getElementById("box").append(window.tag));
  await expect(cells(page)).toHaveCount(25);
});

test("the demo has a tag of its own on the page, and it plays", async ({ page }) => {
  const { open } = await import("./demo.mjs");
  await open(page, "?size=5x5&level=1");
  await expect(page.locator(`${at("tag")} .sd-cell`)).toHaveCount(36);
});
