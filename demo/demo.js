// The demo page's own script: Suido's levels, easy to hard, in sixteen sizes from 5×5 to 28×28 and four long
// pipe shapes, and a set of sixty-four with big pieces among the ordinary ones, each level with its twists as chips and its
// difficulty as marks, the sixteen levels of its block drawn small to choose from, what was solved kept on this device;
// a guide to every piece, drawn by the package; and a second way to play, "Make a board",
// which makes a board from a seed as the settings ask. The board is played by the package's own `mountSuido`
// (the drawing, the turning, the flowing water, the hint, the words in English and Japanese); the page itself
// only chooses a board, keeps what was solved and times it.
import { BIG_FAMILIES, makeSuido, SUIDO_BIG_FAMILIES_GUIDE, SUIDO_PIECE_GUIDE, twistsOf } from "./dist/index.js";
import { drawGuidePiece, drawSuidoThumb } from "./dist/draw-entry.js";
import { mountSuido, suidoSay } from "./dist/play-entry.js";
import { blockOf, blockRange, dailySuidoLevel, declaredTwists, levelAnswer, levelBoard, levelSolution, loadSuidoBigLevels, loadSuidoLevels, nextSuidoBigLevel, nextSuidoLevel, openSuidoBigLevels, openSuidoLevels, sizeOf, SUIDO_BIG_COUNT, SUIDO_LEVEL_COUNTS, SUIDO_SIZES, suidoBigMarks, suidoBigPieces, suidoBigRole, suidoBigScore, suidoBigSize, suidoMarks, suidoRole } from "./dist/levels.js";

