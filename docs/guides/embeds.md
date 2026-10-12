---
title: "Embed a native board"
section: how-to
order: 6
description: "Mount or register the board and handle its native events."
---

## Use the element or builder

The [builder](https://johnmorrisdotca.github.io/suido/builder.html) previews a fixed or daily board and provides element, iframe, module and framework snippets. With a bundler, import `@johnmorrisdotca/suido/element/define`, then place `<suido-board grid="7x7" level="12" hints></suido-board>` in the page.

`grid` chooses puzzle dimensions. `size="small|medium|large"` chooses display width; the old `size="7x7"` remains a grid alias. `daily="today"` resolves the UTC day when rendered, with no rollover timer. A custom `code` takes precedence over daily selection. Theme, width and spoken label belong to the host's display choices.

## Mount and clean up

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

`mountSuido` returns `null` on invalid setup. Destroy a mounted board when the host removes it. The element's callbacks live on `options`; native change/turn/hint/solve events bubble across shadow boundaries. For iframe messages, check both origin and the sending window before reading detail. The iframe has no storage. The [full embed contract](../embeds.md) lists attributes, properties, load/error events and validated URL parameters.
