/**
 * THE WORDS A SUIDO BOARD SAYS, in English and Japanese: what a screen reader
 * hears of each cell, the buttons and the lines of words under a playable
 * board, and what each twist means. Plain data, so a page can read them,
 * replace a few or add a language of its own beside these two.
 *
 * `{name}` in a line is a value filled in; a line `foo` that has a `fooOne`
 * beside it is said as `fooOne` when its `{n}` is 1.
 */
export type SuidoLanguage = "en" | "ja";

export const SUIDO_STRINGS: Record<SuidoLanguage, Record<string, string>> = {
  en: {
    board: "Suido board, {width} by {height}",
    restart: "Start over",
    hint: "Hint",
    turningClockwise: "Turning ↻ clockwise",
    turningAnticlockwise: "Turning ↺ anticlockwise",
    progressNetwork: "The water reaches {wet} of {of} pieces",
    progressDrains: "The water reaches {wet} of {of} drains",
    progressPath: "The water has run through {wet} pieces",
    progressPathNone: "The water has not left the inlet",
    leaks: "{n} open ends",
    leaksOne: "{n} open end",
    leaksNone: "no leaks",
    solved: "Solved in {n} turns. Every pipe is joined and nothing is left open.",
    solvedOne: "Solved in {n} turn. Every pipe is joined and nothing is left open.",
    solvedDrains: "Solved in {n} turns. The water reaches every drain and nothing is left open.",
    solvedDrainsOne: "Solved in {n} turn. The water reaches every drain and nothing is left open.",
    solvedPath: "Solved in {n} turns. The water runs from the inlet to the outlet in one path.",
    solvedPathOne: "Solved in {n} turn. The water runs from the inlet to the outlet in one path.",
    solvedBefore: "Solved before: the answer is shown. Start over to play it again.",
    turns: "{n} turns",
    turnsOne: "{n} turn",
    par: "par {n}",
    hints: "{n} hints",
    hintsOne: "{n} hint",
    hinted: "Try turning the piece that is lit.",
    noHint: "Every piece the water needs already faces the right way.",
    shapeBlank: "bare ground",
    shapeEnd: "end",
    shapeStraight: "straight",
    shapeElbow: "elbow",
    shapeTee: "T piece",
    shapeCross: "cross",
    cell: "Row {row}, column {col}: {what}",
    cellPump: "pump",
    cellDrain: "drain",
    cellLocked: "locked",
    cellWet: "wet",
    plain: "Plain",
    plainSays: "One pump, and every piece of pipe must carry water.",
    twistDrains: "Drains",
    twistDrainsSays: "Reach every drain. Pieces the water does not need may stay dry, facing any way.",
    twistPumps: "Pumps",
    twistPumpsSays: "More than one pump, each feeding its own pipes.",
    twistLocked: "Locked pieces",
    twistLockedSays: "A piece with a padlock cannot be turned. It already faces the right way, so build from it.",
    twistWalls: "Walls",
    twistWallsSays: "Water cannot cross a wall: a pipe open towards one runs out.",
    twistWrap: "Edges join",
    twistWrapSays: "The edges of the board join: water leaving the right side comes in at the left, and the bottom at the top.",
    twistInletOutlet: "Inlet to outlet",
    twistInletOutletSays: "Water comes in at the top left and must leave at the bottom right, in one path with no branches. The other pieces are decoys and stay dry.",
  },
  ja: {
    board: "水道の盤、{width}×{height}",
    restart: "最初から",
    hint: "ヒント",
    turningClockwise: "右回り ↻ に回す",
    turningAnticlockwise: "左回り ↺ に回す",
    progressNetwork: "{of}個中{wet}個のパイプに水が届いています",
    progressDrains: "{of}か所中{wet}か所の排水口に水が届いています",
    progressPath: "水は{wet}個の駒を通りました",
    progressPathNone: "水はまだ入口から出ていません",
    leaks: "開いた端 {n}か所",
    leaksNone: "漏れなし",
    solved: "解けました。{n}回で、すべてのパイプがつながり、開いた端もありません。",
    solvedDrains: "解けました。{n}回で、すべての排水口に水が届き、開いた端もありません。",
    solvedPath: "解けました。{n}回で、水が入口から出口まで一本の道で流れます。",
    solvedBefore: "解いたことがあるので、答えを出しています。もう一度遊ぶには「最初から」を押してください。",
    turns: "{n}回",
    par: "最短 {n}回",
    hints: "ヒント{n}回",
    hinted: "光っている駒を回してみましょう。",
    noHint: "水が通る駒は、すべて正しい向きです。",
    shapeBlank: "空き地",
    shapeEnd: "行き止まり",
    shapeStraight: "直線",
    shapeElbow: "曲がり",
    shapeTee: "T字",
    shapeCross: "十字",
    cell: "{row}行{col}列：{what}",
    cellPump: "ポンプ",
    cellDrain: "排水口",
    cellLocked: "固定",
    cellWet: "水あり",
    plain: "ふつう",
    plainSays: "ポンプは1つ。すべてのパイプに水を通します。",
    twistDrains: "排水口",
    twistDrainsSays: "すべての排水口に水を届けます。水がいらない駒は、乾いたままで、どの向きでもかまいません。",
    twistPumps: "ポンプ複数",
    twistPumpsSays: "ポンプが2つ以上あり、それぞれが自分のパイプに水を流します。",
    twistLocked: "固定駒",
    twistLockedSays: "鍵のついた駒は回せません。向きは最初から正しいので、ここから組み立てましょう。",
    twistWalls: "壁",
    twistWallsSays: "水は壁を通れません。壁に向かって開いたパイプからは水が漏れます。",
    twistWrap: "端がつながる",
    twistWrapSays: "盤の端がつながっています。右へ出た水は左から、下へ出た水は上から入ります。",
    twistInletOutlet: "入口から出口へ",
    twistInletOutletSays: "左上の入口から入った水を、右下の出口まで、枝分かれのない一本の道で通します。ほかの駒はおとりで、乾いたままです。",
  },
};

/** A line in a language, with its values filled in; the line itself if there is none by that name. */
export function suidoSay(language: SuidoLanguage, key: string, values: Record<string, string | number> = {}): string {
  const table = SUIDO_STRINGS[language] ?? SUIDO_STRINGS.en;
  const one = values.n === 1 ? table[`${key}One`] : undefined;
  const line = one ?? table[key] ?? SUIDO_STRINGS.en[key] ?? key;
  return line.replace(/\{(\w+)\}/g, (whole, name: string) => (name in values ? String(values[name]) : whole));
}

/** The language a piece of text is in: Japanese for anything starting `ja`, English for everything else. */
export function suidoLanguageOf(tag: string | null | undefined): SuidoLanguage {
  return typeof tag === "string" && tag.toLowerCase().startsWith("ja") ? "ja" : "en";
}