// The page's own words, in the two languages it speaks. Set as text, never as HTML. The board's own words
// (its lines, buttons, twists) are the package's.
const WORDS = {
  en: {
    pageApi: "API reference",
    pitch: "Turn the pieces of pipe until the water from the pump reaches every drain.",
    name: "Suido (水道) is Japanese for a waterworks: the pipes that carry water.",
    nameLink: "About the name",
    mode: "Play",
    modeLevels: "Levels",
    modeMake: "Make a board",
    boardTitle: "Board",
    size: "Size",
    shapes: "Pipes",
    level: "Level",
    set: "Levels",
    setClassic: "By size",
    setBig: "Big pieces",
    previous: "Previous level",
    next: "Next level",
    today: "Today",
    open: (open, count) => `${open} of ${count} levels open: solve every level of a block of sixteen to open the next.`,
    openBig: (open, count) => `${open} of ${count} big-pieces levels open: solve every level of a block of sixteen to open the next.`,
    marks: (count) => `Difficulty ${count} of 5`,
    bigLevelMeter: (level, size, score) => `Big pieces · level ${level} · ${size} · score ${score} of 100`,
    bigInfo: (count, share) => `${count} big ${count === 1 ? "piece" : "pieces"}, ${share}% of the board`,
    teaches: (names) => `This level teaches: ${names}`,
    tests: (names) => `This level tests: ${names}`,
    kind: "Kind",
    kindNetwork: "Whole network",
    kindDrains: "Reach the drains",
    kindPath: "Inlet to outlet",
    kindNoteNetwork: "Every piece of pipe must carry water, and nothing may be left open.",
    kindNoteDrains: "Reach every drain with nothing left open. Pieces the water does not need may stay dry, in any direction.",
    kindNotePath: "Water comes in at the top left and must leave at the bottom right, in one path with no branches. The other pieces are decoys and stay dry.",
    options: "Options",
    wrap: "Edges join",
    sources: "Pumps",
    pumps1: "One pump",
    pumps2: "Two pumps",
    pumps3: "Three pumps",
    lockedSetting: "Locked",
    wallsSetting: "Walls",
    bigsSetting: "Big pieces",
    blocksSetting: "Block turns",
    none: "None",
    few: "A few",
    many: "Many",
    difficulty: "Difficulty",
    levelName: (value) => (value <= 20 ? "Easy" : value <= 45 ? "Gentle" : value <= 65 ? "Medium" : value <= 85 ? "Hard" : "Fiendish"),
    newBoard: "New board",
    timer: "Timer",
    making: "Making a board…",
    best: (time) => `best ${time}`,
    board: (size, difficulty, seed) => `${size} · difficulty ${difficulty} · board ${seed}`,
    levelMeter: (level, size) => `Level ${level} · ${size}`,
    blockTitle: (block, first, last) => `Block ${block}: levels ${first} to ${last}`,
    blockText: "The sixteen levels of the block you are in, as drawn: a level you have solved shows its answer, and one not open yet is dimmed. Press one to play it.",
    levelLabel: (level, state) => `Level ${level}, ${state}`,
    states: { open: "open", solved: "solved", locked: "not open yet", here: "playing now" },
    piecesTitle: "The pieces",
    piecesText: "Every piece in Suido, each drawn by the package itself. A tap turns an ordinary piece a quarter; a big piece and a block turn as one square.",
    pieceGroups: { turn: "Pieces you turn", water: "Where the water starts and ends", twist: "What a board adds", block: "A square that turns as one" },
    bigTitle: "Big pieces",
    bigText: "A big piece fills four squares and is one piece to turn. Inside it are one, two or three separate pipes: water in one never reaches another, however close they run. These are a few of the 699 shapes a big piece can have.",
    familiesTitle: "Every family of big piece",
    familiesText: "A family is the big pieces whose pipes have the same numbers of openings: 2+2 is two pipes of two openings each, and 1+1+1 is three pipes of one opening each. There are 32 families, and each picture is one shape of its family, with how many shapes it has.",
    family: (name, count) => `${name} · ${count}`,
    moreTitle: "Using it",
    moreText: "The board above is the package itself: the rules, the solver, the generator, the levels and the drawing. Each line below is all it takes.",
    tagTitle: "As a tag",
    tagText: "The same board in one element, with no framework: its twists as chips, and a hint to ask for.",
    foot: "Every level was made once and is proved on every build to have exactly one answer. Nothing here leaves your device.",
  },
  ja: {
    pageApi: "API（英語）",
    pitch: "パイプの駒を回して、ポンプからの水をすべての排水口に届けましょう。",
    name: "「水道」は、水を通す道、つまり水道管のことです。",
    nameLink: "名前について（英語）",
    mode: "遊び方",
    modeLevels: "レベル",
    modeMake: "盤面を作る",
    boardTitle: "盤",
    size: "大きさ",
    shapes: "細長い盤",
    level: "レベル",
    set: "レベルの種類",
    setClassic: "大きさ別",
    setBig: "大きな駒",
    previous: "前のレベル",
    next: "次のレベル",
    today: "今日",
    open: (open, count) => `${count}レベル中${open}レベルが開いています。16レベルのまとまりをすべて解くと、次が開きます。`,
    openBig: (open, count) => `大きな駒のレベル${count}個のうち${open}個が開いています。16レベルのまとまりをすべて解くと、次が開きます。`,
    marks: (count) => `難しさ ${count}／5`,
    bigLevelMeter: (level, size, score) => `大きな駒 ・ レベル ${level} ・ ${size} ・ 難しさの点数 ${score}／100`,
    bigInfo: (count, share) => `大きな駒 ${count}個、盤の${share}％`,
    teaches: (names) => `このレベルで学ぶこと：${names}`,
    tests: (names) => `このレベルで試すこと：${names}`,
    kind: "種類",
    kindNetwork: "全部つなぐ",
    kindDrains: "排水口まで",
    kindPath: "入口から出口へ",
    kindNoteNetwork: "すべてのパイプに水を通します。開いたままの端があってはいけません。",
    kindNoteDrains: "すべての排水口に水を届けます。開いたままの端はいけません。水がいらない駒は、乾いたままでも、どの向きでもかまいません。",
    kindNotePath: "左上の入口から入った水を、右下の出口まで、枝分かれのない一本の道で通します。ほかの駒はおとりで、乾いたままです。",
    options: "設定",
    wrap: "端がつながる",
    sources: "ポンプ",
    pumps1: "ポンプ1つ",
    pumps2: "ポンプ2つ",
    pumps3: "ポンプ3つ",
    lockedSetting: "固定駒",
    wallsSetting: "壁",
    bigsSetting: "大きな駒",
    blocksSetting: "ブロック回転",
    none: "なし",
    few: "少し",
    many: "たくさん",
    difficulty: "難しさ",
    levelName: (value) => (value <= 20 ? "かんたん" : value <= 45 ? "やさしい" : value <= 65 ? "ふつう" : value <= 85 ? "むずかしい" : "超難問"),
    newBoard: "新しい盤面",
    timer: "タイマー",
    making: "盤面を作っています…",
    best: (time) => `最高 ${time}`,
    board: (size, difficulty, seed) => `${size} ・ 難しさ ${difficulty} ・ 盤面 ${seed}`,
    levelMeter: (level, size) => `レベル ${level} ・ ${size}`,
    blockTitle: (block, first, last) => `${block}番目のまとまり：レベル${first}〜${last}`,
    blockText: "いま遊んでいる16レベルのまとまりを、そのまま描いています。解いたレベルは答えが見え、まだ開いていないレベルは薄くなります。押すとそのレベルで遊べます。",
    levelLabel: (level, state) => `レベル${level}、${state}`,
    states: { open: "開いている", solved: "解けた", locked: "まだ開いていない", here: "いま遊んでいる" },
    piecesTitle: "駒の一覧",
    piecesText: "水道のすべての駒を、パッケージ自身が描いています。ふつうの駒は、押すと4分の1回ります。大きな駒とブロックは、四角ごといっしょに回ります。",
    pieceGroups: { turn: "回す駒", water: "水の出発点と行き先", twist: "盤に加わるもの", block: "いっしょに回る四角" },
    bigTitle: "大きな駒",
    bigText: "大きな駒は4マスを使い、回すときは1つの駒です。中には1本、2本、または3本の、つながっていないパイプがあります。近くを通っていても、片方の水がもう片方に届くことはありません。大きな駒がとれる699通りの形のうち、いくつかを見せます。",
    familiesTitle: "大きな駒の全グループ",
    familiesText: "グループとは、パイプごとの口の数が同じ大きな駒のことです。2+2は口が2つのパイプ2本、1+1+1は口が1つのパイプ3本です。32グループあり、絵はそれぞれのグループの形を1つずつ、形の数といっしょに示します。",
    family: (name, count) => `${name} ・ ${count}通り`,
    moreTitle: "使い方",
    moreText: "上の盤面は、このパッケージそのもの（ルール、ソルバー、盤面の生成、レベル、描画）で動いています。下の各行がそれぞれ必要なコードのすべてです。",
    tagTitle: "タグとして",
    tagText: "同じ盤面を、フレームワークなしの一つの要素で。仕掛けがチップで出て、ヒントも頼めます。",
    foot: "どのレベルも一度だけ作られ、ビルドのたびに答えがちょうど一つであることが確かめられています。このページの情報は、端末の外に出ません。",
  },
};

