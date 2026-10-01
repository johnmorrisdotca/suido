import { levelAnswer } from "./levelRow.ts";
import { loadSuidoLevels } from "./levels.ts";
import type { Flow } from "./flow.ts";
import type { Game } from "./game.ts";
import { mountSuido, type SuidoMount, type SuidoTurning } from "./mount.ts";

/**
 * THE `<suido-board>` ELEMENT: a playable Suido board in a tag, with no
 * framework. `@johnmorrisdotca/suido/element/define` defines it; this entry
 * holds the class alone, to extend or to define under another name. Safe to
 * import on a server, where there is no page: the class then extends nothing.
 *
 * ```html
 * <suido-board size="7x7" level="12"></suido-board>
 * <suido-board code="3x3:…" answer="3x3:…" hints></suido-board>
 * ```
 *
 * Attributes (each is read again when it changes):
 *  - `size` and `level`: the level to play, from the package's own levels, fetched when asked (`5x5` to `14x14`, `5x7`,
 *    `6x10`, `8x14`). Or `code`, a board of your own as `makeSuido` writes it, with `answer` if there is one.
 *  - `progress`: a game half played (the `progress` of an event), read when the board loads.
 *  - `shown`: open on the answer, saying it was solved before.
 *  - `turning`: `clockwise` (default) or `anticlockwise`. `hints`: offer Hint (needs an answer, which a level has).
 *  - `controls="off"`: only the board. `chips`: the board's twists.
 *  - `lang`: `en` or `ja`, or the page's.
 *
 * It fires `suido-change`, `suido-turn`, `suido-hint` and `suido-solve` (see `mountSuido`), and has the methods
 * `restart()` and `hint()`. Nothing in it can be selected, and its box stays one steady shape whatever is drawn.
 */
const ElementBase: typeof HTMLElement = typeof HTMLElement === "undefined" ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

const isOn = (value: string | null): boolean => value !== null && !["false", "off", "0", "no"].includes(value.toLowerCase());
const oneOf = <T extends string>(value: string | null, allowed: readonly T[]): T | undefined => (allowed.includes(value as T) ? (value as T) : undefined);

export class SuidoBoard extends ElementBase {
  static observedAttributes = ["size", "level", "code", "answer", "progress", "shown", "turning", "hints", "controls", "chips", "lang"];

  #mount: SuidoMount | null = null;
  #key = "";
  #asked = 0;
  #queued = false;

  connectedCallback(): void {
    void this.#refresh();
  }

  disconnectedCallback(): void {
    this.#mount?.destroy();
    this.#mount = null;
    this.#key = "";
  }

  attributeChangedCallback(): void {
    if (!this.isConnected || this.#queued) return;
    this.#queued = true;
    queueMicrotask(() => {
      this.#queued = false;
      void this.#refresh();
    });
  }

  /** The mounted board's handle (`mountSuido`), or null until a board has loaded. */
  get mount(): SuidoMount | null {
    return this.#mount;
  }

  get game(): Game | null {
    return this.#mount?.game() ?? null;
  }

  get flow(): Flow | null {
    return this.#mount?.flow() ?? null;
  }

  get progress(): string | null {
    return this.#mount?.progress() ?? null;
  }

  restart(): void {
    this.#mount?.restart();
  }

  hint(): void {
    this.#mount?.hint();
  }

  async #refresh(): Promise<void> {
    const size = this.getAttribute("size");
    const level = this.getAttribute("level") === null ? undefined : Number(this.getAttribute("level"));
    let code = this.getAttribute("code") ?? undefined;
    let answer = this.getAttribute("answer") ?? undefined;
    const turning = oneOf<SuidoTurning>(this.getAttribute("turning"), ["clockwise", "anticlockwise"]);
    const hints = isOn(this.getAttribute("hints"));
    const language = oneOf(this.getAttribute("lang"), ["en", "ja"] as const);
    const key = JSON.stringify([size, level, code, answer, this.getAttribute("progress"), this.getAttribute("shown"), this.getAttribute("controls"), this.getAttribute("chips")]);
    if (key === this.#key && this.#mount !== null) {
      this.#mount.set({ turning, hints, language });
      return;
    }
    const ask = (this.#asked += 1);
    if (code === undefined && size !== null && level !== undefined) {
      const rows = await loadSuidoLevels(size).catch(() => null);
      if (ask !== this.#asked) return;
      const row = rows?.[level - 1];
      if (row === undefined) return;
      code = row[0];
      answer = levelAnswer(row) ?? undefined;
    }
    if (code === undefined || ask !== this.#asked) return;
    this.#mount?.destroy();
    this.#key = key;
    this.#mount = mountSuido(this, {
      code,
      answer,
      progress: this.getAttribute("progress") ?? undefined,
      shown: isOn(this.getAttribute("shown")),
      turning,
      hints: hints && answer !== undefined,
      language,
      controls: isOn(this.getAttribute("controls") ?? "on"),
      chips: isOn(this.getAttribute("chips")),
    });
  }
}
