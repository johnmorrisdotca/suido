// The big-pieces levels and the guide to every piece, as a person meets them in the demo: choose the set, play a level that has big 2×2 pieces among
// its ordinary ones, find it solved and kept, and read the guide in both languages. What the page shows is held to what the package says.
import { expect, test } from "@playwright/test";

import { BIG_FAMILIES, blockInfo, blockQuartersBetween, newGame, quartersBetween, SUIDO_BIG_FAMILIES_GUIDE, SUIDO_PIECE_GUIDE } from "../dist/index.js";
import { declaredTwists, levelBoard, levelSolution, loadSuidoBigLevels, suidoBigPieces, suidoBigScore, suidoBigSize } from "../dist/levels.js";
import { at, cell as cellOf, noSidewaysScroll, open, ready, sdp, tap as tapSelector } from "./demo.mjs";

test.setTimeout(90_000);

/** A press at the middle of where a piece was dealt, as a finger makes it: whatever is on top there takes it, and the page counts it for the square. */
async function press(page, index) {
  const spot = cellOf(page, index).locator(".sd-hit");
  await spot.scrollIntoViewIfNeeded();
  const box = await spot.boundingBox();
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  if (test.info().project.use.hasTouch === true) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

/** Solve the page's board by taps: each ordinary piece to its place, each square a quarter turn at a time from its top left cell. */
async function solveBig(page, row) {
  const layout = levelBoard(row);
  const solution = levelSolution(row);
  const game = newGame(row[0]);
  const info = blockInfo(layout);
  const done = new Set();
  for (let index = 0; index < game.masks.length; index += 1) {
    const inside = info.of[index];
    if (inside >= 0) {
      if (done.has(inside)) continue;
      done.add(inside);
      const block = info.blocks[inside];
      for (let n = blockQuartersBetween(game.masks, solution, block) ?? 0; n > 0; n -= 1) await press(page, block.anchor);
    } else {
      for (let n = quartersBetween(game.masks[index], solution[index]) ?? 0; n > 0; n -= 1) await press(page, index);
    }
  }
  await expect(page.locator(`${at("board")} svg`)).toHaveAttribute("data-solved", "true");
}

test("the big-pieces set opens at level 1 of its own: big pieces among ordinary ones, sixty-four levels, the sizes row put away", async ({ page }) => {
  const errors = await open(page, "?set=big");
  const rows = await loadSuidoBigLevels();
  const layout = levelBoard(rows[0]);
  await expect(page.locator(at("level"))).toHaveText("1 / 64");
  await expect(page.locator(`${at("sets")} button[aria-pressed="true"]`)).toHaveAttribute("data-set", "big");
  await expect(page.locator("#classic-sizes")).toBeHidden();
  await expect(page.locator(at("today"))).toBeHidden();
  await expect(page.locator(at("open"))).toContainText("16 of 64 big-pieces levels open");
  await expect(page.locator(`${at("board")} .sd-plate[data-kind="big"]`)).toHaveCount(layout.bigs.length);
  expect(layout.cells.length).toBeGreaterThan(layout.bigs.length * 4);
  const chips = await page.locator(`${sdp("chips")} li`).evaluateAll((items) => items.map((item) => item.dataset.twist));
  expect(chips).toEqual(declaredTwists(rows[0]));
  await expect(page.locator(at("meter"))).toContainText(`Big pieces · level 1 · ${suidoBigSize(1).replace("x", "×")} · score ${suidoBigScore(1)} of 100`);
  await expect(page.locator(at("meter"))).toContainText(`${suidoBigPieces(1).count} big`);
  await expect(page.locator(`${at("block")} .lv`)).toHaveCount(16);
  await expect(page.locator(`${at("block")} .lv[data-state="locked"]`)).toHaveCount(0);
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});

test("a big-pieces level is solved by tapping its pieces and its squares, kept, and opens the next", async ({ page }) => {
  await open(page, "?set=big&mode=levels&level=1");
  const rows = await loadSuidoBigLevels();
  await solveBig(page, rows[0]);
  await expect(page.locator(sdp("status"))).toContainText("Solved in");
  await expect(page.locator(`${at("block")} .lv[data-level="1"]`)).toHaveAttribute("data-solved", "true");
  await expect(page.locator(at("next"))).toBeEnabled();
  await tapSelector(page, at("next"));
  await ready(page);
  await expect(page.locator(at("level"))).toHaveText("2 / 64");
  await page.reload();
  await ready(page);
  // It comes back where it was left, in the big set.
  await expect(page.locator(at("level"))).toHaveText("2 / 64");
  await expect(page.locator(`${at("sets")} button[aria-pressed="true"]`)).toHaveAttribute("data-set", "big");
  await expect(page.locator(`${at("block")} .lv[data-level="1"]`)).toHaveAttribute("data-solved", "true");
});

test("the set is chosen with a button and left the same way, and the levels by size are as they were", async ({ page }) => {
  await open(page, "?mode=levels&size=7x7&level=1");
  await expect(page.locator(at("level"))).toHaveText("1 / 256");
  await expect(page.locator("#classic-sizes")).toBeVisible();
  await tapSelector(page, `${at("sets")} button[data-set="big"]`);
  await ready(page);
  await expect(page.locator(at("level"))).toHaveText("1 / 64");
  expect(new URL(page.url()).searchParams.get("set")).toBe("big");
  await tapSelector(page, `${at("sets")} button[data-set="classic"]`);
  await ready(page);
  await expect(page.locator(at("level"))).toHaveText(/ \/ 256$/);
  await expect(page.locator("#classic-sizes")).toBeVisible();
  expect(new URL(page.url()).searchParams.get("set")).toBeNull();
});

test("the hard end of the set is a 20×20 with big pieces among its ordinary ones, drawn at the page's width", async ({ page }) => {
  await open(page, "?set=big&mode=levels&level=64");
  const rows = await loadSuidoBigLevels();
  const layout = levelBoard(rows[63]);
  expect([layout.width, layout.height]).toEqual([20, 20]);
  await expect(page.locator(at("level"))).toHaveText("64 / 64");
  await expect(page.locator(`${at("board")} .sd-plate[data-kind="big"]`)).toHaveCount(layout.bigs.length);
  await expect(page.locator(`${at("board")} .sd-cell`)).toHaveCount(400);
  await expect(page.locator(at("marks"))).toHaveAttribute("aria-label", "Difficulty 5 of 5");
  await noSidewaysScroll(page);
});

test("a level of the set that teaches a twist says so: blocks that turn at the 15th, a second pump at the 31st", async ({ page }) => {
  const rows = await loadSuidoBigLevels();
  for (const [level, twist] of [[15, "block-turns"], [31, "pumps"], [47, "walls"], [63, "wrap"]]) {
    expect(declaredTwists(rows[level - 1]), `level ${level}`).toContain(twist);
    await open(page, `?set=big&mode=levels&level=${level}`);
    await expect(page.locator(at("role"))).toHaveAttribute("data-role", "teaches");
    const chips = await page.locator(`${sdp("chips")} li`).evaluateAll((items) => items.map((item) => item.dataset.twist));
    expect(chips).toContain(twist);
  }
});

test("the guide draws every piece the package has, each with its name and what it does, and the big ones by family", async ({ page }) => {
  const errors = await open(page, "?mode=levels&size=5x5&level=1");
  await expect(page.locator(`${at("pieces-small")} figure`)).toHaveCount(SUIDO_PIECE_GUIDE.filter((piece) => piece.group !== "big").length);
  await expect(page.locator(`${at("pieces-big")} figure`)).toHaveCount(SUIDO_PIECE_GUIDE.filter((piece) => piece.group === "big").length);
  await expect(page.locator(`${at("pieces-families")} figure`)).toHaveCount(SUIDO_BIG_FAMILIES_GUIDE.length);
  for (const piece of SUIDO_PIECE_GUIDE) {
    const one = page.locator(`[data-piece="${piece.id}"]`);
    await expect(one.locator("strong")).toHaveText(piece.name);
    await expect(one.locator(".what")).toHaveText(piece.text);
    await expect(one.locator("svg.suido")).toHaveCount(1);
  }
  await expect(page.locator(`[data-piece="family-2-2"] strong`)).toHaveText(`2+2 · ${BIG_FAMILIES.find((family) => family.family === "2+2").shapes}`);
  // A big piece is drawn as wide as two small ones.
  const small = await page.locator('[data-piece="elbow"] svg').boundingBox();
  const plate = await page.locator('[data-piece="big-two-straights"] svg').boundingBox();
  expect(plate.width / small.width).toBeCloseTo(2, 1);
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});

test("the guide is in Japanese when the page is, and a Japanese name is never the English one", async ({ page }) => {
  await open(page, "?mode=levels&size=5x5&level=1&lang=ja");
  await expect(page.locator('[data-piece="pump"] strong')).toHaveText("ポンプ");
  await expect(page.locator('[data-piece="big-two-straights"] strong')).toContainText("大きな駒");
  const names = await page.locator(`${at("pieces-small")} strong, ${at("pieces-big")} strong`).allTextContents();
  for (const piece of SUIDO_PIECE_GUIDE) expect(names).not.toContain(piece.name);
  await expect(page.locator(`[data-piece="family-2-2"] strong`)).toContainText("通り");
});
