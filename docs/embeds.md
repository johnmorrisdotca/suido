# Embed a fixed or daily pipe puzzle

[Open the builder](https://johnmorrisdotca.github.io/suido/builder.html) to preview every display and play option and copy an element, iframe, module, React 19, Vue, Svelte, Angular, plain HTML block or iframe URL. Its npm pin follows package.json's major. Its link contains the setup, and its iframe stores nothing.

```html
<script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/suido@1/dist/element-define.js"></script>
<suido-board grid="7x7" level="12" size="medium" hints></suido-board>
<suido-board grid="7x7" daily="2026-10-09" size="small" hints></suido-board>
```

`size="small|medium|large"` is the display width (320, 480, 640 pixels). `grid` selects the puzzle's dimensions from `SUIDO_SIZES`. Existing `size="7x7"` and every old grid value remain aliases for grid dimensions, preserving existing embeds and inline host widths. A new `grid` or `daily` embed defaults to medium display width; `width` overrides it and fits the parent. `theme` is `light`, `dark` or `auto`; explicit themes also work in shadow roots. `label` is an optional spoken label, rendered as text. Native `lang` follows the host or page language.

`daily="today"`, an empty daily attribute, `on`, `true` or `1` choose the current UTC day; a real `YYYY-MM-DD` fixes a day. `off`, `false`, `no` or `0` turn daily mode off. The day is resolved when the element is rendered, with no rollover timer or storage. Daily mode uses the existing `dailySuidoLevel(grid, day)` ladder; an explicit custom `code` takes precedence. The family's daily embeds share the UTC date parser and deterministic date-seed helper, while curated levels keep their established daily ladders.

Every observed attribute is reflected as a property. Assigning false writes `"false"`; null or undefined remove the attribute. The `progress` getter still reads the live game while its new setter restores a kept string. Existing `game`, `flow`, `mount`, `restart()` and `hint()` remain available. `defineBoard(tag?)` registers a standard or custom tag without replacing a registered definition. Host callbacks belong on `options` and are read at event time, so changing a callback does not restart play.

The builder covers the element attributes and real mounted-board option keys, or explains why a custom board, answer, progress string or callback belongs to host code. Curated levels provide their own answers. The iframe `embed/?grid=7x7&level=12&size=medium&hints=1` validates grid, level, daily dates, display choices, width, label, custom board/answer codes and progress strings. Invalid parameters are ignored. It is transparent, noindex, keyboard-operable and supports reduced motion through the existing player. The builder measures its controls and grid aspect ratio to print a frame height that fits.

The existing `suido-change`, `suido-turn`, `suido-hint`, `suido-turning` and `suido-solve` events now bubble across shadow boundaries. `suido-load` adds `{ grid, level, day, code }`; `suido-error` adds `{ message }`. The iframe forwards the identical JSON-safe detail as `{ type: event.type, detail: event.detail }`. A host must check `event.origin === "https://johnmorrisdotca.github.io"` and `event.source === iframe.contentWindow` before using a message. There are no cookies, location requests or identity fields.
