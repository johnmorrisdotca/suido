import { expect, test } from "@playwright/test";
import { serve } from "./demo.mjs";

test("the shared puzzle builder covers options, previews a level and writes every host format", async ({ page }) => {
  const errors = []; page.on("pageerror", (error) => errors.push(String(error)));
  await serve(page); await page.goto("http://suido.test/builder.html?lang=en");
  await expect(page.locator("#bld-stage suido-board svg")).toBeVisible();
  for (const format of ["element", "iframe", "module", "react", "vue", "svelte", "angular", "html", "url"]) {
    await page.locator(`#bld-formats [data-format="${format}"]`).click(); await expect(page.locator("#bld-code")).not.toHaveText("");
  }
  await expect(page.locator("#bld-code")).toContainText("grid=7x7");
  await page.locator('[data-lang="ja"]').click(); await expect(page.locator("#bld-maker-says")).toContainText("管");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true); expect(errors).toEqual([]);
});

test("a fixed UTC date repeats its level, preserving old grid sizes and new display sizes", async ({ page }) => {
  await serve(page); await page.goto("http://suido.test/embed/?grid=7x7&daily=2026-10-09&size=small");
  const board = page.locator("suido-board"); await expect(board.locator("svg")).toBeVisible();
  await expect(board).toHaveAttribute("data-day", "2026-10-09");
  const before = await board.evaluate((element) => ({ code: element.progress, width: element.style.width }));
  expect(before.width).toBe("320px");
  await page.reload(); await expect(board.locator("svg")).toBeVisible();
  expect(await board.evaluate((element) => element.progress)).toBe(before.code);
  await page.goto("http://suido.test/embed/?size=5x5&level=1"); await expect(board.locator("svg")).toBeVisible();
  expect(await board.evaluate((element) => element.game.start.width)).toBe(5);
});

test("properties preserve live getters and callbacks; false switches, themes and labels work", async ({ page }) => {
  await serve(page); const label = '<img src=x onerror="bad">';
  await page.goto(`http://suido.test/embed/?grid=5x5&level=1&controls=false&zoom=no&theme=dark&label=${encodeURIComponent(label)}`);
  const board = page.locator("suido-board"); await expect(board.locator("svg")).toBeVisible();
  await expect(board).toHaveAttribute("aria-label", label); await expect(board.locator('.sdp-controls')).toBeHidden();
  expect(await board.locator("svg").evaluate((svg) => getComputedStyle(svg).getPropertyValue("--sd-ground").trim())).toBe("#262a27");
  expect(await page.locator("img").count()).toBe(0);
  const value = await board.evaluate(async (element) => {
    const { defineBoard } = await import("../dist/element.js"); defineBoard("article-pipes"); defineBoard("article-pipes");
    const kept = element.progress; element.progress = kept; await new Promise((resolve) => window.setTimeout(resolve, 0));
    const game = element.game; element.options = { onTurn: () => { window.heardTurn = true; } }; const preserved = element.game === game; element.mount.turn(0);
    return { kept: typeof element.progress, hint: typeof element.hint, restart: typeof element.restart, preserved, changed: element.game !== game };
  });
  expect(value).toEqual({ kept: "string", hint: "function", restart: "function", preserved: true, changed: true });
  expect(await page.evaluate(() => window.heardTurn)).toBe(true);
  // Turning produces a new immutable game; assigning only a callback does not remount the board.
  await board.evaluate((element) => { element.controls = false; element.width = 280; });
  await expect(board).toHaveAttribute("controls", "false"); await expect(board).toHaveAttribute("width", "280");
});

test("native turns cross a host shadow root and forward matching detail through an iframe", async ({ page }) => {
  await serve(page);
  await page.route("http://host.test/", (route) => route.fulfill({ contentType: "text/html", body: '<script>window.messages=[];addEventListener("message",event=>{if(event.origin==="http://suido.test")messages.push(event.data);});</script><iframe src="http://suido.test/embed/?grid=5x5&level=1" width="360" height="850"></iframe>' }));
  await page.goto("http://host.test/"); const board = page.frameLocator("iframe").locator("suido-board"); await expect(board.locator("svg")).toBeVisible();
  await board.evaluate((element) => { const at = element.game.start.cells.findIndex((_, at) => !element.game.start.locked?.includes(at)); element.mount.turn(at); });
  await expect.poll(() => page.evaluate(() => window.messages.some((message) => message.type === "suido-turn"))).toBe(true);
  const message = await page.evaluate(() => window.messages.find((made) => made.type === "suido-turn")); expect(message.detail.turns).toBe(1); expect(JSON.parse(JSON.stringify(message))).toEqual(message);
  const child = page.frames().find((frame) => frame.url().startsWith("http://suido.test/embed/"));
  await child.evaluate(async () => {
    const host = document.createElement("div"); document.body.replaceChildren(host); const root = host.attachShadow({ mode: "open" });
    window.turnCrossed = false; document.addEventListener("suido-turn", () => { window.turnCrossed = true; });
    const board = document.createElement("suido-board"); board.setAttribute("grid", "5x5"); board.setAttribute("level", "1"); root.append(board);
  });
  await expect(board.locator("svg")).toBeVisible(); await board.evaluate((element) => { element.mount.turn(0); });
  await expect.poll(() => child.evaluate(() => window.turnCrossed)).toBe(true);
});

test("copied iframe code fits a narrow article and invalid daily dates are ignored", async ({ page }) => {
  await serve(page); await page.goto("http://suido.test/builder.html?lang=en"); await expect(page.locator("#bld-stage suido-board svg")).toBeVisible();
  await page.locator('#bld-formats [data-format="iframe"]').click();
  const code = (await page.locator("#bld-code").textContent()).replaceAll("https://johnmorrisdotca.github.io/suido/", "http://suido.test/").replace('loading="lazy"', '');
  await page.route("http://article.test/", (route) => route.fulfill({ contentType: "text/html", body: `<style>body{margin:0;width:320px}</style>${code}` })); await page.goto("http://article.test/");
  await expect(page.frameLocator("iframe").locator("suido-board svg")).toBeVisible(); const child = page.frames().find((frame) => frame.url().startsWith("http://suido.test/embed/"));
  expect(await child.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight && document.documentElement.scrollWidth <= window.innerWidth && window.localStorage.length === 0)).toBe(true);
  await page.goto("http://suido.test/embed/?daily=2026-02-30&grid=invalid&width=Infinity&level=-1"); await expect(page.locator("suido-board svg")).toBeVisible();
  await expect(page.locator("suido-board")).not.toHaveAttribute("daily", /.*/); await expect(page.locator("suido-board")).toHaveAttribute("grid", "7x7");
});