// The guide's pieces in Japanese: [name, what it is]. The English is the package's own (`SUIDO_PIECE_GUIDE`).
const PIECES_JA = {
  ground: ["地面", "何も置かれていないマス。水をすべての駒に通さなくてよい盤にだけあり、回すことはできません。"],
  end: ["行き止まり", "口が1つの駒で、パイプの端です。4方向に向けられます。水が届いたら、口は隣の駒の口と合わせないと、水がこぼれます。"],
  straight: ["まっすぐ", "向かい合う2辺に口がある駒。縦と横の2通りに向けられるので、押すと切り替わります。"],
  elbow: ["曲がり", "隣り合う2辺に口がある、角の駒。4方向に向けられます。"],
  tee: ["T字", "口が3つで、枝分かれする駒。4方向に向けられ、水はここで分かれます。"],
  cross: ["十字", "口が4つの交差点で、4方向の隣と全部つながります。回しても同じ見た目なので、押しても何も変わりません。"],
  pump: ["ポンプ", "水の出どころ。駒の上のこい青の円に描かれたしずくです。地面以外のどの駒にも置け、その駒と同じように回ります。ポンプは1つの盤に1つか複数あり、それぞれが自分のパイプを満たします。"],
  drain: ["排水口", "水が最後に届くべき場所。駒の上の丸い鉢で、水が届くと満ちます。排水口の盤では、すべての排水口に水を届けます。水がいらない駒は乾いたままで、どの向きでもかまいません。"],
  "pump-and-drain": ["ポンプから排水口へ", "口がつながったポンプと排水口。水は一方からもう一方へ流れ、両方が満ちます。これがゲームのすべてです。駒を回して、すべての排水口に水を届け、どこからもこぼさないようにします。"],
  locked: ["固定駒", "回せない駒で、小さな鍵がついています。盤に置かれた向きのままなので、ここを手がかりに考えられます。"],
  wall: ["壁", "2つのマスのあいだにある太い棒。水は越えられません。壁をはさんで向かい合う2つの駒は、つながりません。"],
  wrap: ["端がつながる盤", "赤い点線のふちの盤。一方の端から出たパイプが、反対側の端から入ってきます。盤は輪になっていて、端がありません。"],
  "block-turn": ["いっしょに回るブロック", "曲がり、行き止まり、まっすぐ、T字の4つのふつうの駒。1つずつは回せません。押すと四角ぜんたいが4分の1回り、それぞれの駒が次の場所へ動きながら回ります。中がつながっていない、大きな駒のようなものです。"],
  "big-snake": ["大きな駒：口が1つ", "4マスが1つの駒で、中にはぐるりと回って止まる1本のパイプがあります。口は1つだけ。ぜんたいで1つの駒として、4分の1ずつ回ります。"],
  "big-hairpin": ["大きな駒：ヘアピン", "入って、そのまま戻ってくる1本のパイプ。2つの口が、四角の同じ辺に並びます。"],
  "big-two-straights": ["大きな駒：並んだ2本", "すれちがうだけで、つながらない2本のパイプ。近くても、片方の水がもう片方に届くことはありません。口は4つで、向かい合う2辺に2つずつ。2方向に向けられます。"],
  "big-two-elbows": ["大きな駒：曲がりの中の曲がり", "どちらも曲がった2本のパイプで、1本がもう1本の内側を曲がります。つながりません。口は4つで、隣り合う2辺にあります。"],
  "big-through-and-branch": ["大きな駒：通り抜ける1本と枝分かれ", "1本のパイプは四角をまっすぐ抜け、もう1本は横に枝分かれします。口は6つで、3辺に2つずつあります。"],
  "big-hairpin-over-straight": ["大きな駒：ヘアピンとまっすぐ", "口が同じ辺に2つあるU字のパイプと、四角の反対側を横切るまっすぐなパイプ。2本はつながりません。"],
  "big-branch-and-straight": ["大きな駒：枝のあるパイプとまっすぐ", "入って枝分かれし、枝の1つが四角の中で止まるパイプと、まっすぐ横切るパイプが並びます。"],
  "big-two-stubbed-pipes": ["大きな駒：中で止まる枝のある2本", "口が2つずつの2本のパイプ。どちらもT字で、枝の1つが四角の中で止まります。"],
  "big-three-pipes": ["大きな駒：口が1つずつの3本", "4マスの中に、つながっていない3本のパイプがあります。短い行き止まりが2つと、入って中で止まる少し長い1本です。"],
  "big-three-pipes-two-openings": ["大きな駒：口が2つずつの3本", "口が2つずつの、つながっていない3本のパイプ。ふつうの曲がりが2本と、枝が四角の中で止まる1本です。"],
  "big-crossing-and-stub": ["大きな駒：十字の入った駒と行き止まり", "十字とT字が中でつながった、口が6つの1本のパイプと、そのとなりにある別の行き止まり。"],
  "big-grid": ["大きな駒：十字の格子", "口が8つの1本のパイプ。四角が持てる最多です。どのマスもT字か十字で、中で水があらゆる方向へ進みます。"],
  "big-two-tee-pipes": ["大きな駒：T字2つの2本", "口が4つずつの2本のパイプが並び、どのマスもT字です。口は合わせて8つで、片方の水がもう片方へ移ることはありません。"],
};

