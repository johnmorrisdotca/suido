---
title: TypeScript と Node
section: how-to
order: 15
description: パッケージの型を使い、DOM のないサーバーでルールを動かします。
---

パッケージには、入口ごとの型が付いています。ルールは文字列と数を扱うふつうの関数なので、Node・Deno・Bun・ワーカー・ブラウザーのどれでも同じ呼び出しが同じ答えを返します。このファイルは型を検査してから、型を取り除く Node 22.18 以降で動かしています。

```ts
import { checkSuidoAnswer, type SuidoCheck } from "@johnmorrisdotca/suido";
import { levelAnswer, loadSuidoLevels } from "@johnmorrisdotca/suido/levels";

const rows = await loadSuidoLevels("7x7");
const row = rows[11]!; // level 12
const check: SuidoCheck = checkSuidoAnswer(row[0], levelAnswer(row)!);
console.log(check.ok, rows.length);

// @ts-expect-error a list of levels is not a board
const wrong: string = rows;
console.log(typeof wrong);
```

`@ts-expect-error` は、間違った型をコンパイラーが断ることを示すためにあります。

## サーバーで

サーバーに DOM は要りません。プレイヤーが送ってきたものを、同じルールで確かめます。

```mjs
// A server checks an answer with the same rules the board plays by: pure functions, no DOM, no browser globals.
import { checkSuidoAnswer } from "@johnmorrisdotca/suido";
import { dailySuidoLevel, levelAnswer, loadSuidoLevels } from "@johnmorrisdotca/suido/levels";

const rows = await loadSuidoLevels("7x7");
const today = dailySuidoLevel("7x7", new Date()); // the level of the day at 7×7: 1 to 256
const row = rows[today - 1]; // send row[0], the board, to the browser; keep the answer
console.log(checkSuidoAnswer(row[0], levelAnswer(row)), rows.length); // { ok: true } 256
```

ページに盤を載せる方法は [はじめに](getting-started.md) にあります。
