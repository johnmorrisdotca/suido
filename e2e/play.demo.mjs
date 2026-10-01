// The demo, played as a person plays it: tap a piece to turn it, watch the water, solve the board.
// What the page shows is held to what the package says of the same board.
import { expect, test } from "@playwright/test";

import { flowOf, newGame, quartersBetween, shapeOf, turn } from "../dist/index.js";
import { action, at, boardFor, cell, noSidewaysScroll, open, ready, sdp, solveByTapping, state, tap } from "./demo.mjs";

test("a first visit makes the board its address names, with the pieces as the package makes them", async ({ page }) => {
  const errors = await open(page, "?mode=make&size=6x6&seed=7");
  const made = boardFor({ size: 6, seed: 7 });
  const shapes = await page.locator(`${at("board")} .sd-cell`).evaluateAll((cells) => cells.map((one) => one.dataset.shape));
  expect(shapes).toEqual(made.layout.cells.map(shapeOf));
  const roles = await page.locator(`${at("board")} .sd-cell`).evaluateAll((cells) => cells.map((one) => one.dataset.role));
  expect(roles.flatMap((role, index) => (role === "source" ? [index] : []))).toEqual(made.layout.sources);
  expect(roles.flatMap((role, index) => (role === "drain" ? [index] : []))).toEqual(made.layout.drains);
  const s = await state(page);
  const flow = flowOf(made.layout);
  expect(s.wet).toEqual(flow.wet);
  expect(s.status).toBe(`The water reaches ${flow.wetPieces} of ${flow.pieces} pieces · ${flow.spills.length === 1 ? "1 open end" : flow.spills.length === 0 ? "no leaks" : `${flow.spills.length} open ends`}`);
  expect(s.solved).toBe(false);
  expect(errors).toEqual([]);
});

test("a tap turns a piece a quarter clockwise and the water goes where the pieces now join", async ({ page }) => {
  await open(page, "?mode=make&size=7x7&seed=21");
  const made = boardFor({ size: 7, seed: 21 });
  const game = newGame(made.code);
  // Turn a few pieces at once in the page and beside it; the water must be where the package says.
  const taps = [3, 10, 17, 24, 8, 8, 31, 45, 45, 45];
  const quarters = game.masks.map(() => 0);
  const masks = [...game.masks];
  let counted = 0;
  for (const index of taps) {
    await tap(page, cell(page, index));
    if (shapeOf(masks[index]) !== "blank" && shapeOf(masks[index]) !== "cross") {
      masks[index] = turn(masks[index], 1);
      quarters[index] += 1;
      counted += 1;
    }
    const s = await state(page);
    expect(s.quarters).toEqual(quarters);
    expect(s.wet).toEqual(flowOf(made.layout, masks).wet);
  }
  await expect(page.locator(sdp("meter"))).toContainText(`${counted} turns`);
});

test("every piece tapped to face its answer solves the board, and the page says so", async ({ page }) => {
  await open(page, "?mode=make&size=6x6&seed=3");
  const made = boardFor({ size: 6, seed: 3 });
  await solveByTapping(page, made);
  const s = await state(page);
  expect(s.wet.every(Boolean)).toBe(true);
  expect(s.status).toMatch(/^Solved in \d+ turns?\. Every pipe is joined and nothing is left open\.$/);
  await expect(page.locator(sdp("status"))).toHaveAttribute("data-solved", "true");
});

test("a board that reaches the drains is solved with its spare pieces left dry", async ({ page }) => {
  await open(page, "?mode=make&size=7x7&kind=drains&seed=5");
  const made = boardFor({ size: 7, kind: "drains", seed: 5 });
  const flow = flowOf(made.layout, made.solution);
  expect(flow.wetPieces).toBeLessThan(made.layout.cells.filter((mask) => mask !== 0).length);
  // Only the pieces the water goes through need turning.
  const game = newGame(made.code);
  for (let index = 0; index < game.masks.length; index += 1) {
    if (!flow.wet[index]) continue;
    const need = quartersBetween(game.masks[index], made.solution[index]) ?? 0;
    for (let n = 0; n < need; n += 1) await tap(page, cell(page, index));
  }
  await expect(page.locator(`${at("board")} svg`)).toHaveAttribute("data-solved", "true");
  expect((await state(page)).status).toMatch(/^Solved in \d+ turns?\. The water reaches every drain and nothing is left open\.$/);
  const dry = await page.locator(`${at("board")} .sd-cell[data-wet="false"]:not([data-shape="blank"])`).count();
  expect(dry).toBeGreaterThan(0);
});

