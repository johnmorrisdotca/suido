// Builds the static demo for GitHub Pages into ./site: the page, written here from the family's
// shared header and footer, with the family's stylesheet, Suido's own, the board's style, the page's
// script and the compiled library beside it.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

import { SUIDO_STYLE } from "../dist/draw-entry.js";
import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";

const id = "suido";
const ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232f5d4a'/%3E%3Cpath d='M18 50H50V82M50 50H82' fill='none' stroke='%23f3efe4' stroke-width='16'/%3E%3Cpath d='M18 50H50V82M50 50H82' fill='none' stroke='%231b8fe3' stroke-width='6'/%3E%3C/svg%3E";

const uses = [
  `const made = makeSuido({ size: 8, difficulty: 70, seed: 7 })  // a board with exactly one answer`,
  `checkSuidoAnswer(made.code, made.answer)  // { ok: true }`,
  `flowOf(layout, masks).wet  // where the water has got to`,
  `turnAt(game, cell)  // a tap: one piece, a quarter turn`,
  `drawSuido(layout, { masks })  // the board as SVG text`,
];
const escape = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const DROPLET = `<svg class="pump" viewBox="-14 -18 28 36" aria-hidden="true"><path d="M0 -17C-9 -4 -12 1 -12 6a12 12 0 0 0 24 0c0-5-3-10-12-23z" fill="currentColor"/></svg>`;
const button = (attributes, text = "") => `<button type="button" ${attributes}>${text}</button>`;

const page = `<!doctype html>
<html lang="en">
  <head>
    ${familyHead({
      id,
      title: "Suido · turn the pipes, bring the water",
      description: "Play Suido, the pipe puzzle: turn the pieces until the water from the pump reaches every drain with nothing left open. Every board has exactly one answer. Free and open source, in English and Japanese.",
      ogTitle: "Suido pipe puzzle",
      ogDescription: "Turn the pipes until the water reaches every drain. Every board has one answer.",
    })}
    <link rel="icon" href="${ICON}" />
    <link rel="stylesheet" href="family.css" />
    <link rel="stylesheet" href="suido.css" />
    <style>${SUIDO_STYLE}</style>
  </head>
  <body>
    <main>
      ${familyHeader({ id })}
      <p class="status" id="status" data-testid="status" aria-live="polite"></p>
      <div class="table fam-felt" id="table">
        <div id="board" data-testid="board" aria-busy="true"></div>
      </div>
      <p class="meter" id="meter" data-testid="meter"></p>
      <p class="note" id="note" data-testid="note" aria-live="polite"></p>
      <div class="controls">
        <div class="setup fam-actions">
          ${button(`class="fam-button" id="new" data-testid="new" data-primary="true" data-say="newBoard"`)}
          ${button(`class="fam-button" id="restart" data-testid="restart" data-say="restart"`)}
          ${button(`class="fam-button" id="hint" data-testid="hint" data-say="hint"`)}
          ${button(`class="fam-button" id="direction" data-testid="direction" aria-pressed="false"`)}
          ${button(`class="fam-button" id="timer-toggle" data-testid="timer-toggle" data-say="timer" aria-pressed="false"`)}
        </div>
        <div class="setup fam-row">
          <span class="fam-label" data-say="size"></span>
          <div class="fam-seg" role="group" data-say-label="size" id="sizes" data-testid="sizes"></div>
        </div>
        <div class="setup fam-row">
          <span class="fam-label" data-say="kind"></span>
          <div class="fam-seg" role="group" data-say-label="kind" id="kinds" data-testid="kinds">
            ${button(`data-kind="network" data-say="kindNetwork"`)}${button(`data-kind="drains" data-say="kindDrains"`)}
          </div>
        </div>
        <p class="kind-note" id="kind-note" aria-live="polite"></p>
        <div class="setup fam-row">
          <span class="fam-label" data-say="options"></span>
          ${button(`class="fam-button" id="wrap" data-testid="wrap" data-say="wrap" aria-pressed="false"`)}
          <div class="fam-seg" role="group" data-say-label="sources" id="sources" data-testid="sources">
            ${[1, 2, 3].map((count) => button(`data-sources="${count}" data-say-label="pumps${count}"`, `${count}${DROPLET}`)).join("")}
          </div>
        </div>
        <div class="setup fam-row">
          <span class="fam-label" data-say="difficulty"></span>
          <input type="range" id="difficulty" data-testid="difficulty" min="1" max="100" value="50" data-say-label="difficulty" />
          <span class="fam-chip" id="difficulty-value" data-testid="difficulty-value" data-lit="true"></span>
        </div>
      </div>
      ${familyUnreviewed({ id })}
      <section class="more" aria-labelledby="more-title">
        <h2 id="more-title" data-say="moreTitle"></h2>
        <p data-say="moreText"></p>
        <ul class="uses">
          ${uses.map((line) => `<li><code>${escape(line)}</code></li>`).join("\n          ")}
        </ul>
      </section>
      ${familyFooter({ id })}
    </main>
    <script>${FAMILY_SCRIPT}</script>
    <script type="module" src="demo.js"></script>
  </body>
</html>
`;

rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
cpSync("demo", "site", { recursive: true });
cpSync("dist", "site/dist", { recursive: true });
writeFileSync("site/index.html", page);
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");
