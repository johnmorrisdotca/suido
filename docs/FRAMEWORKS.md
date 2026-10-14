# In Angular and Next.js

How to use `<suido-board>` in Angular and in Next.js. The React, Vue and Svelte recipes are in [the README](../README.md#3-a-bundler-and-a-framework). Moved here to keep the README under the length npm shows.

```ts no-check
// Angular: a standalone component with CUSTOM_ELEMENTS_SCHEMA
import { Component, CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import "@johnmorrisdotca/suido/element/define";

@Component({
  selector: "app-level",
  standalone: true,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  template: `<suido-board size="7x7" level="12" hints (suido-solve)="solved($event)"></suido-board>`,
})
export class Level {
  solved(event: Event) { console.log((event as CustomEvent).detail.code); }
}
```

In Next.js or any server-rendering framework, import the define entry from a client component, so the tag is defined in the browser. Or skip the tag and call `mountSuido(element, options)` from `@johnmorrisdotca/suido/play` in an effect: the handle it returns has `destroy()`.

`pnpm test:frameworks` builds these recipes from the packed tarball in a scratch project for each of the five and solves a level in each, in Chromium and WebKit; it needs the network and a few minutes, so it is run before a release and in CI rather than with `pnpm check`.