test("a board that wraps, with two pumps, is made as asked and solves", async ({ page }) => {
  await open(page, "?mode=make&size=6x6&wrap=1&sources=2&seed=9");
  const made = boardFor({ size: 6, wrap: true, sources: 2, seed: 9 });
  expect(made.layout.wrap).toBe(true);
  expect(made.layout.sources).toHaveLength(2);
  await expect(page.locator(`${at("board")} .sd-cell[data-role="source"]`)).toHaveCount(2);
  await expect(page.locator(at("wrap"))).toHaveAttribute("aria-pressed", "true");
  await solveByTapping(page, made);
});

test("shift-click, right-click and the turning button turn a piece the other way", async ({ page }) => {
  test.skip(test.info().project.use.hasTouch === true, "a mouse's buttons and the keyboard's shift");
  await open(page, "?mode=make&size=6x6&seed=7");
  const made = boardFor({ size: 6, seed: 7 });
  const index = made.layout.cells.findIndex((mask) => shapeOf(mask) === "elbow");
  await cell(page, index).click({ modifiers: ["Shift"] });
  expect((await state(page)).quarters[index]).toBe(-1);
  await cell(page, index).click({ button: "right" });
  expect((await state(page)).quarters[index]).toBe(-2);
  await page.locator(action("turning")).click();
  await expect(page.locator(action("turning"))).toHaveAttribute("aria-pressed", "true");
  await cell(page, index).click();
  expect((await state(page)).quarters[index]).toBe(-3);
  await cell(page, index).click({ modifiers: ["Shift"] });
  expect((await state(page)).quarters[index]).toBe(-2);
  expect((await state(page)).wet).toEqual(flowOf(made.layout, made.layout.cells.map((mask, at) => (at === index ? turn(mask, -2) : mask))).wet);
});

test("a cross and bare ground cannot be turned, and a tap on one counts nothing", async ({ page }) => {
  await open(page, "?mode=make&size=9x9&seed=4&kind=drains");
  const made = boardFor({ size: 9, kind: "drains", seed: 4 });
  const blank = made.layout.cells.findIndex((mask) => mask === 0);
  expect(blank).toBeGreaterThan(-1);
  await tap(page, cell(page, blank));
  await expect(page.locator(sdp("meter"))).toContainText("0 turns");
});

test("the keyboard moves between pieces with the arrows and turns one with enter", async ({ page }) => {
  test.skip(test.info().project.use.hasTouch === true, "a keyboard");
  await open(page, "?mode=make&size=6x6&seed=7");
  const made = boardFor({ size: 6, seed: 7 });
  await cell(page, 0).focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("ArrowDown");
  await expect(cell(page, 7)).toBeFocused();
  const turnable = shapeOf(made.layout.cells[7]) !== "blank" && shapeOf(made.layout.cells[7]) !== "cross";
  await page.keyboard.press("Enter");
  expect((await state(page)).quarters[7]).toBe(turnable ? 1 : 0);
  await page.keyboard.press("Shift+Space");
  expect((await state(page)).quarters[7]).toBe(0);
  await expect(page.locator(sdp("meter"))).toContainText(`${turnable ? 2 : 0} turns`);
});

test("start over puts every piece back as the board gave it", async ({ page }) => {
  await open(page, "?mode=make&size=6x6&seed=7");
  const made = boardFor({ size: 6, seed: 7 });
  const start = (await state(page)).wet;
  for (let index = 0; index < 12; index += 1) await tap(page, cell(page, index));
  await tap(page, action("restart"));
  await ready(page);
  const s = await state(page);
  expect(s.wet).toEqual(start);
  expect(s.wet).toEqual(flowOf(made.layout).wet);
  expect(s.quarters.every((quarters) => quarters === 0)).toBe(true);
  await expect(page.locator(sdp("meter"))).toContainText("0 turns");
});

test("a hint lights a piece that does not face its answer, and says so", async ({ page }) => {
  await open(page, "?mode=make&size=6x6&seed=7");
  const made = boardFor({ size: 6, seed: 7 });
  await tap(page, action("hint"));
  const lit = await page.locator(`${at("board")} .sd-cell[data-hint="true"]`).evaluateAll((cells) => cells.map((one) => Number(one.dataset.cell)));
  expect(lit).toHaveLength(1);
  expect(made.layout.cells[lit[0]]).not.toBe(made.solution[lit[0]]);
  await expect(page.locator(sdp("note"))).toHaveText("Try turning the piece that is lit.");
  await expect(page.locator(sdp("meter"))).toContainText("1 hint");
});

test("new board makes another, names it in the address, and the address makes the same one again", async ({ page }) => {
  await open(page, "?mode=make&size=5x5&seed=2");
  const before = page.url();
  await tap(page, at("new"));
  await ready(page);
  await expect.poll(() => page.url()).not.toBe(before);
  const url = page.url();
  expect(url).toContain("exact=1");
  const shapes = await page.locator(`${at("board")} .sd-cell`).evaluateAll((cells) => cells.map((one) => one.dataset.shape + one.querySelector(".sd-turn").style.getPropertyValue("--q")));
  await page.goto(url);
  await ready(page);
  const again = await page.locator(`${at("board")} .sd-cell`).evaluateAll((cells) => cells.map((one) => one.dataset.shape + one.querySelector(".sd-turn").style.getPropertyValue("--q")));
  expect(again).toEqual(shapes);
});

