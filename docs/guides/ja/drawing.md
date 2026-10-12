---
title: "盤面とパイプの描画"
section: how-to
order: 4
description: "ゲームを設置せずに SVG を描きます。"
---

## SVG 画像を作る

```ts
import {decodeLayout} from "@johnmorrisdotca/suido";
import {drawSuidoThumb,drawPiece} from "@johnmorrisdotca/suido/draw";
import {SUIDO_5X5} from "@johnmorrisdotca/suido/levels-5x5";
console.log(drawSuidoThumb(decodeLayout(SUIDO_5X5[0][0])!,{label:"最初の問題"}).startsWith("<svg"));
console.log(drawPiece(3,{label:"曲がり管"}).startsWith("<svg"));
```

描画関数は SVG 文字列を返します。操作ボタンを設置したり、ゲームを始めたりはしません。意味のある画像には読み上げ用のラベルを付けます。全体の盤面は `drawSuido`、小さな画像は `drawSuidoThumb`、ピースの説明図は `drawGuidePiece` を使います。スタイルは標準で含まれ、多数の盤面では共通のスタイルを一度だけ用意できます。

## 遊べる盤面を更新する

`paintSuido` は標準 SVG に向き、回転数、水を反映します。別の構造の SVG には使えません。キーボード操作、ヒント、ボタン、後片付けには [mountSuido](api:mountSuido) を使います。拡大の計算は盤面の描画単位です。DOM の操作を付ける `attachSuidoView` は、撤去時に破棄してください。

[描画の詳細](../../drawing.md)、[ピースの形](../../PIECES.md)、[埋め込み](embeds.md)も参照してください。
