// The demo's "Put it in your page" is kazoku-ui's <kazoku-embed-panel>: its tabs, sizes and picker are all there, the code follows the board's choices, and the picture is the code running.
import { expect, test } from "@playwright/test";

import { serve } from "./demo.mjs";

const P = '[data-testid="embed-panel"]';
const open = async (page, query = "") => {
  const errors = [];
  page.on("pageerror", (error) => errors.push(String(error)));
  page.on("console", (message) => message.type() === "error" && errors.push(message.text()));
  await serve(page);
  await page.goto(`http://suido.test/${query}`);
  await page.locator(`${P} [part="copy"]`).scrollIntoViewIfNeeded();
  await expect(page.locator(`${P} [part="copy"]`)).toBeVisible();
  return errors;
};
const code = (page) => page.locator(`${P} [part="code"]`);

test("the panel holds the family's seven tabs, four sizes, a picker of every grid, Copy and the two links", async ({
  page,
}) => {
  const errors = await open(page);
  await expect(page.locator(`${P} [role="tab"]`)).toHaveText([
    "HTML",
    "ES module",
    "React",
    "Vue",
    "Angular",
    "Svelte",
    "iframe",
  ]);
  await expect(page.locator(`${P} [part="size-button"]`)).toHaveText(["240", "320", "480", "640"]);
  await expect(page.locator(`${P} [part="size-button"][aria-pressed="true"]`)).toHaveText("480");
  await expect(page.locator('[data-testid="embed-picker"] button')).toHaveCount(16);
  await expect(page.locator(`${P} [part="copy"]`)).toHaveText(/Copy/);
  await expect(page.locator(`${P} [part="open"]`)).toBeVisible();
  await expect(page.locator(`${P} [part="docs"]`)).toBeVisible();
  await expect(page.locator(`${P} suido-board svg`)).toBeVisible();
  expect(errors).toEqual([]);
});

test("the code follows the grid, the level, the hints and the size, and 480 is left out of it", async ({ page }) => {
  await open(page);
  await expect(code(page)).toContainText('<suido-board grid="7x7" level="12" hints></suido-board>');
  await expect(code(page)).not.toContainText("width=");
  await page.locator('[data-testid="embed-picker"] button[data-id="5x5"]').click();
  await expect(code(page)).toContainText('grid="5x5"');
  await page.locator('[data-testid="embed-level"]').fill("3");
  await expect(code(page)).toContainText('level="3"');
  await page.locator('[data-testid="embed-hints"]').click();
  await expect(code(page)).not.toContainText("hints");
  await page.locator(`${P} button[data-size="320"]`).click();
  await expect(code(page)).toContainText('width="320"');
  await expect(page.locator(`${P} suido-board`)).toHaveAttribute("grid", "5x5");
  await page.locator(`${P} button[data-kind="iframe"]`).click();
  await expect(code(page)).toContainText("/suido/embed/?grid=5x5&amp;level=3");
  await page.locator(`${P} button[data-kind="react"]`).click();
  await expect(code(page)).toContainText("@johnmorrisdotca/suido/element/define");
});

test("the panel and its words follow the page's language", async ({ page }) => {
  await open(page);
  await page.locator('kazoku-language-picker [data-v="ja"]').click();
  await expect(page.locator('label[for="embed-level"]')).toHaveText("レベル");
  await expect(page.locator(`${P} [part="copy"]`)).toHaveText(/コピー/);
  await page.locator('kazoku-language-picker [data-v="en"]').click();
  await expect(page.locator('label[for="embed-level"]')).toHaveText("Level");
});

test("every control is a finger wide and the page does not scroll sideways", async ({ page }) => {
  await open(page);
  const small = await page.locator(`${P} button:not(suido-board *), ${P} input`).evaluateAll((all) =>
    all
      .filter((element) => element.getBoundingClientRect().width > 0)
      .map((element) => ({ name: element.textContent.trim(), height: element.getBoundingClientRect().height }))
      .filter((one) => one.height < 47.5),
  );
  expect(small).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});
