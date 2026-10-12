---
title: "問題の生成と検証"
section: how-to
order: 5
description: "再現できる種を使い、証明と探索打切りを区別します。"
---

## 再現できる問題を作る

```ts no-run
import {makeSuido,checkSuidoAnswer,solve} from "@johnmorrisdotca/suido";
const made = makeSuido({size:5,seed:42,kind:"network",difficulty:50,attempts:3});
const proof = solve(made.layout,2,20000);
console.log(made.seed,made.difficulty,checkSuidoAnswer(made.code,made.answer));
console.log(proof.complete && proof.count===1);
```

生成は同期処理で、大きな盤面や端がつながる盤面では待ち時間が生じます。入力への応答を保つ必要があれば Worker を使います。難度指定は試行回数の範囲で近い候補を選び、指定値との完全一致は保証しません。選ばれた候補を再現するには、返された種と同じオプション、バージョンを保存します。

## 探索結果を区別する

`solve` は `count` と `complete` を返します。予算を使い切って一つ見つかっただけでは、一意性の証明にはなりません。上限を 2 にして `complete && count === 1` を確認します。`countSolutions` は数だけを返すため、証明の判断には詳しい結果を使います。`checkSuidoAnswer` は与えた解答を検証しますが、一意性は証明しません。

固定ピース、壁、端の接続、大きなピース、一括回転は盤面の規則です。高価な設定を選ぶ前に[生成時間](../../GENERATOR.md)、[追加規則](../../TWISTS.md)、[難度](../../DIFFICULTY.md)を確認してください。
