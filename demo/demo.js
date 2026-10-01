// The demo page's own script: a Suido board to play, any size and kind, drawn and painted by the
// package's own functions, with the water seen to flow as pipes join, kept on this device between
// visits, and spoken in the language the header's chooser picks.
import { canTurn, DIFFICULTY_SIDES, hintFor, makeSuido, newGame, quartersBetween, shapeOf, turnAt } from "./dist/index.js";
import { drawSuido, paintSuido } from "./dist/draw-entry.js";

// The page's own words, in the two languages it speaks. Set as text, never as HTML.
const WORDS = {
  en: {
    pitch: "Turn the pieces of pipe until the water from the pump reaches every drain. Water flows through pipes that meet, and runs out of any end left open. Every board has exactly one answer.",
    name: "Suido (水道) is Japanese for a waterworks: the pipes that carry water.",
    nameLink: "About the name",
    size: "Size",
    kind: "Kind",
    options: "Options",
    kindNetwork: "Whole network",
    kindDrains: "Reach the drains",
    kindNoteNetwork: "Every piece of pipe must carry water, and nothing may be left open.",
    kindNoteDrains: "Reach every drain with nothing left open. Pieces the water does not need may stay dry, in any direction.",
    wrap: "Edges join",
    sources: "Pumps",
    pumps1: "One pump",
    pumps2: "Two pumps",
    pumps3: "Three pumps",
    difficulty: "Difficulty",
    levelName: (value) => (value <= 20 ? "Easy" : value <= 45 ? "Gentle" : value <= 65 ? "Medium" : value <= 85 ? "Hard" : "Fiendish"),
    newBoard: "New board",
    restart: "Start over",
    hint: "Hint",
    timer: "Timer",
    direction: (reverse) => (reverse ? "Turning ↺ anticlockwise" : "Turning ↻ clockwise"),
    making: "Making a board…",
    progressNetwork: (wet, of) => `The water reaches ${wet} of ${of} pieces`,
    progressDrains: (wet, of) => `The water reaches ${wet} of ${of} drains`,
    leaks: (count) => (count === 0 ? "no leaks" : count === 1 ? "1 open end" : `${count} open ends`),
    solved: (turns) => `Solved in ${turns} ${turns === 1 ? "turn" : "turns"}. Every pipe is joined and nothing is left open.`,
    solvedDrains: (turns) => `Solved in ${turns} ${turns === 1 ? "turn" : "turns"}. The water reaches every drain and nothing is left open.`,
    turns: (count) => `${count} ${count === 1 ? "turn" : "turns"}`,
    hints: (count) => `${count} ${count === 1 ? "hint" : "hints"}`,
    best: (time) => `best ${time}`,
    board: (size, difficulty, seed) => `${size}×${size} · difficulty ${difficulty} · board ${seed}`,
    hinted: "Try turning the piece that is lit.",
    noHint: "Every piece the water needs already faces the right way.",
    shapes: { blank: "bare ground", end: "end", straight: "straight", elbow: "elbow", tee: "T piece", cross: "cross" },
    cell: (row, col, shape, role, wet) => `Row ${row}, column ${col}: ${role === "source" ? "pump, " : role === "drain" ? "drain, " : ""}${shape}${wet ? ", wet" : ""}`,
    moreTitle: "Using it",
    moreText: "The board above is the package itself: the rules, the solver, the generator and the drawing. Each line below is all it takes.",
    foot: "Every board is made from a seed and proved to have exactly one answer. Nothing here leaves your device.",
  },
  ja: {
    pitch: "パイプの駒を回して、ポンプからの水をすべての排水口に届けましょう。水はつながったパイプを通って流れ、開いたままの端からは漏れてしまいます。どの盤面も、答えはちょうど一つです。",
    name: "「水道」は、水を通す道、つまり水道管のことです。",
    nameLink: "名前について（英語）",
    size: "大きさ",
    kind: "種類",
    options: "設定",
    kindNetwork: "全部つなぐ",
    kindDrains: "排水口まで",
    kindNoteNetwork: "すべてのパイプに水を通します。開いたままの端があってはいけません。",
    kindNoteDrains: "すべての排水口に水を届けます。開いたままの端はいけません。水がいらない駒は、乾いたままでも、どの向きでもかまいません。",
    wrap: "端がつながる",
    sources: "ポンプ",
    pumps1: "ポンプ1つ",
    pumps2: "ポンプ2つ",
    pumps3: "ポンプ3つ",
    difficulty: "難しさ",
    levelName: (value) => (value <= 20 ? "かんたん" : value <= 45 ? "やさしい" : value <= 65 ? "ふつう" : value <= 85 ? "むずかしい" : "超難問"),
    newBoard: "新しい盤面",
    restart: "最初から",
    hint: "ヒント",
    timer: "タイマー",
    direction: (reverse) => (reverse ? "左回り ↺ に回す" : "右回り ↻ に回す"),
    making: "盤面を作っています…",
    progressNetwork: (wet, of) => `${of}個中${wet}個のパイプに水が届いています`,
    progressDrains: (wet, of) => `${of}か所中${wet}か所の排水口に水が届いています`,
    leaks: (count) => (count === 0 ? "漏れなし" : `開いた端 ${count}か所`),
    solved: (turns) => `解けました。${turns}回で、すべてのパイプがつながり、開いた端もありません。`,
    solvedDrains: (turns) => `解けました。${turns}回で、すべての排水口に水が届き、開いた端もありません。`,
    turns: (count) => `${count}回`,
    hints: (count) => `ヒント${count}回`,
    best: (time) => `最高 ${time}`,
    board: (size, difficulty, seed) => `${size}×${size} ・ 難しさ ${difficulty} ・ 盤面 ${seed}`,
    hinted: "光っている駒を回してみましょう。",
    noHint: "水が通る駒は、すべて正しい向きです。",
    shapes: { blank: "空き地", end: "行き止まり", straight: "直線", elbow: "曲がり", tee: "T字", cross: "十字" },
    cell: (row, col, shape, role, wet) => `${row}行${col}列：${role === "source" ? "ポンプ、" : role === "drain" ? "排水口、" : ""}${shape}${wet ? "、水あり" : ""}`,
    moreTitle: "使い方",
    moreText: "上の盤面は、このパッケージそのもの（ルール、ソルバー、盤面の生成、描画）で動いています。下の各行がそれぞれ必要なコードのすべてです。",
    foot: "どの盤面も、種から作られ、答えがちょうど一つであることが確かめられています。このページの情報は、端末の外に出ません。",
  },
};

