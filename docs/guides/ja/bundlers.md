---
title: Vite と webpack
section: how-to
order: 13
description: Vite や webpack のプロジェクトに、パッケージを入れて盤の要素を読み込みます。
---

まずインストールします。

```sh
npm install @johnmorrisdotca/suido
# or: pnpm add @johnmorrisdotca/suido
# or: yarn add @johnmorrisdotca/suido
```

すべて ES モジュールで、入口ごとに分かれているので、バンドラーは読み込んだ分だけを残します。`@johnmorrisdotca/suido/element/define` を読み込むと `<suido-board>` のタグが1度だけ登録されます。

## Vite

ページです。

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Suido with Vite</title>
  </head>
  <body>
    <suido-board grid="7x7" level="12" hints></suido-board>
    <script type="module" src="./main.ts"></script>
  </body>
</html>
```

スクリプトです。Vite は設定なしでこの入口をビルドできます。

```ts no-check
import "@johnmorrisdotca/suido/element/define";

const board = document.querySelector("suido-board")!;
board.addEventListener("suido-solve", (event) => console.log((event as CustomEvent).detail.code));
```

## webpack

入口です。タグを DOM で作るので、HTML は要りません。

```js no-check
import "@johnmorrisdotca/suido/element/define";

const board = document.createElement("suido-board");
board.setAttribute("grid", "7x7");
board.setAttribute("level", "12");
board.setAttribute("hints", "");
document.body.append(board);
```

設定です（webpack 5 は、パッケージの `exports` をそのまま読みます）。

```js no-check
import { fileURLToPath } from "node:url";

export default {
  mode: "production",
  entry: "./src/index.js",
  output: { path: fileURLToPath(new URL("./dist", import.meta.url)), filename: "main.js" },
};
```
