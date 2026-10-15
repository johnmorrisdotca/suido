---
title: "固定問題と日替わり問題"
section: how-to
order: 2
description: "必要なサイズだけを読み、UTCの日替わり問題を選びます。"
---

## 読む前に読み込む

```ts
import {loadSuidoLevels,suidoLevelsOf,dailySuidoLevel,firstUnsolvedSuidoLevel} from "@johnmorrisdotca/suido/levels";
await loadSuidoLevels("5x5");
const daily = dailySuidoLevel("5x5","2026-10-12")!;
console.log(daily,suidoLevelsOf("5x5")[daily-1][0]);
console.log(firstUnsolvedSuidoLevel("5x5",new Set([1,2])));
```

読み込んだサイズは再利用されます。未読込のサイズに`suidoLevelsOf`を呼ぶと例外になります。`/levels-5x5`の直接インポートにはローダーが不要です。`/levels-info`は盤面を読み込まず、問題数、ブロック、難度の印、日替わり番号を扱います。`/levels`を使うと、バンドラーから各サイズのデータに到達できます。

## 番号を区別する

公開の問題番号は1から、配列の位置とブロック番号は0からです。ブロックは16問ずつで、渡した解答済み番号の集合に応じて開きます。すべて解けていれば`firstUnsolvedSuidoLevel`は`null`です。大きなピースの問題集は別の64問で、専用のローダーと情報があります。

## 日を選ぶ

日付は実在する`YYYY-MM-DD`、またはUTCで扱う`Date`です。同じ日とサイズなら、開いているブロックに関係なく同じ問題になります。未知のサイズは`null`、不正な日付は例外です。[問題の詳しい規則](../../LEVELS.md)と[dailySuidoLevel](api:dailySuidoLevel)を参照してください。
