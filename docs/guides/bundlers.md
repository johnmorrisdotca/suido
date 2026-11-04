---
title: Vite and webpack
section: how-to
order: 13
description: Install the package and import the board element in a Vite or webpack project.
---

Install it.

```sh
npm install @johnmorrisdotca/suido
# or: pnpm add @johnmorrisdotca/suido
# or: yarn add @johnmorrisdotca/suido
```

Everything is an ES module with its own entry point, so a bundler keeps only what you import. `@johnmorrisdotca/suido/element/define` registers the `<suido-board>` tag once.

## Vite

The page.

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

The script. Vite builds this entry with no configuration.

```ts no-check
import "@johnmorrisdotca/suido/element/define";

const board = document.querySelector("suido-board")!;
board.addEventListener("suido-solve", (event) => console.log((event as CustomEvent).detail.code));
```

## webpack

The entry. It makes the tag with the DOM, so no HTML is needed.

```js no-check
import "@johnmorrisdotca/suido/element/define";

const board = document.createElement("suido-board");
board.setAttribute("grid", "7x7");
board.setAttribute("level", "12");
board.setAttribute("hints", "");
document.body.append(board);
```

The configuration (webpack 5 reads the package's `exports` with no help).

```js no-check
import { fileURLToPath } from "node:url";

export default {
  mode: "production",
  entry: "./src/index.js",
  output: { path: fileURLToPath(new URL("./dist", import.meta.url)), filename: "main.js" },
};
```
