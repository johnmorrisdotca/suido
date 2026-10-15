---
title: "進捗の保存と復元"
section: how-to
order: 3
description: "元の問題コードと進捗を組にして保存します。"
---

## 必要なときに保存する

```ts
import {newGame,turnAt,gameProgress,gameFromProgress,gameCode} from "@johnmorrisdotca/suido";
import {SUIDO_5X5} from "@johnmorrisdotca/suido/levels-5x5";
const code = SUIDO_5X5[0][0];
const game = turnAt(newGame(code)!,0);
const kept = gameProgress(game);
const restored = gameFromProgress(code,kept);
console.log(restored?.turns,restored && gameCode(restored)===gameCode(game));
```

元の問題コードと進捗を一緒に保存します。進捗の形式は手数と向きを保持します。`gameCode`は現在の盤面を表し、手数は保持しません。`gameFromCode`は合法な向きを復元し、`turns`を0にします。どちらも互換性のない入力には`null`を返します。

## 保存はホスト側で決める

SDKは文字列を返します。ダウンロードや保存を提供するかはホスト側で決めます。iframeは保存しません。要素の`progress`は現在の進捗を読み、代入すると保存済みの文字列を復元します。`suido-change`で更新を受け取れます。コールバックの変更だけでゲームを作り直さないようにしてください。

ヒントには、その問題に対応する正しい解答が必要です。数だけで完成を判断せず、[水の流れと検証](rules.md)、[イベントの仕様](../../embeds.md)を確認してください。
