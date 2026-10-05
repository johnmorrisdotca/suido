// The huge boards (20×20, 28×28 and the long 20×50), played as a person plays them: a phone zooms and moves them by finger,
// a tap on a piece is still a tap, and a whole level is solved. What the page shows is held to what the package says.
import { expect, test } from "@playwright/test";

import { flowOf, newGame, quartersBetween } from "../dist/index.js";
import { SUIDO_LEVEL_COUNTS } from "../dist/levels.js";
import { at, cell, levelFor, noSidewaysScroll, open, sdp, state } from "./demo.mjs";

test.setTimeout(120_000);

const box = (page) => page.locator(`${at("board")} .sdp-board`);

/** The touches a finger makes, sent as the browser's own input, so the page sees what a phone would send. */
async function touches(page, steps) {
  const session = await page.context().newCDPSession(page);
  for (const [type, points] of steps) await session.send("Input.dispatchTouchEvent", { type, touchPoints: points });
  await session.detach();
}

/** A drag with one finger from one point to another, in a few moves. */
function drag(from, to, id = 1) {
  const steps = [["touchStart", [{ x: from.x, y: from.y, id }]]];
  for (let i = 1; i <= 6; i += 1) steps.push(["touchMove", [{ x: from.x + ((to.x - from.x) * i) / 6, y: from.y + ((to.y - from.y) * i) / 6, id }]]);
  steps.push(["touchEnd", []]);
  return steps;
}

const viewBox = (page) => page.locator(`${at("board")} svg`).getAttribute("viewBox");

test("the huge sizes are offered, each with its sixty-four levels in four blocks of sixteen", async ({ page }) => {
  await open(page, "?mode=levels&size=28x28&level=1");
  for (const size of ["20x20", "28x28"]) await expect(page.locator(`${at("sizes")} button[data-size="${size}"]`)).toBeVisible();
  await expect(page.locator(`${at("shapes")} button[data-size="20x50"]`)).toBeVisible();
  for (const size of ["20x20", "28x28", "20x50"]) expect(SUIDO_LEVEL_COUNTS[size]).toBe(64);
  await expect(page.locator(at("level"))).toHaveText("1 / 64");
  await expect(page.locator(at("open"))).toContainText("16 of 64 levels open");
  await expect(page.locator(`${at("block")} .lv`)).toHaveCount(16);
  await expect(page.locator(`${at("board")} .sd-cell`)).toHaveCount(784);
});

test("the board offers zoom where its pieces would be smaller than a thumb, and not where they are not", async ({ page }) => {
  await open(page, "?mode=levels&size=28x28&level=1");
  const width = (await box(page).boundingBox()).width;
  // The package's own rule: under 22 pixels a piece.
  const wanted = width / 28 < 22;
  expect(await page.locator(`${at("board")}`).getAttribute("data-zoomable")).toBe(String(wanted));
  await expect(page.locator(sdp("zoom"))).toBeVisible({ visible: wanted });
  await open(page, "?mode=levels&size=7x7&level=1");
  await expect(page.locator(sdp("zoom"))).toBeHidden();
  await noSidewaysScroll(page);
});

test("the buttons zoom in and out and back to the whole board, and the arrow keys bring the piece they reach into view", async ({ page }) => {
  await open(page, "?mode=levels&size=20x20&level=1");
  const wanted = (await box(page).boundingBox()).width / 20 < 22;
  test.skip(!wanted, "at this width the pieces are comfortable and no zoom is offered");
  await expect(box(page)).toHaveAttribute("data-zoom", "1.00");
  const whole = await viewBox(page);
  expect(whole).toBe("0 0 2000 2000");
  await expect(page.locator(`${sdp("zoom")} [data-zoom="out"]`)).toBeDisabled();
  await page.locator(`${sdp("zoom")} [data-zoom="in"]`).click();
  await expect(box(page)).toHaveAttribute("data-zoom", "1.60");
  expect(await viewBox(page)).toBe("375 375 1250 1250");
  await page.locator(`${sdp("zoom")} [data-zoom="in"]`).click();
  await expect(box(page)).toHaveAttribute("data-zoom", "2.56");
  await page.locator(`${sdp("zoom")} [data-zoom="out"]`).click();
  await expect(box(page)).toHaveAttribute("data-zoom", "1.60");
  await page.locator(`${sdp("zoom")} [data-zoom="fit"]`).click();
  await expect(box(page)).toHaveAttribute("data-zoom", "1.00");
  expect(await viewBox(page)).toBe(whole);
  // Zoomed in on the top left, the keyboard goes along the first row to a piece out of view and the view follows it.
  await page.locator(`${sdp("zoom")} [data-zoom="in"]`).click();
  await page.locator(`${sdp("zoom")} [data-zoom="in"]`).click();
  await page.locator(`${sdp("zoom")} [data-zoom="in"]`).click();
  await page.locator(`${at("board")} .sd-cell[data-cell="0"]`).focus();
  const before = await viewBox(page);
  for (let i = 0; i < 19; i += 1) await page.keyboard.press("ArrowRight");
  expect(await viewBox(page)).not.toBe(before);
  const focused = await page.evaluate(() => {
    const cell = document.activeElement;
    const rect = cell.getBoundingClientRect();
    const frame = document.querySelector('[data-testid="board"] .sdp-board').getBoundingClientRect();
    return { cell: cell.dataset.cell, inside: rect.left >= frame.left - 1 && rect.right <= frame.right + 1 };
  });
  expect(focused).toEqual({ cell: "19", inside: true });
});