const KEY = "suido.page";
const SIZES = [5, 6, 7, 8, 9, 10, 12, 14].filter((size) => DIFFICULTY_SIDES.includes(size));
const params = new URLSearchParams(location.search);

const read = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
};
const write = (value) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    /* Not remembered on this device; the board still plays. */
  }
};
const whole = (value, low, high, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number >= low && number <= high ? number : fallback;
};

const kept = read();
const settings = {
  size: SIZES.includes(Number(params.get("size"))) ? Number(params.get("size")) : SIZES.includes(kept.size) ? kept.size : 7,
  kind: ["network", "drains"].includes(params.get("kind")) ? params.get("kind") : ["network", "drains"].includes(kept.kind) ? kept.kind : "network",
  wrap: params.has("wrap") ? params.get("wrap") === "1" : kept.wrap === true,
  sources: whole(params.get("sources"), 1, 3, whole(kept.sources, 1, 3, 1)),
  difficulty: whole(params.get("difficulty"), 1, 100, whole(kept.difficulty, 1, 100, 50)),
  seed: whole(params.get("seed"), 0, 4294967295, Math.floor(Math.random() * 1_000_000_000)),
  exact: params.get("exact") === "1",
  timer: params.has("timer") ? params.get("timer") === "1" : kept.timer === true,
  reverse: kept.reverse === true,
};

const els = Object.fromEntries(["sizes", "kinds", "wrap", "sources", "difficulty", "difficulty-value", "new", "restart", "hint", "direction", "timer-toggle", "kind-note", "board", "status", "meter", "note"].map((id) => [id, document.getElementById(id)]));
const language = familyLanguage({ id: "suido", words: WORDS, onChange: () => render() });
const say = (key, ...args) => {
  const word = WORDS[language.lang][key];
  return typeof word === "function" ? word(...args) : word;
};

let made = null;
let game = null;
let svg = null;
let hints = 0;
let said = null;
let flow = null;
let elapsed = 0;
let startedAt = null;
let ticking = null;
let generation = 0;

const clock = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
const bestKey = () => `${settings.size}|${settings.kind}|${settings.wrap ? "w" : "-"}|${settings.sources}|${made?.difficulty ?? settings.difficulty}`;

function address() {
  const query = new URLSearchParams({ size: String(settings.size), kind: settings.kind, sources: String(settings.sources), difficulty: String(settings.difficulty), seed: String(settings.seed), exact: "1" });
  if (settings.wrap) query.set("wrap", "1");
  if (settings.timer) query.set("timer", "1");
  history.replaceState(history.state, "", `${location.pathname}?${query}${language.asked !== null ? `&lang=${language.lang}` : ""}${new URLSearchParams(location.search).has("cloth") ? `&cloth=${new URLSearchParams(location.search).get("cloth")}` : ""}`);
}

