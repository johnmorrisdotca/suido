// Builds the static demo for GitHub Pages into ./site: the page, written here from the family's
// shared header and footer, with the family's stylesheet, Suido's own, the board's style, the page's
// script and the compiled library beside it.
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { build } from "esbuild";
import { SUIDO_LEVEL_COUNTS } from "../dist/levels.js";
import { SUIDO_PLAY_STYLE } from "../dist/play-entry.js";
import { API_CSS, apiPage } from "./api.mjs";
import {
  FAMILY_EMBED_BUILDER_WORDS,
  FAMILY_SCRIPT,
  familyEmbedBuilder,
  familyFooter,
  familyHead,
  familyHeader,
  familyUnreviewed,
} from "./family-template.mjs";
import { publishThumbnails, thumbnailHead } from "./family-thumbnail.mjs";

const id = "suido";
const ALT =
  "Suido: three 8×8 pipe boards, one half way with its leaks, one with several pumps and one with walls, the water running blue.";
const total = Object.values(SUIDO_LEVEL_COUNTS)
  .reduce((sum, count) => sum + count, 0)
  .toLocaleString("en-US");
const ICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%232f5d4a'/%3E%3Cpath d='M18 50H50V82M50 50H82' fill='none' stroke='%23f3efe4' stroke-width='16'/%3E%3Cpath d='M18 50H50V82M50 50H82' fill='none' stroke='%231b8fe3' stroke-width='6'/%3E%3C/svg%3E";

const uses = [
  `const rows = await loadSuidoLevels("8x8")  // 256 levels, easiest first, each with exactly one answer`,
  `const big = await loadSuidoBigLevels()  // 64 levels with big 2×2 pieces among the ordinary ones, easiest of all to hardest`,
  `SUIDO_PIECE_GUIDE  // every piece, with a board to draw it on: drawGuidePiece(piece) is its picture`,
  `loadSuidoLevels("28x28")  // the huge boards: 20×20, 28×28 and 20×50, sixty-four levels each`,
  `checkSuidoAnswer(rows[11][0], levelAnswer(rows[11]))  // { ok: true }: level 12's board and its answer`,
  `declaredTwists(rows[239])  // ["walls", "locked"]: what level 240 asks beyond turning pipes`,
  `const made = makeSuido({ size: 8, kind: "inlet-outlet", locked: 3, walls: 4, seed: 7 })  // a board of your own`,
  `makeSuido({ size: 12, bigs: 6, blocks: 4, seed: 7 })  // with big pieces and squares that turn as one`,
  `flowOf(layout, masks).wet  // where the water has got to`,
  `turnAt(game, cell)  // a tap: one piece, a quarter turn (a locked piece stays)`,
  `drawSuido(layout, { masks })  // the board as SVG text, and drawSuidoThumb(layout) for a small one`,
  `mountSuido(element, { code, answer, hints: true })  // a board to play, by tap, mouse and keyboard, with the water flowing`,
  `<suido-board size="8x8" level="12" chips hints></suido-board>  // the same in a tag`,
  `dailySuidoLevel("8x8", new Date())  // the level of the day at 8×8, the same for everybody`,
  `openSuidoLevels("8x8", solved)  // 16, 32, …`,
];
const escapeHtml = (text) => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// The page is demo/index.html; each <!-- family:key --> in it is replaced by the text below.
const pageParts = {
  head: familyHead({
    id,
    title: "Suido 水道 — Pipe-connecting puzzle",
    description: `Play Suido, the pipe puzzle: ${total} levels from 5×5 to 28×28 and long pipe boards, easy to hard, with walls, locked pieces, wrap-around edges, several pumps, drains and inlet-to-outlet paths. Every level has exactly one answer. Free and open source, in English and Japanese.`,
    ogTitle: "Suido 水道 — Pipe-connecting puzzle",
    ogDescription: `Turn the pipes until the water reaches every drain. ${total} levels, each with one answer.`,
  }),
  thumbnail: thumbnailHead(JSON.parse(readFileSync("package.json", "utf8")), { alt: ALT }),
  icon: ICON,
  style: SUIDO_PLAY_STYLE,
  header: familyHeader({
    id,
    links: [
      { href: "docs/index.html", say: "pageDocs" },
      { href: "api.html", say: "pageApi" },
    ],
  }),
  unreviewed: familyUnreviewed({ id }),
  uses: uses.map((line) => `<li><code>${escapeHtml(line)}</code></li>`).join("\n          "),
  footer: familyFooter({ id }),
  script: `<script>${FAMILY_SCRIPT}</script>\n    <script type="module" src="kazoku-parts.js"></script>\n    <script type="module" src="embed-panel.js"></script>`,
};
const page = readFileSync("demo/index.html", "utf8").replace(
  /<!-- family:([A-Za-z]+) -->/g,
  (_match, key) => pageParts[key],
);

rmSync("site", { recursive: true, force: true });
mkdirSync("site", { recursive: true });
cpSync("demo", "site", { recursive: true });
cpSync("dist", "site/dist", { recursive: true });
writeFileSync("site/index.html", page);
// The family's card, dark card and icon, at <site>/thumbnail.png, thumbnail-dark.png and icon.png.
publishThumbnails(".", "site");
// The family header's language picker and theme switch, as one small module for every page of the site (the demo, the builder, the API reference and the docs).
await build({
  stdin: {
    contents:
      'import "@johnmorrisdotca/kazoku-ui/language-picker/define";\nimport "@johnmorrisdotca/kazoku-ui/theme-switch/define";\n',
    resolveDir: process.cwd(),
  },
  outfile: "site/kazoku-parts.js",
  bundle: true,
  format: "esm",
  minify: true,
  logLevel: "silent",
});
// The demo's "Put it in your page": kazoku-ui's embed panel, filled with this board's choices and code.
await build({
  entryPoints: ["demo/embed-panel.js"],
  outfile: "site/embed-panel.js",
  external: ["./dist/*"],
  bundle: true,
  format: "esm",
  minify: true,
  logLevel: "silent",
});
// The API reference, made from the source: every export of every entry point.
writeFileSync("site/api.css", API_CSS);
writeFileSync("site/api.html", apiPage({ id, name: "Suido", icon: ICON }));
console.log("site/ is ready: serve it, or let the Pages workflow publish it.");

for (const file of ["builder.js", "builder.css"]) cpSync(`demo/${file}`, `site/${file}`);
cpSync("demo/embed", "site/embed", { recursive: true });
writeFileSync(
  "site/family-embed-builder.js",
  `export const FAMILY_EMBED_BUILDER_WORDS = ${JSON.stringify(FAMILY_EMBED_BUILDER_WORDS)};\nexport ${familyEmbedBuilder.toString()};\n`,
);
const builderParts = {
  builderHead: familyHead({
    id,
    title: "Suido · build a pipe-puzzle embed",
    description: "Choose a fixed or daily pipe puzzle, preview it and copy the embed code.",
  }),
  builderHeader: familyHeader({
    id,
    links: [
      { href: "./", say: "toGallery" },
      { href: "docs/index.html", say: "pageDocs" },
      { href: "api.html", say: "pageApi" },
    ],
  }),
  unreviewed: familyUnreviewed({ id }),
  footer: familyFooter({ id }),
  script: `<script>${FAMILY_SCRIPT}</script>\n    <script type="module" src="kazoku-parts.js"></script>`,
};
writeFileSync(
  "site/builder.html",
  readFileSync("demo/builder.html", "utf8").replace(/<!-- family:([A-Za-z]+) -->/g, (_match, key) => builderParts[key]),
);