test("a finger moves a zoomed board, and a drag is not a tap on the piece under it", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium" || test.info().project.use.hasTouch !== true, "real touches are sent through Chromium's own input");
  await open(page, "?mode=levels&size=28x28&level=1");
  await page.locator(`${sdp("zoom")} [data-zoom="in"]`).click();
  await page.locator(`${sdp("zoom")} [data-zoom="in"]`).click();
  await page.locator(`${sdp("zoom")} [data-zoom="in"]`).click();
  const frame = await box(page).boundingBox();
  const middle = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 };
  const before = await viewBox(page);
  const was = await state(page);
  await touches(page, drag({ x: middle.x + 70, y: middle.y + 40 }, { x: middle.x - 70, y: middle.y - 40 }));
  const after = await viewBox(page);
  expect(after).not.toBe(before);
  // The board moved the way the finger did: further right and further down the board.
  const [x0, y0] = before.split(" ").map(Number);
  const [x1, y1] = after.split(" ").map(Number);
  expect(x1).toBeGreaterThan(x0);
  expect(y1).toBeGreaterThan(y0);
  expect((await state(page)).quarters).toEqual(was.quarters);
  await expect(page.locator(at("board"))).toHaveAttribute("data-turns", "0");
});

test("a pinch of two fingers zooms the board about the middle between them", async ({ page, browserName }) => {
  test.skip(browserName !== "chromium" || test.info().project.use.hasTouch !== true, "real touches are sent through Chromium's own input");
  await open(page, "?mode=levels&size=28x28&level=1");
  const frame = await box(page).boundingBox();
  const middle = { x: frame.x + frame.width / 2, y: frame.y + frame.height / 2 };
  const steps = [["touchStart", [{ x: middle.x - 30, y: middle.y, id: 1 }, { x: middle.x + 30, y: middle.y, id: 2 }]]];
  for (let i = 1; i <= 8; i += 1) steps.push(["touchMove", [{ x: middle.x - 30 - i * 9, y: middle.y, id: 1 }, { x: middle.x + 30 + i * 9, y: middle.y, id: 2 }]]);
  steps.push(["touchEnd", []]);
  await touches(page, steps);
  const zoom = Number(await box(page).getAttribute("data-zoom"));
  expect(zoom).toBeGreaterThan(2);
  expect((await state(page)).quarters.every((turns) => turns === 0)).toBe(true);
});

test("a tap on a zoomed board turns the piece under the finger, and only that piece", async ({ page, browserName }) => {
  test.skip(browserName === "firefox", "not run in Firefox");
  await open(page, "?mode=levels&size=28x28&level=1");
  const zoomable = await page.locator(sdp("zoom")).isVisible();
  if (zoomable) for (let i = 0; i < 3; i += 1) await page.locator(`${sdp("zoom")} [data-zoom="in"]`).click();
  const frame = await box(page).boundingBox();
  // A piece that turns, wholly in view, nearest the middle of the box.
  const target = await page.evaluate(({ left, top, width, height }) => {
    const cells = [...document.querySelectorAll('[data-testid="board"] .sd-cell')].filter((one) => !["blank", "cross"].includes(one.dataset.shape) && one.dataset.locked !== "true");
    let best = null;
    for (const one of cells) {
      const r = one.getBoundingClientRect();
      if (r.left < left || r.right > left + width || r.top < top || r.bottom > top + height) continue;
      const d = Math.hypot(r.left + r.width / 2 - (left + width / 2), r.top + r.height / 2 - (top + height / 2));
      if (best === null || d < best.d) best = { d, cell: one.dataset.cell, x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }
    return best;
  }, { left: frame.x, top: frame.y, width: frame.width, height: frame.height });
  expect(target).not.toBeNull();
  const was = await state(page);
  if (test.info().project.use.hasTouch === true) await page.touchscreen.tap(target.x, target.y);
  else await page.mouse.click(target.x, target.y);
  const now = await state(page);
  const changed = now.quarters.map((turns, index) => (turns === was.quarters[index] ? null : index)).filter((index) => index !== null);
  expect(changed).toEqual([Number(target.cell)]);
  expect(now.quarters[Number(target.cell)]).toBe(was.quarters[Number(target.cell)] + 1);
});

test("a whole 20×20 level is solved by tapping its pieces, and the page says so", async ({ page }) => {
  await open(page, "?mode=levels&size=20x20&level=1");
  const made = await levelFor("20x20", 1);
  const game = newGame(made.code);
  const answer = flowOf(game.start, made.solution);
  // Every tap goes through the board's own click handler, as a press does; a few hundred by a real finger would only be slow.
  await page.evaluate(({ needs }) => {
    const cells = [...document.querySelectorAll('[data-testid="board"] .sd-cell')];
    for (const [index, count] of needs) for (let n = 0; n < count; n += 1) cells[index].dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }, { needs: game.masks.map((mask, index) => [index, quartersBetween(mask, made.solution[index]) ?? 0]).filter(([, count]) => count > 0) });
  expect(answer.solved).toBe(true);
  await expect(page.locator(`${at("board")} svg`)).toHaveAttribute("data-solved", "true");
  await expect(page.locator(sdp("status"))).toContainText("Solved in");
  await expect(page.locator(`${at("block")} .lv[data-level="1"]`)).toHaveAttribute("data-solved", "true");
});

test("the long 20×50 board is as tall as it is, with its levels, and the page does not scroll sideways", async ({ page }) => {
  await open(page, "?mode=levels&size=20x50&level=1");
  await expect(page.locator(`${at("board")} .sd-cell`)).toHaveCount(1000);
  await expect(page.locator(at("level"))).toHaveText("1 / 64");
  const frame = await box(page).boundingBox();
  expect(frame.height / frame.width).toBeCloseTo(2.5, 1);
  await noSidewaysScroll(page);
  expect(cell(page, 999)).toBeDefined();
});
