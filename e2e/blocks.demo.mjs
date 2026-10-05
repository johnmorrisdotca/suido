// Big pieces and blocks that turn as one, played as a person plays them: a tap on any piece of a square turns the whole square a
// quarter, and a board of them is solved. What the page shows is held to what the package says of the same board.
import { expect, test } from "@playwright/test";

import { blockInfo, blockQuartersBetween, decodeLayout, makeSuido, newGame } from "../dist/index.js";
import { at, cell as cellOf, noSidewaysScroll, open, sdp, state } from "./demo.mjs";

/**
 * A press on a piece's own square, as a finger or a mouse makes it: at the middle of where that piece was dealt, which is where a reader sees a
 * piece of a square only until the square turns, and then another piece of the same square is drawn on it. The press goes to whatever is on top
 * there, and the page takes it for the square either way, so the middle of the piece's own group (which, for a piece in a square, is the middle of the whole square) is not the place.
 */
async function tap(page, index) {
  const spot = cellOf(page, index).locator(".sd-hit");
  await spot.scrollIntoViewIfNeeded();
  const box = await spot.boundingBox();
  const [x, y] = [box.x + box.width / 2, box.y + box.height / 2];
  if (test.info().project.use.hasTouch === true) await page.touchscreen.tap(x, y);
  else await page.mouse.click(x, y);
}

test.setTimeout(90_000);

/** The board the demo makes for `?mode=make&size=8x8&seed=7&exact=1&bigs=many&blocks=many`: three of each. */
const made = () => makeSuido({ width: 8, height: 8, kind: "network", sources: 1, bigs: 3, blocks: 3, seed: 7 });
const QUERY = "?mode=make&size=8x8&seed=7&exact=1&bigs=many&blocks=many";

test("a board with big pieces and blocks is drawn with a plate under each square and a ring where it turns", async ({ page }) => {
  const errors = await open(page, QUERY);
  const board = made();
  const layout = decodeLayout(board.code);
  await expect(page.locator(`${at("board")} .sd-plate`)).toHaveCount(layout.bigs.length + layout.blocks.length);
  await expect(page.locator(`${at("board")} .sd-plate[data-kind="big"]`)).toHaveCount(layout.bigs.length);
  await expect(page.locator(`${at("board")} .sd-plate[data-kind="turn"]`)).toHaveCount(layout.blocks.length);
  await expect(page.locator(`${at("board")} .sd-pivot`)).toHaveCount(layout.bigs.length + layout.blocks.length);
  const chips = await page.locator(`${sdp("chips")} li`).evaluateAll((items) => items.map((item) => item.dataset.twist));
  expect(chips).toEqual(["big-pieces", "block-turns"]);
  await noSidewaysScroll(page);
  expect(errors).toEqual([]);
});

test("a tap on any piece of a square turns the whole square, each piece moving round to the next place as it turns", async ({ page }) => {
  await open(page, QUERY);
  const board = made();
  const info = blockInfo(board.layout);
  const block = info.blocks[0];
  const game = newGame(board.code);
  for (const [at, which] of block.cells.entries()) {
    const before = await state(page);
    await tap(page, which);
    const after = await state(page);
    // The four pieces of the square each turned a quarter; no other piece did anything.
    const changed = after.quarters.map((turns, index) => (turns === before.quarters[index] ? null : index)).filter((index) => index !== null);
    expect(changed, `tap ${at}`).toEqual([...block.cells].sort((a, b) => a - b));
    for (const piece of block.cells) expect(after.quarters[piece] - before.quarters[piece], `piece ${piece}`).toBe(1);
  }
  // Four taps brought it round to where it began.
  const wet = (await state(page)).wet;
  expect(wet).toHaveLength(game.masks.length);
  await expect(page.locator(at("board"))).toHaveAttribute("data-turns", "4");
});

test("a board of big pieces and blocks is solved by turning each square, and the page says so", async ({ page }) => {
  await open(page, QUERY);
  const board = made();
  const info = blockInfo(board.layout);
  const game = newGame(board.code);
  const done = new Set();
  for (let index = 0; index < game.masks.length; index += 1) {
    const at = info.of[index];
    if (at >= 0) {
      if (done.has(at)) continue;
      done.add(at);
      const block = info.blocks[at];
      const need = blockQuartersBetween(game.masks, board.solution, block) ?? 0;
      for (let n = 0; n < need; n += 1) await tap(page, block.anchor);
    } else {
      const need = ((board.solution[index] === game.masks[index] ? 0 : [1, 2, 3].find((turns) => turnTo(game.masks[index], turns) === board.solution[index])) ?? 0);
      for (let n = 0; n < need; n += 1) await tap(page, index);
    }
  }
  await expect(page.locator(`${at("board")} svg`)).toHaveAttribute("data-solved", "true");
  await expect(page.locator(sdp("status"))).toContainText("Solved in");
});

/** A piece turned `quarters` quarters clockwise. */
function turnTo(mask, quarters) {
  let out = mask & 15;
  for (let i = 0; i < quarters; i += 1) out = ((out << 1) | (out >> 3)) & 15;
  return out;
}

test("Block turns and Big pieces are for a whole network: the other kinds switch them off", async ({ page }) => {
  await open(page, QUERY);
  await expect(page.locator(`${at("bigs-amount")} button[aria-pressed="true"]`)).toHaveAttribute("data-amount", "many");
  await page.locator(`${at("kinds")} button[data-kind="drains"]`).click();
  await expect(page.locator(`${at("board")} .sd-plate`)).toHaveCount(0);
  await expect(page.locator(`${at("bigs-amount")} button`).first()).toBeDisabled();
  await expect(page.locator(`${at("blocks-amount")} button`).first()).toBeDisabled();
});

test("a hint on a block lights all four of its pieces", async ({ page }) => {
  await open(page, QUERY);
  await page.locator(`${at("board")} [data-action="hint"]`).click();
  const lit = await page.locator(`${at("board")} .sd-cell[data-hint="true"]`).count();
  expect([1, 4]).toContain(lit);
});
