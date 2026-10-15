---
title: "標準盤面の埋め込み"
section: how-to
order: 6
description: "盤面を設置し、標準イベントを受け取ります。"
---

## 要素とビルダー

[ビルダー](https://johnmorrisdotca.github.io/suido/builder.html)で固定問題や日替わり問題を確認し、要素、iframe、モジュール、各フレームワークの例をコピーできます。バンドラーでは`@johnmorrisdotca/suido/element/define`を読み、`<suido-board grid="7x7" level="12" hints></suido-board>`を置きます。

`grid`は問題の寸法、`size="small|medium|large"`は表示幅です。従来の`size="7x7"`も寸法の別名として使えます。`daily="today"`は描画時のUTC日付を使い、日付変更のタイマーはありません。独自の`code`があれば日替わり指定より優先します。テーマ、幅、読み上げラベルはホスト側で選びます。

## 設置と後片付け

```ts no-run
import {mountSuido} from "@johnmorrisdotca/suido/play";
import {SUIDO_5X5} from "@johnmorrisdotca/suido/levels-5x5";
import {levelAnswer} from "@johnmorrisdotca/suido/levels-info";
const row = SUIDO_5X5[0];
const host = document.createElement("div");
document.body.append(host);
const board = mountSuido(host,{code:row[0],answer:levelAnswer(row)!,controls:true,onChange:detail=>console.log(detail.turns)});
console.log(board?.progress());
board?.destroy();
```

不正な設定には`mountSuido`が`null`を返します。ホストを取り除くときは盤面を破棄します。要素のコールバックは`options`で設定し、操作イベントはShadow DOMの境界を越えて伝わります。iframeのメッセージでは、送信元のoriginとwindowの両方を確認します。iframeは保存しません。[埋め込みの全仕様](../../embeds.md)に属性、プロパティ、読込・エラーイベント、URLパラメーターがあります。
