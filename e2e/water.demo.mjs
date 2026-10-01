// The water, seen to flow: with motion allowed, a pipe joined to the water fills from the end the water
// comes in at, in step with the pipes before it, and a pipe turned away empties.
import { expect, test } from "@playwright/test";

import { flowOf, newGame, quartersBetween, turn } from "../dist/index.js";
import { at, boardFor, cell, open, state, tap } from "./demo.mjs";

test.use({ reducedMotion: "no-preference" });

test("when the last pipe is joined the water runs out along the network, cell by cell, nearest the pump first", async ({ page }) => {
  await open(page, "?size=8&seed=33");
  const made = boardFor({ size: 8, seed: 33 });
  const game = newGame(made.code);
  const solved = flowOf(made.layout, made.solution);
  // The piece to leave for last: the one nearest the pump that is not yet facing right, whose turn lets the water through.
  const first = solved.order.find((index) => solved.depth[index] >= 1 && (quartersBetween(game.masks[index], made.solution[index]) ?? 0) > 0);
  for (let index = 0; index < game.masks.length; index += 1) {
    if (index === first) continue;
    const need = quartersBetween(game.masks[index], made.solution[index]) ?? 0;
    for (let n = 0; n < need; n += 1) await tap(page, cell(page, index));
  }
  await page.waitForTimeout(400);
  const before = await state(page);
  const mid = flowOf(made.layout, game.masks.map((mask, index) => (index === first ? mask : made.solution[index])));
  expect(before.wet).toEqual(mid.wet);
  const wetBefore = before.wet.filter(Boolean).length;
  await page.evaluate(() => {
    window.sawFlow = new Set();
    const watch = () => {
      for (const path of document.querySelectorAll(".sd-arm[data-w='in'] .sd-in, .sd-arm[data-w='out'] .sd-out")) {
        const offset = parseFloat(getComputedStyle(path).strokeDashoffset);
        if (offset > 0.05 && offset < 0.95) window.sawFlow.add(path);
      }
      requestAnimationFrame(watch);
    };
    watch();
  });
  const need = quartersBetween(game.masks[first], made.solution[first]) ?? 0;
  for (let n = 0; n < need; n += 1) await tap(page, cell(page, first));
  await expect(page.locator(`${at("board")} svg`)).toHaveAttribute("data-solved", "true");
  // Water was seen part-way along more than one pipe: it flowed, it did not jump.
  await expect.poll(() => page.evaluate(() => window.sawFlow.size)).toBeGreaterThan(1);
  // And it ends with every pipe full.
  await page.waitForTimeout(2600);
  const full = await page.evaluate(() => [...document.querySelectorAll(".sd-arm[data-w='in'] .sd-in, .sd-arm[data-w='out'] .sd-out")].every((path) => parseFloat(getComputedStyle(path).strokeDashoffset) === 0));
  expect(full).toBe(true);
  expect((await state(page)).wet.filter(Boolean).length).toBeGreaterThan(wetBefore);
});

test("a pipe turned away from the water empties, and the pipes beyond it with it", async ({ page }) => {
  await open(page, "?size=6&seed=7");
  const made = boardFor({ size: 6, seed: 7 });
  const game = newGame(made.code);
  const solved = flowOf(made.layout, made.solution);
  for (let index = 0; index < game.masks.length; index += 1) {
    const need = quartersBetween(game.masks[index], made.solution[index]) ?? 0;
    for (let n = 0; n < need; n += 1) await tap(page, cell(page, index));
  }
  await expect(page.locator(`${at("board")} svg`)).toHaveAttribute("data-solved", "true");
  // Break the pipe nearest the pump that a quarter turn takes the water from, so everything beyond it loses its water.
  const near = solved.order.find((index) => solved.depth[index] >= 1 && ((turn(made.solution[index], 1) >> solved.entry[index]) & 1) === 0);
  expect(near).toBeDefined();
  await tap(page, cell(page, near));
  const s = await state(page);
  const broken = flowOf(made.layout, made.solution.map((mask, index) => (index === near ? turn(mask, 1) : mask)));
  expect(s.wet).toEqual(broken.wet);
  expect(s.wet.filter(Boolean).length).toBeLessThan(solved.wetPieces);
  expect(s.solved).toBe(false);
  await expect(page.locator(at("status"))).toContainText("open end");
  // The pipe the water left is empty again once its transition has run.
  await page.waitForTimeout(500);
  const emptied = await page.evaluate((index) => [...document.querySelectorAll(`.sd-cell[data-cell="${index}"] .sd-in, .sd-cell[data-cell="${index}"] .sd-out`)].every((path) => parseFloat(getComputedStyle(path).strokeDashoffset) === 1), near);
  expect(emptied).toBe(true);
});
