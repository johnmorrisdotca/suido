---
title: "Draw boards and pipe pieces"
section: how-to
order: 4
description: "Render SVG without mounting a game."
---

## Make an SVG image

```ts
import {decodeLayout} from "@johnmorrisdotca/suido";
import {drawSuidoThumb,drawPiece} from "@johnmorrisdotca/suido/draw";
import {SUIDO_5X5} from "@johnmorrisdotca/suido/levels-5x5";
console.log(drawSuidoThumb(decodeLayout(SUIDO_5X5[0][0])!,{label:"First puzzle"}).startsWith("<svg"));
console.log(drawPiece(3,{label:"Elbow"}).startsWith("<svg"));
```

Drawing returns SVG text; it does not install controls or begin play. Supply a spoken label for an image that carries meaning. Use `drawSuido` for the full board, `drawSuidoThumb` for a compact image, and `drawGuidePiece` for the shipped piece lessons. Styles are included by default; shared styles can be supplied once when drawing many boards.

## Update a live board

`paintSuido` writes new masks, quarter turns and water onto an existing native SVG. It expects that drawing's structure; arbitrary host SVG is not interchangeable. For keyboard input, hints, controls and cleanup, use [mountSuido](api:mountSuido) rather than rebuilding interactive markup yourself. Zoom arithmetic uses board units; `attachSuidoView` adds DOM interactions and must be destroyed when removed.

See [drawing details](../drawing.md), [piece shapes](../PIECES.md) and [native embeds](embeds.md).