function keep() {
  write({ size: settings.size, kind: settings.kind, wrap: settings.wrap, sources: settings.sources, difficulty: settings.difficulty, timer: settings.timer, reverse: settings.reverse, best: kept.best ?? {} });
}

/** Where the cell labels, the status and the timer say what the board is doing; called after every change. */
function render() {
  language.say();
  for (const button of els.sizes.children) button.setAttribute("aria-pressed", String(Number(button.dataset.size) === settings.size));
  for (const button of els.kinds.children) button.setAttribute("aria-pressed", String(button.dataset.kind === settings.kind));
  for (const button of els.sources.children) button.setAttribute("aria-pressed", String(Number(button.dataset.sources) === settings.sources));
  els.wrap.setAttribute("aria-pressed", String(settings.wrap));
  els["timer-toggle"].setAttribute("aria-pressed", String(settings.timer));
  els.direction.setAttribute("aria-pressed", String(settings.reverse));
  els.direction.textContent = say("direction", settings.reverse);
  els.difficulty.value = String(settings.difficulty);
  els["difficulty-value"].textContent = `${settings.difficulty} · ${say("levelName", settings.difficulty)}`;
  els["kind-note"].textContent = say(settings.kind === "drains" ? "kindNoteDrains" : "kindNoteNetwork");
  if (game === null) {
    els.status.textContent = say("making");
    return;
  }
  const solved = flow.solved;
  const leaks = flow.spills.length;
  const progress = settings.kind === "drains" ? say("progressDrains", flow.wetDrains, flow.drains) : say("progressNetwork", flow.wetPieces, flow.pieces);
  els.status.textContent = solved ? say(settings.kind === "drains" ? "solvedDrains" : "solved", game.turns) : `${progress} · ${say("leaks", leaks)}`;
  els.status.dataset.solved = String(solved);
  const bits = [say("turns", game.turns), say("hints", hints)];
  if (settings.timer) {
    const best = kept.best?.[bestKey()];
    bits.push(clock(elapsed + (startedAt === null ? 0 : Date.now() - startedAt)));
    if (best !== undefined) bits.push(say("best", clock(best)));
  }
  bits.push(say("board", settings.size, made.difficulty, settings.seed));
  els.meter.textContent = bits.join(" · ");
  els.note.textContent = said === null ? "" : say(said);
  label();
}

/** The words a screen reader says for every cell. */
function label() {
  const cells = svg.querySelectorAll(".sd-cell");
  const words = WORDS[language.lang];
  cells.forEach((cell, index) => {
    const shape = shapeOf(game.masks[index]);
    cell.setAttribute("aria-label", words.cell(Math.floor(index / settings.size) + 1, (index % settings.size) + 1, words.shapes[shape], cell.dataset.role, flow.wet[index]));
  });
}

function stopTicking() {
  if (ticking !== null) clearInterval(ticking);
  ticking = null;
}

/** Draws a new board's SVG, then paints the water onto it on the next frame, so the first flow is seen. */
function show() {
  els.board.innerHTML = drawSuido(made.layout, { masks: game.masks, water: false });
  svg = els.board.firstElementChild;
  svg.querySelectorAll(".sd-cell").forEach((cell, index) => {
    cell.setAttribute("role", "button");
    cell.setAttribute("tabindex", index === 0 ? "0" : "-1");
  });
  els.board.removeAttribute("aria-busy");
  els.board.dataset.painted = "false";
  flow = paintSuido(svg, made.layout, game.masks, game.quarters);
  // The drawing starts dry: this frame paints the water in, and the style makes it run.
  svg.setAttribute("data-solved", "false");
  svg.querySelectorAll(".sd-cell").forEach((cell) => cell.setAttribute("data-wet", "false"));
  requestAnimationFrame(() => requestAnimationFrame(() => paintAndRender()));
}

function paintAndRender() {
  flow = paintSuido(svg, made.layout, game.masks, game.quarters);
  els.board.dataset.painted = "true";
  render();
}

function begin(code, restored) {
  game = newGame(code);
  if (restored !== undefined) {
    game.masks = [...restored.masks];
    game.quarters = game.masks.map((mask, cell) => quartersBetween(game.start.cells[cell], mask) ?? 0);
    game.turns = restored.turns;
  }
  hints = 0;
  said = null;
  elapsed = 0;
  startedAt = null;
  stopTicking();
  show();
}

