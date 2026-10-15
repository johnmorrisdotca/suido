---
title: "はじめに"
section: tutorial
order: 1
description: "固定問題を読み、パイプを回し、解答を検証します。"
---

## 固定問題を読む

npmで`@johnmorrisdotca/suido`をインストールします。主入口には盤面の純粋な規則があり、サイズ別の入口にはそのサイズの問題だけが入っています。最初は新しく生成せず、同梱の問題を使います。

```ts
import {decodeLayout, newGame, turnAt, flowOfGame, checkSuidoAnswer} from "@johnmorrisdotca/suido";
import {levelAnswer} from "@johnmorrisdotca/suido/levels-info";
import {SUIDO_5X5} from "@johnmorrisdotca/suido/levels-5x5";
const row = SUIDO_5X5[0];
const layout = decodeLayout(row[0])!;
const game = turnAt(newGame(row[0])!,0);
console.log(layout.width,layout.height,game.turns,flowOfGame(game).solved);
console.log(checkSuidoAnswer(row[0],levelAnswer(row)!));
```

この例の非null表明は、検証済みの同梱問題に対するものです。外部から受け取ったコードは検証し、`null`を確認してください。一手ごとに新しいゲーム状態を返します。水の状態は進捗を表し、`solved`はその盤面の規則で判定します。

## ページに置く

遊べる盤面には[標準要素](embeds.md)、画像には[SVG描画](drawing.md)を使います。[問題のガイド](levels.md)では必要なサイズだけの読み込みと日替わり問題を説明しています。[主入口のリファレンス](entry:main)には各公開関数の独立した例があります。
