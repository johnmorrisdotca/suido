# Suido's words, in English and Japanese

Made from `src/strings.ts` by `pnpm docs:make`; a test fails if the two differ, so this list is never out of date.

**The Japanese has not yet been reviewed by a native reader.** If a line reads wrongly or unnaturally, please
open a *Fix a translation* issue with the string's name. `{name}` and the other braces are filled in when shown. A line
with `One` at the end of its name is the singular, said in English when the count is 1.

| Name | English | Japanese |
| --- | --- | --- |
| `board` | Suido board, {width} by {height} | 水道の盤、{width}×{height} |
| `restart` | Start over | 最初から |
| `hint` | Hint | ヒント |
| `turningClockwise` | Turning ↻ clockwise | 右回り ↻ に回す |
| `turningAnticlockwise` | Turning ↺ anticlockwise | 左回り ↺ に回す |
| `progressNetwork` | The water reaches {wet} of {of} pieces | {of}個中{wet}個のパイプに水が届いています |
| `progressDrains` | The water reaches {wet} of {of} drains | {of}か所中{wet}か所の排水口に水が届いています |
| `progressPath` | The water has run through {wet} pieces | 水は{wet}個の駒を通りました |
| `progressPathNone` | The water has not left the inlet | 水はまだ入口から出ていません |
| `leaks` | {n} open ends | 開いた端 {n}か所 |
| `leaksNone` | no leaks | 漏れなし |
| `solved` | Solved in {n} turns. Every pipe is joined and nothing is left open. | 解けました。{n}回で、すべてのパイプがつながり、開いた端もありません。 |
| `solvedDrains` | Solved in {n} turns. The water reaches every drain and nothing is left open. | 解けました。{n}回で、すべての排水口に水が届き、開いた端もありません。 |
| `solvedPath` | Solved in {n} turns. The water runs from the inlet to the outlet in one path. | 解けました。{n}回で、水が入口から出口まで一本の道で流れます。 |
| `solvedBefore` | Solved before: the answer is shown. Start over to play it again. | 解いたことがあるので、答えを出しています。もう一度遊ぶには「最初から」を押してください。 |
| `turns` | {n} turns | {n}回 |
| `par` | par {n} | 最短 {n}回 |
| `hints` | {n} hints | ヒント{n}回 |
| `zoomLabel` | Zoom the board | 盤を拡大・縮小 |
| `zoomOut` | Zoom out − | 縮小 − |
| `zoomIn` | Zoom in + | 拡大 + |
| `zoomFit` | Whole board | 全体 |
| `hinted` | Try turning the piece that is lit. | 光っている駒を回してみましょう。 |
| `noHint` | Every piece the water needs already faces the right way. | 水が通る駒は、すべて正しい向きです。 |
| `shapeBlank` | bare ground | 空き地 |
| `shapeEnd` | end | 行き止まり |
| `shapeStraight` | straight | 直線 |
| `shapeElbow` | elbow | 曲がり |
| `shapeTee` | T piece | T字 |
| `shapeCross` | cross | 十字 |
| `cell` | Row {row}, column {col}: {what} | {row}行{col}列：{what} |
| `cellPump` | pump | ポンプ |
| `cellDrain` | drain | 排水口 |
| `cellLocked` | locked | 固定 |
| `cellBig` | part of a big piece | 大きな駒の一部 |
| `cellBlock` | turns with its block | ブロックといっしょに回る |
| `cellWet` | wet | 水あり |
| `plain` | Plain | ふつう |
| `plainSays` | One pump, and every piece of pipe must carry water. | ポンプは1つ。すべてのパイプに水を通します。 |
| `twistDrains` | Drains | 排水口 |
| `twistDrainsSays` | Reach every drain. Pieces the water does not need may stay dry, facing any way. | すべての排水口に水を届けます。水がいらない駒は、乾いたままで、どの向きでもかまいません。 |
| `twistPumps` | Pumps | ポンプ複数 |
| `twistPumpsSays` | More than one pump, each feeding its own pipes. | ポンプが2つ以上あり、それぞれが自分のパイプに水を流します。 |
| `twistLocked` | Locked pieces | 固定駒 |
| `twistLockedSays` | A piece with a padlock cannot be turned. It already faces the right way, so build from it. | 鍵のついた駒は回せません。向きは最初から正しいので、ここから組み立てましょう。 |
| `twistWalls` | Walls | 壁 |
| `twistWallsSays` | Water cannot cross a wall: a pipe open towards one runs out. | 水は壁を通れません。壁に向かって開いたパイプからは水が漏れます。 |
| `twistWrap` | Edges join | 端がつながる |
| `twistWrapSays` | The edges of the board join: water leaving the right side comes in at the left, and the bottom at the top. | 盤の端がつながっています。右へ出た水は左から、下へ出た水は上から入ります。 |
| `twistInletOutlet` | Inlet to outlet | 入口から出口へ |
| `twistInletOutletSays` | Water comes in at the top left and must leave at the bottom right, in one path with no branches. The other pieces are decoys and stay dry. | 左上の入口から入った水を、右下の出口まで、枝分かれのない一本の道で通します。ほかの駒はおとりで、乾いたままです。 |
| `twistBigPieces` | Big pieces | 大きな駒 |
| `twistBigPiecesSays` | A big piece fills four squares and has up to eight openings. One tap turns the whole piece a quarter, where it stands. | 大きな駒は4マスを使い、最大8か所に開口部があります。1回タップすると、その場で駒全体が4分の1回ります。 |
| `twistBlockTurns` | Block turns | ブロック回転 |
| `twistBlockTurnsSays` | Where four pieces are ringed by a dashed line, a tap on the ring in the middle turns all four together: each moves round to the next place as it turns. They cannot be turned on their own. | 点線で囲まれた4つの駒は、真ん中の輪をタップすると4つがいっしょに回り、それぞれが次の場所へ動きながら向きも変わります。1つだけ回すことはできません。 |
