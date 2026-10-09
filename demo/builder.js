import { VERSION } from "./dist/index.js";
import { SuidoBoard, SUIDO_EMBED_OPTION_KEYS } from "./dist/element.js";
import { SUIDO_SIZES, SUIDO_LEVEL_COUNTS } from "./dist/levels.js";
import { embedDay } from "./dist/embed-day.js";
import "./dist/element-define.js";
import { familyEmbedBuilder } from "./family-embed-builder.js";
const words = {
  en: { pitch: "Choose a pipe puzzle or a UTC daily level, preview it, and copy the code for your page.", name: "Suido means water supply in Japanese.", nameLink: "About the name", foot: "The setup is in the link. No game or personal data is stored.", toGallery: "The puzzles", previewTitle: "Your puzzle", makerLabel: "What to build", makerBoard: "A board", makerBoardSays: "Turn the pipes until the water reaches its goal.", notSet: "Not set", on: "On", off: "Off", reset: "Reset", startAgain: "Start again", copy: "Copy", copied: "Copied.", copyLink: "Copy a link to this puzzle", linkCopied: "The link is copied.", codeTitle: "The code", codeText: "Choose how to include this puzzle on your page.", defaultIs: "Default: {value}", badDay: "Use a real UTC date written YYYY-MM-DD, today or off.", badLevel: "Choose a level that exists at this grid size." },
  ja: { pitch: "水道のパズル、またはUTCの日替わり問題を選び、表示を確認して、ページに載せるコードをコピーします。", name: "「水道」は英語の water supply に当たる日本語です。", nameLink: "名前について", foot: "設定はリンクに入ります。ゲームや個人情報は保存しません。", toGallery: "パズルの一覧", previewTitle: "あなたのパズル", makerLabel: "作るもの", makerBoard: "盤", makerBoardSays: "管を回して、水を目的地まで通します。", notSet: "指定なし", on: "オン", off: "オフ", reset: "元に戻す", startAgain: "最初からやり直す", copy: "コピー", copied: "コピーしました。", copyLink: "このパズルへのリンクをコピー", linkCopied: "リンクをコピーしました。", codeTitle: "コード", codeText: "ページへの載せ方を選びます。", defaultIs: "初期値: {value}", badDay: "実際の日付をYYYY-MM-DDで指定するか、today、offを指定してください。UTCの日付を使います。", badLevel: "この盤の大きさにある問題を選んでください。" },
};
const row = (id, kind, en, ja, extra = {}) => ({ id, kind, group: "board", names: { board: id, mount: id === "lang" ? "language" : id }, say: { en: { label: en[0], help: en[1] }, ja: { label: ja[0], help: ja[1] } }, ...extra });
const options = [
  row("grid", "choice", ["Grid", "The puzzle's grid dimensions."], ["盤の大きさ", "パズルのマスの数です。"], { choices: SUIDO_SIZES, default: "7x7", control: "select" }),
  row("level", "number", ["Level", "A curated level; daily mode chooses the day's level."], ["問題", "収録された問題です。日替わりでは、その日の問題を選びます。"], { default: 1, range: { min: 1, max: 256, step: 1 } }),
  row("daily", "text", ["Daily", "YYYY-MM-DD, today, or off. The day is counted in UTC."], ["日替わり", "YYYY-MM-DD、today、offを指定します。UTCの日付を使います。"]),
  row("size", "choice", ["Display size", "Small, medium or large; independent of the grid."], ["表示の大きさ", "小・中・大を選びます。盤のマスの数とは別です。"], { default: "medium", choices: ["small", "medium", "large"] }),
  row("width", "number", ["Width", "The puzzle's width in pixels, fitting a narrower parent."], ["幅", "表示の幅をピクセルで指定します。狭い表示枠にも収まります。"], { range: { min: 200, max: 1000, step: 10 } }),
  row("theme", "choice", ["Theme", "Light, dark or the device's preference."], ["配色", "明るい配色・暗い配色、または端末の設定に合わせます。"], { default: "auto", choices: ["auto", "light", "dark"] }),
  row("lang", "choice", ["Language", "The language of the controls and spoken puzzle."], ["言語", "操作ボタンと読み上げるパズルの言語です。"], { choices: ["en", "ja"] }),
  row("label", "text", ["Spoken label", "An optional label for a screen reader."], ["読み上げる名前", "スクリーンリーダー用の名前です。指定は任意です。"]),
  row("turning", "choice", ["Turning", "The direction a tap turns a pipe."], ["回す方向", "タップで管を回す方向です。"], { default: "clockwise", choices: ["clockwise", "anticlockwise"] }),
  row("zoom", "choice", ["Zoom", "Allow zoom and pan when the grid is too large for a fingertip."], ["拡大", "盤が大きいとき、指で押しやすい大きさに拡大・移動できます。"], { default: "auto", choices: ["auto", "off"] }),
  ...["hints", "controls", "chips", "shown"].map((id, at) => row(id, "boolean", [["Hints", "Offer a hint for this level."], ["Controls", "Show the buttons and progress lines."], ["Chips", "Show the puzzle's twists."], ["Show answer", "Open this curated level on its answer."]][at], [["ヒント", "この問題のヒントを使えます。"], ["操作ボタン", "ボタンと進み具合を表示します。"], ["特徴", "問題の特徴を表示します。"], ["答えを表示", "この問題の答えを表示して始めます。"]][at], { default: id === "controls" })),
];
const leftOut = {};
for (const name of ["code", "answer", "progress"]) for (const scope of ["board", "mount"]) leftOut[`${scope}.${name}`] = "Custom boards, answers and kept play state belong to host code; this builder chooses curated levels.";
for (const name of ["onChange", "onTurn", "onHint", "onTurning", "onSolve"]) leftOut[`mount.${name}`] = "Host callbacks belong to options; native events carry the same detail.";
const heights = {};
const key = (settings) => JSON.stringify(settings);
let mounted;
const page = globalThis.familyLanguage({ id: "suido", words, onChange: () => mounted?.draw() });
function problem(settings) { try { const day = embedDay(settings.daily); return day !== null || (Number(settings.level ?? 1) >= 1 && Number(settings.level ?? 1) <= SUIDO_LEVEL_COUNTS[settings.grid ?? "7x7"]) ? null : "badLevel"; } catch { return "badDay"; } }
const builder = familyEmbedBuilder({ id: "suido", packageName: "@johnmorrisdotca/suido", major: VERSION.split(".")[0], site: "https://johnmorrisdotca.github.io/suido/", title: "Suido · pipe puzzle", options, leftOut, groups: { board: { en: "The puzzle", ja: "パズルの設定" } }, makers: { board: { names: "board", element: "board", tag: "suido-board", embed: "embed/", required: ["grid", "level"], description: "makerBoardSays", formats: ["element", "iframe", "module", "react", "vue", "svelte", "angular", "html", "url"], width: 640, height: (settings) => heights[key(settings)] ?? ({ small: 680, medium: 840, large: 1000 }[settings.size] ?? 840) } }, code: ({ maker, format, settings }) => {
  if (problem(settings) !== null) return null;
  if ((format === "iframe" || format === "url") && settings.lang === undefined) return builder.codeFor(maker, format, options, { ...settings, lang: page.lang });
  return undefined;
} });
builder.validateCoverage({ board: SuidoBoard.observedAttributes, mount: SUIDO_EMBED_OPTION_KEYS });
mounted = builder.mount({ words, language: () => page, initial: { board: { grid: "7x7", level: 1, size: "medium", hints: true, lang: page.lang } }, renderPreview: ({ stage, attrs, settings, note, say }) => {
  if (problem(settings) !== null) { note.textContent = say(problem(settings)); return { destroy() {} }; }
  const board = globalThis.document.createElement("suido-board");
  for (const [name, value] of attrs) board.setAttribute(name, value);
  board.addEventListener("suido-load", () => { const ratio = board.game.start.height / board.game.start.width; const actual = board.getBoundingClientRect(); const intended = Math.min(Number(settings.width) || ({ small: 320, medium: 480, large: 640 }[settings.size] ?? 480), 624); const overhead = actual.height - actual.width * ratio; heights[key(settings)] = Math.ceil(intended * ratio + overhead) + 32; mounted?.refreshCode(); });
  stage.append(board);
  return { destroy() { board.remove(); } };
} });
