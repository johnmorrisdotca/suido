---
title: "困ったとき・よくある質問"
section: troubleshooting
order: 9
description: "null、読込順序、復元できない状態を説明します。"
---

## 読み取りや復元がnullになった

`decodeLayout`は不正な寸法、未知の管の文字、水源の欠落、水源や排水口の不正な位置を拒否します。`newGame`も同じ検証をします。`gameFromProgress`は進捗がその盤面のものか確認し、`gameFromCode`は形、固定マス、端点、一括回転の整合性が変わったものを拒否します。進捗と元のコードを一緒に保存してください。行のコードや回転の数字を読めない場合、`levelSolution`と`levelAnswer`は`null`です。

## 問題の情報がnullになった

未知の問題にはサイズ、得点、難度の印、ピース数がありません。導入・確認の役割がない問題もあります。`firstUnsolvedLevel`の`null`は渡した問題集が解答済みという意味です。`hintFor`の`null`は解答の向きに直す管が残っていないことを示します。形や回転が合わなければ`quartersBetween`、`tapsBetween`、`blockQuartersBetween`は`null`です。未知の説明図や形のIDは`undefined`です。

## 読込と探索

`suidoLevelsOf`の前にサイズを、`suidoBigLevelsLoaded`の前に専用問題集を読みます。未読込なら例外です。不正な日付も翌月へ補正せず例外になります。探索の予算が足りなければ`complete`を確認し、必要に応じて増やします。一つ見つかっただけでは証明になりません。

設置が`null`なら、盤面と対応する解答・進捗を確認します。画像だけで操作できないときは`/play`を使います。問題の`grid`と表示の`size`は用途が違います。[埋め込み](embeds.md)と[全仕様](../../embeds.md)を参照してください。
