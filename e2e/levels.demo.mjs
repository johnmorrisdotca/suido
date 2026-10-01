// The levels, played as a person plays them: choose a size and a level, see its twists, solve it, and find it solved.
// What the page shows is held to what the package says of the same level.
import { expect, test } from "@playwright/test";

import { flowOf, shapeOf } from "../dist/index.js";
import { dailySuidoLevel } from "../dist/levels.js";
import { action, at, cell, levelFor, noSidewaysScroll, open, ready, sdp, solveLevel, state, tap } from "./demo.mjs";

const chips = (page) => page.locator(`${sdp("chips")} li`).evaluateAll((items) => items.map((item) => item.dataset.twist));

// Some tests tap every piece of a board one by one, and a slow runner is slowest at that in WebKit: room beyond the default 30 seconds.
test.setTimeout(90_000);

test("a first visit opens level 1 of 7×7, a plain board as the package has it, with its marks and a Plain chip", async ({ page }) => {
  const errors = await open(page, "");
  const made = await levelFor("7x7", 1);
  const shapes = await page.locator(`${at("board")} .sd-cell`).evaluateAll((cells) => cells.map((one) => one.dataset.shape));
  expect(shapes).toEqual(made.layout.cells.map(shapeOf));
  expect((await state(page)).wet).toEqual(flowOf(made.layout).wet);
  expect(await chips(page)).toEqual(["plain"]);
  await expect(page.locator(at("level"))).toHaveText("1 / 256");
  await expect(page.locator(at("marks"))).toHaveAttribute("aria-label", "Difficulty 1 of 5");
  await expect(page.locator(at("previous"))).toBeDisabled();
  await expect(page.locator(at("open"))).toContainText("16 of 256 levels open");
  await expect(page.locator(`${at("block")} .lv`)).toHaveCount(16);
  await expect(page.locator(`${at("block")} .lv[data-state="here"]`)).toHaveAttribute("data-level", "1");
  await expect(page.locator(`${at("block")} .lv[data-state="locked"]`)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("solving a level says so, keeps it, opens the next, and the level opens on its answer when it is visited again", async ({ page }) => {
  await open(page, "?mode=levels&size=5x5&level=1");
  const made = await levelFor("5x5", 1);
  await solveLevel(page, made);
  await expect(page.locator(sdp("status"))).toContainText("Solved in");
  await expect(page.locator(`${at("block")} .lv[data-level="1"]`)).toHaveAttribute("data-solved", "true");
  await expect(page.locator(at("next"))).toBeEnabled();
  await tap(page, at("next"));
  await ready(page);
  await expect(page.locator(at("level"))).toHaveText("2 / 256");
  await expect(page.locator(sdp("status"))).not.toContainText("Solved");
  await page.reload();
  await ready(page);
  await tap(page, `${at("block")} .lv[data-level="1"]`);
  await ready(page);
  await expect(page.locator(at("level"))).toHaveText("1 / 256");
  await expect(page.locator(sdp("status"))).toContainText("Solved before");
  await expect(page.locator(`${at("board")} svg`)).toHaveAttribute("data-solved", "true");
  await tap(page, action("restart"));
  await ready(page);
  expect((await state(page)).solved).toBe(false);
});

test("a block opens only when the one before is solved: the next level's arrow and the later levels are held back", async ({ page }) => {
  await open(page, "?mode=levels&size=5x5&level=16");
  await expect(page.locator(at("next"))).toBeDisabled();
  await expect(page.locator(at("open"))).toContainText("16 of 256");
  // A link to a level that is not open opens it, as a link to one does.
  await open(page, "?mode=levels&size=5x5&level=40");
  await expect(page.locator(at("level"))).toHaveText("40 / 256");
  await expect(page.locator(`${at("block")} .lv[data-state="locked"]`).first()).toBeDisabled();
});

test("a half-played level comes back as it was left", async ({ page }) => {
  await open(page, "?mode=levels&size=6x6&level=3");
  const made = await levelFor("6x6", 3);
  const turnable = made.layout.cells.flatMap((mask, index) => (shapeOf(mask) === "elbow" ? [index] : [])).slice(0, 3);
  for (const index of turnable) await tap(page, cell(page, index));
  const before = await state(page);
  await page.reload();
  await ready(page);
  expect((await state(page)).quarters).toEqual(before.quarters);
  await expect(page.locator(sdp("meter"))).toContainText("3 turns");
});

test("each block teaches a twist at its 15th level and tests it at its 16th: the chips and the line say so", async ({ page }) => {
  const lessons = [
    [31, "drains", "teaches"],
    [32, "drains", "tests"],
    [47, "pumps", "teaches"],
    [63, "locked", "teaches"],
    [79, "walls", "teaches"],
    [95, "wrap", "teaches"],
    [111, "inlet-outlet", "teaches"],
  ];
  for (const [level, twist, role] of lessons) {
    await open(page, `?mode=levels&size=6x6&level=${level}`);
    const made = await levelFor("6x6", level);
    expect(made.twists, `level ${level}`).toContain(twist);
    expect(await chips(page), `level ${level}`).toEqual(made.twists);
    await expect(page.locator(at("role"))).toHaveAttribute("data-role", role);
    await expect(page.locator(at("role"))).not.toBeEmpty();
  }
});

test("a locked piece shows its padlock and does not turn, and a wall is drawn across its edge", async ({ page }) => {
  await open(page, "?mode=levels&size=6x6&level=63");
  const made = await levelFor("6x6", 63);
  expect(made.layout.locked.length).toBeGreaterThan(0);
  const locked = await page.locator(`${at("board")} .sd-cell[data-locked="true"]`).evaluateAll((cells) => cells.map((one) => Number(one.dataset.cell)));
  expect(locked).toEqual(made.layout.locked);
  await expect(page.locator(`${at("board")} .sd-lock`)).toHaveCount(locked.length);
  const turnable = made.layout.locked.find((index) => shapeOf(made.layout.cells[index]) !== "cross");
  // A locked piece is marked disabled, so a tap on it is sent to it as the page would receive one.
  await cell(page, turnable).dispatchEvent("click");
  await expect(page.locator(sdp("meter"))).toContainText("0 turns");
  expect((await state(page)).quarters[turnable]).toBe(0);
  await open(page, "?mode=levels&size=6x6&level=79");
  const walled = await levelFor("6x6", 79);
  expect(walled.layout.walls.length).toBeGreaterThan(0);
  await expect(page.locator(`${at("board")} .sd-wall`)).toHaveCount(walled.layout.walls.length);
});

test("a level with every twist the ladder has can be solved by tapping: wrap, an inlet and outlet, drains, locked pieces and walls", async ({ page }) => {
  for (const level of [95, 111, 31, 63, 79]) {
    await open(page, `?mode=levels&size=5x5&level=${level}`);
    await solveLevel(page, await levelFor("5x5", level));
    await expect(page.locator(sdp("status"))).toHaveAttribute("data-solved", "true");
  }
});

test("an inlet-outlet level says the water runs in one path, and a wrap level has the rim drawn", async ({ page }) => {
  await open(page, "?mode=levels&size=7x7&level=111");
  await expect(page.locator(`${at("board")} .sd-cell[data-role="source"]`)).toHaveCount(1);
  await expect(page.locator(`${at("board")} .sd-cell[data-role="drain"]`)).toHaveCount(1);
  await expect(page.locator(sdp("status"))).toContainText("The water");
  await solveLevel(page, await levelFor("7x7", 111));
  await expect(page.locator(sdp("status"))).toContainText("one path");
  await open(page, "?mode=levels&size=7x7&level=95");
  await expect(page.locator(`${at("board")} .sd-rim`)).toHaveCount(1);
});

test("a long pipe board is drawn in its own shape, fits the screen, and keeps one steady box while it is played", async ({ page }) => {
  for (const [size, width, height] of [
    ["5x7", 5, 7],
    ["6x10", 6, 10],
    ["8x14", 8, 14],
  ]) {
    await open(page, `?mode=levels&size=${size}&level=1`);
    await expect(page.locator(`${at("board")} .sd-cell`)).toHaveCount(width * height);
    const box = await page.locator(`${at("board")} svg`).boundingBox();
    expect(box.height / box.width).toBeCloseTo(height / width, 1);
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(page.viewportSize().width);
    await noSidewaysScroll(page);
    await page.evaluate(() => window.scrollTo(0, 0));
    const table = await page.locator(at("board")).boundingBox();
    const made = await levelFor(size, 1);
    for (const index of made.layout.cells.flatMap((mask, at) => (shapeOf(mask) === "elbow" ? [at] : [])).slice(0, 4)) await tap(page, cell(page, index));
    await page.evaluate(() => window.scrollTo(0, 0));
    expect(await page.locator(at("board")).boundingBox()).toEqual(table);
    await page.goto(`http://suido.test/?mode=levels&size=${size}&level=1&lang=ja`);
    await ready(page);
    const ja = await page.locator(at("board")).boundingBox();
    expect(ja.y).toBe(table.y);
    expect(ja.height).toBe(table.height);
  }
});

test("the size rows choose a size, and the pipe shapes are a row of their own", async ({ page }) => {
  await open(page, "?mode=levels&size=5x5&level=1");
  await tap(page, `${at("shapes")} button[data-size="8x14"]`);
  await ready(page);
  await expect(page.locator(`${at("board")} .sd-cell`)).toHaveCount(112);
  await expect(page.locator(`${at("shapes")} button[data-size="8x14"]`)).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(`${at("sizes")} button[aria-pressed="true"]`)).toHaveCount(0);
  await tap(page, `${at("sizes")} button[data-size="10x10"]`);
  await ready(page);
  await expect(page.locator(`${at("board")} .sd-cell`)).toHaveCount(100);
  await expect(page.locator(at("level"))).toHaveText("1 / 256");
});

test("the twists and the levels read in Japanese", async ({ page }) => {
  await open(page, "?mode=levels&size=6x6&level=63&lang=ja");
  await expect(page.locator(`${sdp("chips")} li`).first()).toHaveText("固定駒");
  await expect(page.locator(at("role"))).toContainText("このレベルで学ぶこと");
  await expect(page.locator(at("open"))).toContainText("16レベルのまとまり");
  await expect(page.locator(at("meter"))).toContainText("レベル 63");
  await page.locator('button[data-lang="en"]').click();
  await expect(page.locator(`${sdp("chips")} li`).first()).toHaveText("Locked pieces");
});

test("make a board makes boards with the twists asked for: an inlet and outlet, locked pieces and walls", async ({ page }) => {
  await open(page, "?mode=make&size=8x8&seed=5&kind=inlet-outlet&locked=few&walls=few");
  await expect(page.locator(`${at("board")} .sd-cell[data-role="source"]`)).toHaveCount(1);
  await expect(page.locator(`${at("board")} .sd-cell[data-locked="true"]`)).not.toHaveCount(0);
  await expect(page.locator(`${at("board")} .sd-wall`)).not.toHaveCount(0);
  expect(await chips(page)).toEqual(["locked", "walls", "inlet-outlet"]);
  await expect(page.locator(at("wrap"))).toBeDisabled();
  await tap(page, `${at("kinds")} button[data-kind="network"]`);
  await ready(page);
  await expect(page.locator(at("wrap"))).toBeEnabled();
  await tap(page, at("wrap"));
  await ready(page);
  expect(await chips(page)).toEqual(["locked", "walls", "wrap"]);
  await tap(page, `${at("modes")} button[data-mode="levels"]`);
  await ready(page);
  await expect(page.locator(at("level"))).toBeVisible();
  await expect(page.locator(at("new"))).toBeHidden();
});

test("Today opens the level of the day at the size chosen, the same one the package names, even when it is not open yet", async ({ page }) => {
  await open(page, "?mode=levels&size=7x7&level=1");
  await tap(page, at("today"));
  await ready(page);
  const expected = dailySuidoLevel("7x7", new Date());
  await expect(page.locator(at("level"))).toContainText(`${expected} / 256`);
  const made = await levelFor("7x7", expected);
  const shapes = await page.locator(`${at("board")} .sd-cell`).evaluateAll((cells) => cells.map((one) => one.dataset.shape));
  expect(shapes).toEqual(made.layout.cells.map(shapeOf));
  expect(await chips(page)).toEqual(made.twists.length === 0 ? ["plain"] : made.twists);
  await noSidewaysScroll(page);
});
