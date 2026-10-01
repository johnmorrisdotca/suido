// Builds the static demo for GitHub Pages into ./site: the page, written here from the family's
// shared header and footer, with the family's stylesheet, Suido's own, the board's style, the page's
// script and the compiled library beside it.
import { cpSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

import { SUIDO_PLAY_STYLE } from "../dist/play-entry.js";
import { SUIDO_LEVEL_COUNTS } from "../dist/levels.js";
import { API_CSS, apiPage } from "./api.mjs";
import { FAMILY_SCRIPT, familyFooter, familyHead, familyHeader, familyUnreviewed } from "./family-template.mjs";

const id = "suido";
const total = Object.values(SUIDO_LEVEL_COUNTS).reduce((sum, count) => sum + count, 0).toLocaleString("en-US");
const ICON = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232f5d4a'/%3E%3Cpath d='M18 50H50V82M50 50H82' fill='none' stroke='%23f3efe4' stroke-width='16'/%3E%3Cpath d='M18 50H50V82M50 50H82' fill='none' stroke='%231b8fe3' stroke-width='6'/%3E%3C/svg%3E";

const uses = [
  `const rows = await loadSuidoLevels("8x8")  // 256 levels, easiest first, each with exactly one answer`,
  `checkSuidoAnswer(rows[11][0], levelAnswer(rows[11]))  // { ok: true }: level 12's board and its answer`,
  `declaredTwists(rows[239])  // ["walls", "locked"]: what level 240 asks beyond turning pipes`,
  `const made = makeSuido({ size: 8, kind: "inlet-outlet", locked: 3, walls: 4, seed: 7 })  // a board of your own`,
  `flowOf(layout, masks).wet  // where the water has got to`,
  `turnAt(game, cell)  // a tap: one piece, a quarter turn (a locked piece stays)`,
  `drawSuido(layout, { masks })  // the board as SVG text, and drawSuidoThumb(layout) for a small one`,
  `mountSuido(element, { code, answer, hints: true })  // a board to play, by tap, mouse and keyboard, with the water flowing`,
  `<suido-board size="8x8" level="12" chips hints></suido-board>  // the same in a tag`,
  `dailySuidoLevel("8x8", new Date())  // the level of the day at 8×8, the same for everybody`,
  `openSuidoLevels("8x8", solved)  // 16, 32, …`,
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
      description: `Play Suido, the pipe puzzle: ${total} levels from 5×5 to 14×14 and long pipe boards, easy to hard, with walls, locked pieces, wrap-around edges, several pumps, drains and inlet-to-outlet paths. Every level has exactly one answer. Free and open source, in English and Japanese.`,
      ogTitle: "Suido pipe puzzle",
      ogDescription: `Turn the pipes until the water reaches every drain. ${total} levels, each with one answer.`,
    })}
    <link rel="icon" href="${ICON}" />
    <link rel="stylesheet" href="family.css" />
    <link rel="stylesheet" href="suido.css" />
    <style>${SUIDO_PLAY_STYLE}</style>
  </head>
  <body>
    <main>
      ${familyHeader({ id, links: [{ href: "api.html", say: "pageApi" }] })}
      <div class="setup fam-row" data-help-en="Levels are fixed boards from easy to hard: solve a block of sixteen to open the next. Make a board makes a new one from a seed, with the twists you choose." data-help-ja="「レベル」は、やさしい順に並んだ決まった盤面です。16レベルのまとまりを解くと次が開きます。「盤面を作る」は、選んだ仕掛けで新しい盤面を作ります。">
        <span class="fam-label" data-say="mode"></span>
        <div class="fam-seg" role="group" data-say-label="mode" id="modes" data-testid="modes">
          ${button(`data-mode="levels" data-say="modeLevels"`)}${button(`data-mode="make" data-say="modeMake"`)}
        </div>
      </div>
      <div class="setup fam-row" data-for="levels" data-help-en="Go to the previous or the next level, or jump to today's level, the same for everybody. A level opens when every level of the block before it is solved. You can also press a level in the block below." data-help-ja="前のレベル、次のレベルへ進むか、今日のレベル（だれにとっても同じ）に飛びます。ひとつ前のまとまりをすべて解くと、次のレベルが開きます。下のまとまりから選ぶこともできます。">
        <span class="fam-label" data-say="level"></span>
        ${button(`class="fam-button" id="previous" data-testid="previous" data-say-label="previous"`, "←")}
        <span class="fam-chip" data-lit="true" data-testid="level"><span id="level-number">1</span><span id="level-of" class="of"></span></span>
        ${button(`class="fam-button" id="next" data-testid="next" data-say-label="next"`, "→")}
        ${button(`class="fam-button" id="today" data-testid="today" data-say="today"`)}
      </div>
      <div class="levelinfo">
        <span class="marks" id="marks" data-testid="marks" role="img"></span>
        <span class="roleline" id="role" data-testid="role" aria-live="polite"></span>
      </div>
      <div class="table fam-felt" id="table">
        <div id="board" data-testid="board" aria-busy="true"></div>
      </div>
      <p class="meter" id="meter" data-testid="meter"></p>
      <div class="controls">
        <div class="setup fam-actions">
          ${button(`class="fam-button" id="new" data-testid="new" data-primary="true" data-say="newBoard" data-for="make"`)}
          ${button(`class="fam-button" id="timer-toggle" data-testid="timer-toggle" data-say="timer" aria-pressed="false"`)}
        </div>
      </div>
      <section class="settings" aria-labelledby="board-title">
        <h2 id="board-title" data-say="boardTitle"></h2>
        <div class="setup fam-row" data-help-en="How big the board is, from 5×5 to 14×14. Choosing a size opens its levels, or makes a new board." data-help-ja="盤の大きさです（5×5から14×14まで）。選ぶと、その大きさのレベルが開くか、新しい盤を作ります。">
          <span class="fam-label" data-say="size"></span>
          <div class="fam-seg" role="group" data-say-label="size" id="sizes" data-testid="sizes"></div>
        </div>
        <div class="setup fam-row" data-help-en="Long boards, 5×7, 6×10 and 8×14, as tall as a pipe. They have their own levels." data-help-ja="細長い盤（5×7、6×10、8×14）です。それぞれに専用のレベルがあります。">
          <span class="fam-label" data-say="shapes"></span>
          <div class="fam-seg" role="group" data-say-label="shapes" id="shapes" data-testid="shapes"></div>
        </div>
        <p class="open" id="open" data-testid="open" data-for="levels"></p>
        <section class="makeset" data-for="make" aria-label="Make a board">
          <div class="setup fam-row" data-help-en="Whole network: every piece must carry water. Reach the drains: only the drains must be reached. Inlet to outlet: one path from the top left to the bottom right. Choosing makes a new board." data-help-ja="「全部つなぐ」はすべての駒に水を通します。「排水口まで」は排水口に水が届けばよいルールです。「入口から出口へ」は左上から右下まで一本の道で水を通します。選ぶと新しい盤を作ります。">
            <span class="fam-label" data-say="kind"></span>
            <div class="fam-seg" role="group" data-say-label="kind" id="kinds" data-testid="kinds">
              ${button(`data-kind="network" data-say="kindNetwork"`)}${button(`data-kind="drains" data-say="kindDrains"`)}${button(`data-kind="inlet-outlet" data-say="kindPath"`)}
            </div>
          </div>
          <p class="kind-note" id="kind-note" aria-live="polite"></p>
          <div class="setup fam-row" data-help-en="Edges join lets water leave one edge and come back on the opposite one. The droplets set one, two or three pumps. Choosing makes a new board." data-help-ja="「端がつながる」は、水が盤の端から出て反対側の端から戻るようにします。しずくの数でポンプを1〜3つにします。選ぶと新しい盤を作ります。">
            <span class="fam-label" data-say="options"></span>
            ${button(`class="fam-button" id="wrap" data-testid="wrap" data-say="wrap" aria-pressed="false"`)}
            <div class="fam-seg" role="group" data-say-label="sources" id="sources" data-testid="sources">
              ${[1, 2, 3].map((count) => button(`data-sources="${count}" data-say-label="pumps${count}"`, `${count}${DROPLET}`)).join("")}
            </div>
          </div>
          <div class="setup fam-row" data-help-en="Locked pieces have a padlock and cannot be turned: they already face the right way. Walls stop the water crossing an edge. Choosing makes a new board." data-help-ja="固定駒には鍵がついていて回せません。向きは最初から正しい状態です。壁は水が通れない辺です。選ぶと新しい盤を作ります。">
            <span class="fam-label" data-say="lockedSetting"></span>
            <div class="fam-seg" role="group" data-say-label="lockedSetting" id="lockedamount" data-testid="locked-amount">
              ${button(`data-amount="none" data-say="none"`)}${button(`data-amount="few" data-say="few"`)}${button(`data-amount="many" data-say="many"`)}
            </div>
            <span class="fam-label" data-say="wallsSetting"></span>
            <div class="fam-seg" role="group" data-say-label="wallsSetting" id="wallsamount" data-testid="walls-amount">
              ${button(`data-amount="none" data-say="none"`)}${button(`data-amount="few" data-say="few"`)}${button(`data-amount="many" data-say="many"`)}
            </div>
          </div>
          <div class="setup fam-row" data-help-en="Slide for an easier or a harder board. A new board is made when you let go." data-help-ja="スライダーで、やさしい盤か難しい盤かを選びます。手を離すと新しい盤を作ります。">
            <span class="fam-label" data-say="difficulty"></span>
            <input type="range" id="difficulty" data-testid="difficulty" min="1" max="100" value="50" data-say-label="difficulty" />
            <span class="fam-chip" id="difficulty-value" data-testid="difficulty-value" data-lit="true"></span>
          </div>
        </section>
      </section>
      <section class="more blocks" aria-labelledby="block-title" data-for="levels">
        <h2 id="block-title"></h2>
        <p data-say="blockText"></p>
        <div class="block" id="block" data-testid="block"></div>
      </section>
      ${familyUnreviewed({ id })}
      <section class="more" aria-labelledby="more-title">
        <h2 id="more-title" data-say="moreTitle"></h2>
        <p data-say="moreText"></p>
        <ul class="uses">
          ${uses.map((line) => `<li><code>${escape(line)}</code></li>`).join("\n          ")}
        </ul>
      </section>
      <section class="more tag" aria-labelledby="tag-title">
        <h2 id="tag-title" data-say="tagTitle"></h2>
        <p data-say="tagText"></p>
        <suido-board id="tag" data-testid="tag" size="6x6" level="3" chips hints></suido-board>
      </section>
      ${familyFooter({ id })}
    </main>
    <script>${FAMILY_SCRIPT}</script>
    <script type="module" src="dist/element-define.js"></script>
    <script type="module" src="demo.js"></script>
  </body>
</html>
`;

rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
cpSync("demo", "site", { recursive: true });
cpSync("dist", "site/dist", { recursive: true });
writeFileSync("site/index.html", page);
// The API reference, made from the source: every export of every entry point.
writeFileSync("site/api.css", API_CSS);
writeFileSync("site/api.html", apiPage({ id, name: "Suido", icon: ICON }));
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");