const KEY = "suido.page";
const SQUARES = SUIDO_SIZES.filter((size) => sizeOf(size).width === sizeOf(size).height);
const SHAPES = SUIDO_SIZES.filter((size) => sizeOf(size).width !== sizeOf(size).height);
const KINDS = ["network", "drains", "inlet-outlet"];
const AMOUNTS = ["none", "few", "many"];
/** The share of a board's cells that are locked or walled for each amount. */
const SHARE = { none: 0, few: 0.06, many: 0.14 };
/** The share of a board's cells that are in a big piece or a block that turns, for each amount: a square holds four cells, so this is a count of squares. */
const SQUARES_SHARE = { none: 0, few: 1 / 60, many: 1 / 22 };
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
/** A size as an address may name it: `6` is 6×6, and `8x14` is itself. */
const sizeFrom = (text) => {
  const named = /^\d+$/.test(text ?? "") ? `${text}x${text}` : text;
  return SUIDO_SIZES.includes(named) ? named : null;
};
const pick = (asked, allowed, kept, fallback) => (allowed.includes(asked) ? asked : allowed.includes(kept) ? kept : fallback);

const kept = read();
const settings = {
  // An address with a seed is a board somebody made: it opens in the maker.
  mode: pick(params.get("mode"), ["levels", "make"], params.has("seed") ? "make" : kept.mode, "levels"),
  // The big-pieces levels (`set=big`) are asked for by name; an address that names a size or a mode without a set is the levels by size.
  set: params.has("set") ? pick(params.get("set"), ["classic", "big"], null, "classic") : params.has("size") || params.has("mode") ? "classic" : pick(kept.set, ["classic", "big"], null, "classic"),
  size: sizeFrom(params.get("size")) ?? sizeFrom(kept.size) ?? "7x7",
  kind: pick(params.get("kind"), KINDS, kept.kind, "network"),
  wrap: params.has("wrap") ? params.get("wrap") === "1" : kept.wrap === true,
  sources: whole(params.get("sources"), 1, 3, whole(kept.sources, 1, 3, 1)),
  locked: pick(params.get("locked"), AMOUNTS, kept.locked, "none"),
  walls: pick(params.get("walls"), AMOUNTS, kept.walls, "none"),
  bigs: pick(params.get("bigs"), AMOUNTS, kept.bigs, "none"),
  blocks: pick(params.get("blocks"), AMOUNTS, kept.blocks, "none"),
  difficulty: whole(params.get("difficulty"), 1, 100, whole(kept.difficulty, 1, 100, 50)),
  seed: whole(params.get("seed"), 0, 4294967295, Math.floor(Math.random() * 1_000_000_000)),
  exact: params.get("exact") === "1",
  timer: params.has("timer") ? params.get("timer") === "1" : kept.timer === true,
  reverse: kept.reverse === true,
};
let solved = kept.solved ?? {};
let progress = kept.progress ?? {};
let level = 1;
let rows = [];


// A half-played level kept by 1.1.0 was { q: digits, t: turns }; it is read as the package's own string now.
const legacy = (saved) => (typeof saved === "object" && saved !== null && typeof saved.q === "string" ? `${saved.q}:${saved.t}` : saved);
for (const key of Object.keys(progress)) progress[key] = legacy(progress[key]);

const IDS = ["modes", "sets", "classic-sizes", "classic-shapes", "pieces-small", "pieces-big", "pieces-families", "sizes", "shapes", "kinds", "wrap", "sources", "lockedamount", "wallsamount", "bigsamount", "blocksamount", "difficulty", "difficulty-value", "new", "timer-toggle", "kind-note", "board", "table", "meter", "previous", "next", "today", "level-number", "level-of", "open", "marks", "role", "block", "block-title"];
const els = Object.fromEntries(IDS.map((id) => [id, document.getElementById(id)]));
const language = familyLanguage({ id: "suido", words: WORDS, onChange: () => refresh() });
const say = (key, ...args) => {
  const word = WORDS[language.lang][key];
  return typeof word === "function" ? word(...args) : word;
};
/** The package's own word for a twist: its name, and what it means. */
const twistKey = (twist) => `twist${twist.replace(/(^|-)(\w)/g, (_, __, letter) => letter.toUpperCase())}`;
const twistName = (twist) => suidoSay(language.lang, twistKey(twist));

