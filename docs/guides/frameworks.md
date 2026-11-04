---
title: React, Vue, Svelte and Angular
section: how-to
order: 14
description: Use the board element in React, Vue, Svelte and Angular, with the import that keeps a server render working.
---

`<suido-board>` is a web component, so every framework can use it. Two things apply everywhere:

1. **Import the entry that registers the tag** (`@johnmorrisdotca/suido/element/define`). It is safe to import on a server, where it registers nothing; the board is drawn in the browser.
2. **Tell the framework the tag exists.** React needs a type for it, Vue a compiler option, Angular a schema. Svelte needs nothing.

## React

`Level.tsx`; React 19 passes attributes through to a custom element.

```tsx
import "@johnmorrisdotca/suido/element/define";

export function Level({ grid = "7x7", level = 12 }: { grid?: string; level?: number }) {
  return <suido-board grid={grid} level={String(level)} hints />;
}
```

With TypeScript, tell React the tag exists (a file such as `suido-board.d.ts`).

```ts no-check
import type { DetailedHTMLProps, HTMLAttributes } from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "suido-board": DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement> & { grid?: string; level?: string; hints?: boolean; chips?: boolean; lang?: string; theme?: string };
    }
  }
}
```

Mount it as usual.

```tsx
import { createRoot } from "react-dom/client";
import { Level } from "./Level";

createRoot(document.getElementById("root")!).render(<Level />);
```

The component renders to a string on a server (`renderToString`), as the package's tests check: the tag is in the HTML and the board is drawn in the browser.

```tsx
import { renderToString } from "react-dom/server";
import { Level } from "./Level";

console.log(renderToString(<Level />));
```

## Vue

```vue
<script setup lang="ts">
import "@johnmorrisdotca/suido/element/define";

withDefaults(defineProps<{ grid?: string; level?: number }>(), { grid: "7x7", level: 12 });
</script>

<template>
  <suido-board :grid="grid" :level="level" hints></suido-board>
</template>
```

Tell Vue's compiler that `suido-*` tags are custom elements, in `vite.config.mjs`:

```js no-check
import vue from "@vitejs/plugin-vue";

export default {
  plugins: [vue({ template: { compilerOptions: { isCustomElement: (tag) => tag.startsWith("suido-") } } })],
};
```

Then mount it as usual.

```ts no-check
import { createApp } from "vue";
import Level from "./Level.vue";

createApp(Level).mount("#app");
```

## Svelte

```svelte
<script lang="ts">
  import "@johnmorrisdotca/suido/element/define";

  let { grid = "7x7", level = 12 }: { grid?: string; level?: number } = $props();
</script>

<suido-board {grid} {level} hints></suido-board>
```

```ts no-check
import { mount } from "svelte";
import Level from "./Level.svelte";

mount(Level, { target: document.getElementById("app")! });
```

## Angular

Standalone, with `CUSTOM_ELEMENTS_SCHEMA` so the template may hold an unknown tag.

```ts no-check
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import "@johnmorrisdotca/suido/element/define";

@Component({
  selector: "app-level",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<suido-board grid="7x7" level="12" hints></suido-board>`,
})
export class LevelComponent {}
```

```ts no-check
import "@angular/compiler";
import { provideZonelessChangeDetection } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { LevelComponent } from "./level.component";

void bootstrapApplication(LevelComponent, { providers: [provideZonelessChangeDetection()] });
```

## Next.js, Nuxt, SvelteKit

They render on a server first, and the import above is safe there, so the components work unchanged. In Next.js's App Router the component file starts with `"use client"`.
