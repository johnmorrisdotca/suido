/**
 * Defines the `<suido-board>` element on the page. Import it for its effect:
 *
 * ```html
 * <script type="module" src="https://cdn.jsdelivr.net/npm/@johnmorrisdotca/suido@1/dist/element-define.js"></script>
 * <suido-board size="7x7" level="12"></suido-board>
 * ```
 *
 * A tag already defined is left as it is, and on a server, where there is no page, nothing happens.
 */
import { SuidoBoard } from "./element.ts";

if (typeof customElements !== "undefined" && customElements.get("suido-board") === undefined) customElements.define("suido-board", SuidoBoard);