test("the size, kind and difficulty chosen make the board that is asked for", async ({ page }) => {
  await open(page, "?mode=make&size=5x5&seed=1");
  await tap(page, `${at("sizes")} button[data-size="8x8"]`);
  await ready(page);
  await expect(page.locator(`${at("board")} .sd-cell`)).toHaveCount(64);
  await tap(page, `${at("kinds")} button[data-kind="drains"]`);
  await ready(page);
  await expect(page.locator(`${at("kinds")} button[data-kind="drains"]`)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(sdp("status"))).toContainText("drains");
  await page.locator(at("difficulty")).fill("90");
  await ready(page);
  await expect(page.locator(at("difficulty-value"))).toHaveText("90 · Fiendish");
  await expect(page.locator(at("meter"))).toContainText("8×8");
  await expect(page).toHaveURL(/difficulty=90/);
});

test("the timer runs from the first turn to the solve and keeps the best", async ({ page }) => {
  await open(page, "?mode=make&size=5x5&seed=6&timer=1");
  const made = boardFor({ size: 5, seed: 6 });
  await expect(page.locator(at("timer-toggle"))).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(at("meter"))).toContainText("0:00");
  await solveByTapping(page, made);
  await expect(page.locator(at("meter"))).toContainText(/best \d+:\d\d/);
});

test("nothing on the board can be selected", async ({ page }) => {
  await open(page, "?mode=make&size=6x6&seed=7");
  const select = await page.locator(`${at("board")} svg`).evaluate((svg) => getComputedStyle(svg).userSelect || getComputedStyle(svg).webkitUserSelect);
  expect(select).toBe("none");
  await page.locator(`${at("board")} svg`).scrollIntoViewIfNeeded();
  const box = await page.locator(`${at("board")} svg`).boundingBox();
  await page.mouse.dblclick(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.move(box.x + 5, box.y + 5);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width - 5, box.y + box.height - 5);
  await page.mouse.up();
  expect(await page.evaluate(() => window.getSelection().toString())).toBe("");
});

test("the page keeps one steady box: nothing moves when the board is played or the words change", async ({ page }) => {
  await open(page, "?mode=make&size=7x7&seed=21");
  // Measured from the top of the page each time: a tap scrolls a tall page, and a box that moved with it has not moved.
  const box = async () => {
    await page.evaluate(() => window.scrollTo(0, 0));
    return { board: await page.locator(at("board")).boundingBox(), status: await page.locator(sdp("status")).boundingBox(), actions: await page.locator(at("new")).boundingBox() };
  };
  const first = await box();
  for (const index of [1, 2, 3, 9, 16, 24]) await tap(page, cell(page, index));
  expect(await box()).toEqual(first);
  await page.goto("http://suido.test/?mode=make&size=7x7&seed=21&lang=ja");
  await ready(page);
  const ja = await box();
  expect(ja.board.y).toBe(first.board.y);
  expect(ja.board.height).toBe(first.board.height);
  await noSidewaysScroll(page);
});

test("it reads in Japanese, and says the Japanese has not been reviewed", async ({ page }) => {
  await open(page, "?mode=make&size=6x6&seed=7&lang=ja");
  await expect(page.locator(sdp("status"))).toContainText("個のパイプに水が届いています");
  await expect(page.locator("#unreviewed")).toBeVisible();
  await page.locator('button[data-lang="en"]').click();
  await expect(page.locator(sdp("status"))).toContainText("The water reaches");
  await expect(page.locator("#unreviewed")).toBeHidden();
});

test("it fits the width of the screen at every size offered, with no sideways scroll", async ({ page }) => {
  for (const size of [5, 14]) {
    await open(page, `?mode=make&size=${size}x${size}&seed=1&kind=drains`);
    await noSidewaysScroll(page);
    const svg = await page.locator(`${at("board")} svg`).boundingBox();
    const viewport = page.viewportSize();
    expect(svg.x).toBeGreaterThanOrEqual(0);
    expect(svg.x + svg.width).toBeLessThanOrEqual(viewport.width);
  }
});

test("the board is on the first screen: its middle is above the fold at a phone's width and a desk's", async ({ page }) => {
  await open(page, "?size=7x7&level=1");
  await page.evaluate(() => window.scrollTo(0, 0));
  const box = await page.locator(`${at("board")} svg`).boundingBox();
  expect(box.y + box.height / 2).toBeLessThan(page.viewportSize().height);
  await noSidewaysScroll(page);
});
