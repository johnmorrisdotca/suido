import { embedSnippet } from "@johnmorrisdotca/kazoku-ui/embed-panel";
import "@johnmorrisdotca/kazoku-ui/embed-panel/define";
import { VERSION } from "./dist/index.js";
import { SUIDO_LEVEL_COUNTS, SUIDO_SIZES } from "./dist/levels.js";

const SITE = "https://johnmorrisdotca.github.io/suido/";
const WORDS = {
  en: { pick: "Grid for the code", level: "Level", hints: "Hints" },
  ja: { pick: "コードの盤の大きさ", level: "レベル", hints: "ヒント" },
};
const panel = document.getElementById("embed-panel");
const level = document.getElementById("embed-level");
const hints = document.getElementById("embed-hints");
const major = VERSION.split(".")[0];
const lang = () => (document.documentElement.lang === "ja" ? "ja" : "en");
let grid = "7x7";

const attrs = (size) => [
  ["grid", grid],
  ["level", String(level.valueAsNumber || 1)],
  ...(hints.getAttribute("aria-pressed") === "true" ? [["hints", ""]] : []),
  ...(size === 480 ? [] : [["width", String(size)]]),
];
const query = () =>
  attrs(480)
    .map(([name, value]) => `${name}=${value === "" ? "on" : value}`)
    .join("&");
const spec = (size, preview) => {
  const [columns, rows] = grid.split("x").map(Number);
  return {
    package: "@johnmorrisdotca/suido",
    cdn: `https://cdn.jsdelivr.net/npm/@johnmorrisdotca/suido@${major}`,
    tag: "suido-board",
    element: "element/define",
    entries: [],
    attrs: attrs(size),
    name: "suido",
    iframe: {
      src: `${preview ? "" : SITE}embed/?${query()}`,
      title: "Suido pipe puzzle",
      width: size + 16,
      height: Math.ceil((size * rows) / columns) + 190,
    },
  };
};
const words = () => WORDS[lang()];
const picker = document.getElementById("embed-picker");
for (const id of SUIDO_SIZES) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.id = id;
  button.textContent = id.replace("x", "×");
  button.addEventListener("click", () => {
    grid = id;
    if (level.valueAsNumber > SUIDO_LEVEL_COUNTS[grid]) level.value = "1";
    draw();
    refresh();
  });
  picker.append(button);
}
const draw = () => {
  panel.setAttribute("lang", lang());
  picker.setAttribute("aria-label", words().pick);
  for (const button of picker.querySelectorAll("button"))
    button.setAttribute("aria-pressed", String(button.dataset.id === grid));
  level.max = String(SUIDO_LEVEL_COUNTS[grid]);
  document.querySelector('label[for="embed-level"]').textContent = words().level;
  hints.textContent = words().hints;
  panel.update();
};

panel.generate = ({ kind, size, preview }) => embedSnippet(kind, spec(size, preview));
panel.preview = ({ kind, size }) => {
  if (kind === "iframe") return undefined;
  const board = document.createElement("suido-board");
  for (const [name, value] of attrs(size)) board.setAttribute(name, value);
  return board;
};
const refresh = () => {
  panel.openHref = `embed/?${query()}`;
  panel.update();
};
level.addEventListener("input", () => {
  if (level.valueAsNumber >= 1 && level.valueAsNumber <= SUIDO_LEVEL_COUNTS[grid]) refresh();
});
hints.addEventListener("click", () => {
  hints.setAttribute("aria-pressed", String(hints.getAttribute("aria-pressed") !== "true"));
  refresh();
});
document.addEventListener("kazoku-languagechange", draw);
draw();
refresh();