let board = null;
let mount = null;
let elapsed = 0;
let startedAt = null;
let ticking = null;
let generation = 0;

const clock = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor(ms / 1000) % 60).padStart(2, "0")}`;
const inLevels = () => settings.mode === "levels";
/** Whether the big-pieces levels are the ones being played: a set of sixty-four, each level its own size. */
const big = () => settings.set === "big" && inLevels();
/** What the solved levels and the half-played ones are kept under: a size, or the big-pieces set. */
const setKey = () => (big() ? "big" : settings.size);
const countNow = () => (big() ? SUIDO_BIG_COUNT : SUIDO_LEVEL_COUNTS[settings.size]);
const solvedSet = () => new Set(solved[setKey()] ?? []);
const openNow = () => (big() ? openSuidoBigLevels(solvedSet()) : openSuidoLevels(settings.size, solvedSet()));
const bestKey = () => (inLevels() ? `L|${setKey()}|${level}` : `${settings.size}|${settings.kind}|${settings.wrap ? "w" : "-"}|${settings.sources}|${settings.locked}|${settings.walls}|${settings.bigs}|${settings.blocks}|${board?.difficulty ?? settings.difficulty}`);
const progressKey = () => `${setKey()}/${level}`;

function address() {
  const query = big() ? new URLSearchParams({ mode: "levels", set: "big" }) : new URLSearchParams({ mode: settings.mode, size: settings.size });
  if (inLevels()) query.set("level", String(level));
  else {
    query.set("kind", settings.kind);
    query.set("sources", String(settings.sources));
    query.set("locked", settings.locked);
    query.set("walls", settings.walls);
    query.set("bigs", settings.bigs);
    query.set("blocks", settings.blocks);
    query.set("difficulty", String(settings.difficulty));
    query.set("seed", String(settings.seed));
    query.set("exact", "1");
    if (settings.wrap) query.set("wrap", "1");
  }
  if (settings.timer) query.set("timer", "1");
  const cloth = new URLSearchParams(location.search).get("cloth");
  history.replaceState(history.state, "", `${location.pathname}?${query}${language.asked !== null ? `&lang=${language.lang}` : ""}${cloth !== null ? `&cloth=${cloth}` : ""}`);
}

function keep() {
  write({ mode: settings.mode, set: settings.set, size: settings.size, kind: settings.kind, wrap: settings.wrap, sources: settings.sources, locked: settings.locked, walls: settings.walls, bigs: settings.bigs, blocks: settings.blocks, difficulty: settings.difficulty, timer: settings.timer, reverse: settings.reverse, levels: kept.levels ?? {}, solved, progress, best: kept.best ?? {} });
}

/** Presses the right button of a group of choices and nothing else. */
function press(group, matches) {
  for (const button of group.children) button.setAttribute("aria-pressed", String(matches(button)));
}

/** Makes the buttons of a group of choices, once: their words do not change with the language. */
function seg(parent, items, choose, labelOf, attribute) {
  parent.replaceChildren(
    ...items.map((item) => {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset[attribute] = String(item);
      button.textContent = labelOf(item);
      button.addEventListener("click", () => choose(item));
      return button;
    }),
  );
}

/** The difficulty marks and the lesson of a level, above the board: what only a level has. The twists are the board's own chips. */
function levelInfo() {
  const marks = inLevels() ? (board?.marks ?? 0) : 0;
  els.marks.textContent = marks > 0 ? "●".repeat(marks) + "○".repeat(5 - marks) : "";
  els.marks.setAttribute("aria-label", marks > 0 ? say("marks", marks) : "");
  els.marks.hidden = marks === 0;
  const role = inLevels() ? board?.role : null;
  els.role.textContent = role === null || role === undefined ? "" : say(role.role === "teaches" ? "teaches" : "tests", role.twists.map((twist) => twistName(twist)).join(" · "));
  els.role.dataset.role = role?.role ?? "";
  els.role.title = els.role.textContent;
}

/** What a level in the block's preview is: playing now, solved, open or not open yet. */
function stateOf(each, open) {
  return each === level ? "here" : solvedSet().has(each) ? "solved" : each <= open ? "open" : "locked";
}

/** The sixteen levels of the block this one is in, each drawn small, to choose from. */
function block() {
  if (!inLevels() || rows.length === 0) return;
  const count = countNow();
  const open = openNow();
  const { first, last } = blockRange(blockOf(level), count);
  els["block-title"].textContent = say("blockTitle", blockOf(level), first, last);
  const buttons = [];
  for (let each = first; each <= last; each += 1) {
    const row = rows[each - 1];
    const layout = levelBoard(row);
    const state = stateOf(each, open);
    const done = solvedSet().has(each);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "lv";
    button.dataset.level = String(each);
    button.dataset.state = state;
    button.dataset.solved = String(done);
    button.disabled = state === "locked";
    button.setAttribute("aria-label", say("levelLabel", each, say("states")[state]));
    button.innerHTML = drawSuidoThumb(layout, done ? { masks: levelSolution(row), label: "" } : { water: false, label: "" });
    button.firstElementChild.setAttribute("aria-hidden", "true");
    button.firstElementChild.removeAttribute("role");
    const number = document.createElement("span");
    number.textContent = String(each);
    button.append(number);
    button.addEventListener("click", () => openAny(each));
    buttons.push(button);
  }
  els.block.replaceChildren(...buttons);
  els.block.style.setProperty("--ratio", big() ? "1" : String(layoutRatio()));
}

/** Whether the kind chosen can have big pieces and blocks that turn: only a network can. */
const squares = () => settings.kind === "network";

function layoutRatio() {
  const { width, height } = sizeOf(settings.size);
  return width / height;
}

/** What the page says beside the board: the time and the best time if the timer is on, and which level or board this is. */
function renderMeter() {
  const bits = [];
  if (settings.timer) {
    const best = kept.best?.[bestKey()];
    bits.push(clock(elapsed + (startedAt === null ? 0 : Date.now() - startedAt)));
    if (best !== undefined) bits.push(say("best", clock(best)));
  }
  if (board !== null && big()) {
    bits.push(say("bigLevelMeter", level, settings.size.replace("x", "×"), board.score));
    if (board.pieces !== null && board.pieces !== undefined) bits.push(say("bigInfo", board.pieces.count, Math.round(board.pieces.share * 100)));
  } else if (board !== null) bits.push(inLevels() ? say("levelMeter", level, settings.size.replace("x", "×")) : say("board", settings.size.replace("x", "×"), board.difficulty, settings.seed));
  els.meter.textContent = bits.join(" · ");
}

/** Everything on the page that does not change with a turn: which choices are pressed, the level row, the marks and the block. Called when the board, the mode or the language changes. */
function refresh() {
  language.say();
  for (const group of document.querySelectorAll("[data-for]")) group.hidden = group.dataset.for !== settings.mode;
  // The sizes are the levels by size's own: the big-pieces levels each have a size of their own.
  for (const row of [els["classic-sizes"], els["classic-shapes"]]) row.hidden = big();
  els.today.hidden = big();
  press(els.sets, (button) => button.dataset.set === (big() ? "big" : "classic"));
  for (const group of [els.sizes, els.shapes]) press(group, (button) => button.dataset.size === settings.size);
  press(els.modes, (button) => button.dataset.mode === settings.mode);
  press(els.kinds, (button) => button.dataset.kind === settings.kind);
  press(els.sources, (button) => Number(button.dataset.sources) === settings.sources);
  press(els.lockedamount, (button) => button.dataset.amount === settings.locked);
  press(els.wallsamount, (button) => button.dataset.amount === settings.walls);
  // Big pieces and blocks that turn are a network's: the other kinds have no squares.
  press(els.bigsamount, (button) => button.dataset.amount === (squares() ? settings.bigs : "none"));
  press(els.blocksamount, (button) => button.dataset.amount === (squares() ? settings.blocks : "none"));
  for (const group of [els.bigsamount, els.blocksamount]) for (const button of group.children) button.disabled = !squares();
  els.wrap.setAttribute("aria-pressed", String(settings.wrap && settings.kind !== "inlet-outlet"));
  els.wrap.disabled = settings.kind === "inlet-outlet";
  for (const button of els.sources.children) button.disabled = settings.kind === "inlet-outlet";
  els["timer-toggle"].setAttribute("aria-pressed", String(settings.timer));
  els.difficulty.value = String(settings.difficulty);
  els["difficulty-value"].textContent = `${settings.difficulty} · ${say("levelName", settings.difficulty)}`;
  els["kind-note"].textContent = say(settings.kind === "drains" ? "kindNoteDrains" : settings.kind === "inlet-outlet" ? "kindNotePath" : "kindNoteNetwork");
  const count = countNow();
  const open = openNow();
  els["level-number"].textContent = `${level}`;
  els["level-of"].textContent = ` / ${count}`;
  els.previous.disabled = level <= 1;
  els.next.disabled = level >= open;
  els.open.textContent = say(big() ? "openBig" : "open", open, count);
  levelInfo();
  block();
  renderMeter();
  if (drawnPieces !== language.lang) {
    drawnPieces = language.lang;
    pieces();
  }
}

let drawnPieces = null;

/** One piece of the guide, drawn by the package, with its name and what it does, in the page's language. */
function figureOf(piece, caption) {
  const [name, text] = language.lang === "ja" && PIECES_JA[piece.id] !== undefined ? PIECES_JA[piece.id] : [piece.name, piece.text];
  const figure = document.createElement("figure");
  figure.className = "piece";
  figure.dataset.piece = piece.id;
  figure.style.setProperty("--cells", String(piece.layout.width));
  figure.innerHTML = drawGuidePiece(piece, { label: caption?.name ?? name });
  const words = document.createElement("figcaption");
  const title = document.createElement("strong");
  title.textContent = caption?.name ?? name;
  words.append(title);
  if (caption?.text !== undefined || caption === undefined) {
    const what = document.createElement("span");
    what.className = "what";
    what.textContent = caption?.text ?? text;
    words.append(what);
  }
  figure.append(words);
  return figure;
}

/** The guide: the small pieces by group, the big pieces, and one big piece of each of the 32 families. */
function pieces() {
  els["pieces-small"].replaceChildren(
    ...["turn", "water", "twist", "block"].map((group) => {
      const part = document.createElement("div");
      part.className = "pgroup";
      part.dataset.group = group;
      const title = document.createElement("h3");
      title.textContent = say("pieceGroups")[group];
      const grid = document.createElement("div");
      grid.className = "pgrid";
      grid.append(...SUIDO_PIECE_GUIDE.filter((piece) => piece.group === group).map((piece) => figureOf(piece)));
      part.append(title, grid);
      return part;
    }),
  );
  const bigGrid = document.createElement("div");
  bigGrid.className = "pgrid";
  bigGrid.append(...SUIDO_PIECE_GUIDE.filter((piece) => piece.group === "big").map((piece) => figureOf(piece)));
  els["pieces-big"].replaceChildren(bigGrid);
  const familiesGrid = document.createElement("div");
  familiesGrid.className = "pgrid";
  SUIDO_BIG_FAMILIES_GUIDE.forEach((piece, at) => familiesGrid.append(figureOf(piece, { name: say("family", BIG_FAMILIES[at].family, BIG_FAMILIES[at].shapes), text: undefined })));
  els["pieces-families"].replaceChildren(familiesGrid);
}

function stopTicking() {
  if (ticking !== null) clearInterval(ticking);
  ticking = null;
}

/** A turn starts the clock, if the timer is on; the first one of a game. */
function turned() {
  if (startedAt === null && settings.timer && !mount.flow().solved) startedAt = Date.now();
  if (settings.timer && ticking === null) ticking = setInterval(renderMeter, 500);
}

/** What a mounted board says: remembered if it is a level half played, and a solve opens blocks and fills the block's picture. */
function changed(detail) {
  if (inLevels()) {
    if (detail.solved || detail.turns === 0) delete progress[progressKey()];
    else progress[progressKey()] = detail.progress;
  }
  keep();
}

function solvedNow() {
  if (startedAt !== null) {
    elapsed += Date.now() - startedAt;
    startedAt = null;
    kept.best = { ...(kept.best ?? {}) };
    if (kept.best[bestKey()] === undefined || elapsed < kept.best[bestKey()]) kept.best[bestKey()] = elapsed;
  }
  if (inLevels()) solved = { ...solved, [setKey()]: [...new Set([...(solved[setKey()] ?? []), level])] };
  stopTicking();
  keep();
  refresh();
}

/** A board on the page: from the start, from pieces already turned (`progress`), or open on its answer (`shown`). */
function begin(entry) {
  els.table.style.setProperty("--ratio", String(layoutRatio()));
  elapsed = 0;
  startedAt = null;
  stopTicking();
  if (mount === null) {
    mount = mountSuido(els.board, {
      ...entry,
      hints: true,
      chips: true,
      turning: settings.reverse ? "anticlockwise" : "clockwise",
      onTurn: () => turned(),
      onTurning: (turning) => {
        settings.reverse = turning === "anticlockwise";
        keep();
      },
      onChange: (detail) => changed(detail),
      onSolve: () => solvedNow(),
    });
  } else mount.load(entry);
  refresh();
}

/** Makes the board the settings ask for, after the page has had a moment to say it is doing so. */
function makeBoard(keepSeed = false) {
  if (!keepSeed) {
    settings.seed = Math.floor(Math.random() * 1_000_000_000);
    settings.exact = false;
  }
  const mine = (generation += 1);
  els.board.setAttribute("aria-busy", "true");
  setTimeout(() => {
    if (mine !== generation) return;
    const { width, height } = sizeOf(settings.size);
    const cells = width * height;
    const path = settings.kind === "inlet-outlet";
    const count = (amount) => (SHARE[amount] === 0 ? 0 : Math.max(2, Math.round(cells * SHARE[amount])));
    const pieces = (amount) => (!squares() || SQUARES_SHARE[amount] === 0 ? 0 : Math.max(1, Math.round(cells * SQUARES_SHARE[amount])));
    // An address that names the board's own seed (`exact`) asks for that very board, not another near its difficulty.
    const made = makeSuido({ width, height, kind: settings.kind, wrap: path ? false : settings.wrap, sources: path ? 1 : settings.sources, locked: count(settings.locked), walls: count(settings.walls), bigs: pieces(settings.bigs), blocks: pieces(settings.blocks), difficulty: settings.exact ? undefined : settings.difficulty, seed: settings.seed });
    settings.exact = false;
    settings.seed = made.seed;
    board = { code: made.code, twists: twistsOf(made.layout), difficulty: made.difficulty, marks: 0, role: null };
    address();
    keep();
    begin({ code: made.code, answer: made.answer });
  }, 20);
}

/** Opens a level of a size, loading the size's levels if they are not loaded: `wanted` null is the level to go on with. */
async function openLevel(size, wanted, any = false) {
  settings.mode = "levels";
  settings.set = "classic";
  settings.size = size;
  const mine = (generation += 1);
  els.board.setAttribute("aria-busy", "true");
  rows = await loadSuidoLevels(size);
  if (mine !== generation) return;
  const count = SUIDO_LEVEL_COUNTS[size];
  const open = openSuidoLevels(size, solvedSet());
  // A level named in the address opens, open or not, as a link to one does; otherwise only the open levels.
  const linked = wanted === null && params.has("level") && params.has("mode");
  const asked = wanted ?? (linked ? Number(params.get("level")) : (kept.levels?.[size] ?? nextSuidoLevel(size, solvedSet())));
  level = Math.min(Math.max(1, Number.isInteger(asked) ? asked : 1), linked || any ? count : open);
  params.delete("level");
  kept.levels = { ...(kept.levels ?? {}), [size]: level };
  const row = rows[level - 1];
  board = { code: row[0], twists: declaredTwists(row), difficulty: 0, marks: suidoMarks(size, level), role: suidoRole(size, level) };
  address();
  keep();
  const done = solvedSet().has(level);
  const saved = progress[progressKey()];
  begin({ code: row[0], answer: levelAnswer(row), shown: done, progress: done ? undefined : saved });
}

/** Opens a level of the big-pieces set: its size is its own, so the level decides the board. */
async function openBigLevel(wanted, any = false) {
  settings.mode = "levels";
  settings.set = "big";
  const mine = (generation += 1);
  els.board.setAttribute("aria-busy", "true");
  rows = await loadSuidoBigLevels();
  if (mine !== generation) return;
  const open = openSuidoBigLevels(solvedSet());
  const linked = wanted === null && params.has("level") && (params.has("mode") || params.has("set"));
  const asked = wanted ?? (linked ? Number(params.get("level")) : (kept.levels?.big ?? nextSuidoBigLevel(solvedSet())));
  level = Math.min(Math.max(1, Number.isInteger(asked) ? asked : 1), linked || any ? SUIDO_BIG_COUNT : open);
  params.delete("level");
  kept.levels = { ...(kept.levels ?? {}), big: level };
  settings.size = suidoBigSize(level);
  const row = rows[level - 1];
  board = { code: row[0], twists: declaredTwists(row), difficulty: 0, marks: suidoBigMarks(level), role: suidoBigRole(level), score: suidoBigScore(level), pieces: suidoBigPieces(level) };
  address();
  keep();
  const done = solvedSet().has(level);
  const saved = progress[progressKey()];
  begin({ code: row[0], answer: levelAnswer(row), shown: done, progress: done ? undefined : saved });
}

/** Opens a level of whichever set is being played. */
const openAny = (wanted, any = false) => (settings.set === "big" ? openBigLevel(wanted, any) : openLevel(settings.size, wanted, any));

function chooseSize(size) {
  if (inLevels()) openLevel(size, null);
  else {
    settings.size = size;
    makeBoard();
  }
}

function setMode(mode) {
  if (settings.mode === mode) return;
  settings.mode = mode;
  stopTicking();
  refresh();
  if (mode === "levels") openAny(null);
  else makeBoard();
}

/** Gives the buttons the page was written with their handlers: their words come from the page's `data-say`. */
function choices(parent, attribute, choose) {
  parent.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (button === null || button.disabled) return;
    choose(button.dataset[attribute]);
  });
}
choices(els.modes, "mode", (mode) => setMode(mode));
choices(els.sets, "set", (set) => {
  if (settings.set === set && inLevels()) return;
  settings.set = set;
  stopTicking();
  openAny(null);
});
choices(els.kinds, "kind", (kind) => {
  settings.kind = kind;
  makeBoard();
});
choices(els.lockedamount, "amount", (amount) => {
  settings.locked = amount;
  makeBoard();
});
choices(els.wallsamount, "amount", (amount) => {
  settings.walls = amount;
  makeBoard();
});
choices(els.bigsamount, "amount", (amount) => {
  settings.bigs = amount;
  makeBoard();
});
choices(els.blocksamount, "amount", (amount) => {
  settings.blocks = amount;
  makeBoard();
});
seg(els.sizes, SQUARES, (size) => chooseSize(size), (size) => size.replace("x", "×"), "size");
seg(els.shapes, SHAPES, (size) => chooseSize(size), (size) => size.replace("x", "×"), "size");
els.sources.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (button === null || button.disabled) return;
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
els.previous.addEventListener("click", () => openAny(level - 1));
els.next.addEventListener("click", () => openAny(level + 1));
// Today's level at this size: the same board for everybody, open or not, as a level named in the address is.
els.today.addEventListener("click", () => openLevel(settings.size, dailySuidoLevel(settings.size, new Date()), true));
els["timer-toggle"].addEventListener("click", () => {
  settings.timer = !settings.timer;
  if (!settings.timer) {
    stopTicking();
    startedAt = null;
  }
  address();
  keep();
  refresh();
});

refresh();
if (inLevels()) void openAny(null);
else makeBoard(true);