/** Makes the board the settings ask for, after the page has had a moment to say it is doing so. */
function makeBoard(keepSeed = false) {
  if (!keepSeed) {
    settings.seed = Math.floor(Math.random() * 1_000_000_000);
    settings.exact = false;
  }
  const mine = (generation += 1);
  els.board.setAttribute("aria-busy", "true");
  els.status.textContent = say("making");
  setTimeout(() => {
    if (mine !== generation) return;
    // An address that names the board's own seed (`exact`) asks for that very board, not another near its difficulty.
    made = makeSuido({ size: settings.size, kind: settings.kind, wrap: settings.wrap, sources: settings.sources, difficulty: settings.exact ? undefined : settings.difficulty, seed: settings.seed });
    settings.exact = false;
    settings.seed = made.seed;
    address();
    keep();
    begin(made.code);
  }, 20);
}

function turnCell(index, reverse) {
  if (game === null || els.board.getAttribute("aria-busy") === "true" || !canTurn(game.masks[index])) return;
  if (startedAt === null && settings.timer && !flow.solved) startedAt = Date.now();
  if (settings.timer && ticking === null) ticking = setInterval(render, 500);
  game = turnAt(game, index, reverse ? -1 : 1);
  svg.querySelectorAll(".sd-cell[data-hint]").forEach((cell) => cell.removeAttribute("data-hint"));
  said = null;
  flow = paintSuido(svg, made.layout, game.masks, game.quarters);
  if (flow.solved) {
    if (startedAt !== null) {
      elapsed += Date.now() - startedAt;
      startedAt = null;
      kept.best = { ...(kept.best ?? {}) };
      if (kept.best[bestKey()] === undefined || elapsed < kept.best[bestKey()]) kept.best[bestKey()] = elapsed;
      keep();
    }
    stopTicking();
  }
  render();
}

// Taps, as a finger or a mouse makes them; a right click, or shift, or the turning button, goes the other way.
els.board.addEventListener("click", (event) => {
  const cell = event.target.closest?.(".sd-cell");
  if (cell === null || cell === undefined) return;
  turnCell(Number(cell.dataset.cell), event.shiftKey !== settings.reverse);
});
els.board.addEventListener("contextmenu", (event) => {
  const cell = event.target.closest?.(".sd-cell");
  if (cell === null || cell === undefined) return;
  event.preventDefault();
  turnCell(Number(cell.dataset.cell), !settings.reverse);
});
// The keyboard: the arrows move between pieces, enter or space turns one (with shift, the other way).
els.board.addEventListener("keydown", (event) => {
  const cell = event.target.closest?.(".sd-cell");
  if (cell === null || cell === undefined) return;
  const index = Number(cell.dataset.cell);
  const { width, height } = made.layout;
  const move = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[event.key];
  if (move !== undefined) {
    event.preventDefault();
    const col = (index % width) + move[0];
    const row = Math.floor(index / width) + move[1];
    if (col < 0 || row < 0 || col >= width || row >= height) return;
    const next = svg.querySelectorAll(".sd-cell")[row * width + col];
    cell.setAttribute("tabindex", "-1");
    next.setAttribute("tabindex", "0");
    next.focus();
  } else if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    turnCell(index, event.shiftKey !== settings.reverse);
  }
});

SIZES.forEach((size) => {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.size = String(size);
  button.textContent = `${size}×${size}`;
  els.sizes.append(button);
});
els.sizes.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button === null) return;
  settings.size = Number(button.dataset.size);
  makeBoard();
});
els.kinds.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button === null) return;
  settings.kind = button.dataset.kind;
  makeBoard();
});
els.sources.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button === null) return;
  settings.sources = Number(button.dataset.sources);
  makeBoard();
});
els.wrap.addEventListener("click", () => {
  settings.wrap = !settings.wrap;
  makeBoard();
});
els.difficulty.addEventListener("input", () => {
  settings.difficulty = Number(els.difficulty.value);
  els["difficulty-value"].textContent = `${settings.difficulty} · ${say("levelName", settings.difficulty)}`;
});
els.difficulty.addEventListener("change", () => makeBoard());
els.new.addEventListener("click", () => makeBoard());
els.restart.addEventListener("click", () => {
  if (made !== null) begin(made.code);
});
els.hint.addEventListener("click", () => {
  if (game === null) return;
  const cell = hintFor(game, made.solution);
  svg.querySelectorAll(".sd-cell[data-hint]").forEach((one) => one.removeAttribute("data-hint"));
  if (cell === null) said = "noHint";
  else {
    hints += 1;
    said = "hinted";
    svg.querySelectorAll(".sd-cell")[cell].setAttribute("data-hint", "true");
  }
  render();
});
els.direction.addEventListener("click", () => {
  settings.reverse = !settings.reverse;
  keep();
  render();
});
els["timer-toggle"].addEventListener("click", () => {
  settings.timer = !settings.timer;
  if (!settings.timer) {
    stopTicking();
    startedAt = null;
  }
  address();
  keep();
  render();
});

render();
makeBoard(true);
