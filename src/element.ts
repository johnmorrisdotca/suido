import { levelAnswer } from "./levelRow.ts";
import { embedDay } from "./embed-day.ts";
import { dailySuidoLevel } from "./daily.ts";
import { SUIDO_PLAY_STYLE } from "./playStyle.ts";
import { loadSuidoLevels } from "./levels.ts";
import type { Flow } from "./flow.ts";
import type { Game } from "./game.ts";
import { mountSuido, type SuidoMount, type SuidoTurning, type SuidoMountOptions } from "./mount.ts";

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
 *  - `size` and `level`: the level to play, from the package's own levels, fetched when asked (`5x5` to `28x28`, `5x7`,
 *    `6x10`, `8x14`, `20x50`). Or `code`, a board of your own as `makeSuido` writes it, with `answer` if there is one.
 *  - `progress`: a game half played (the `progress` of an event), read when the board loads.
 *  - `shown`: open on the answer, saying it was solved before.
 *  - `turning`: `clockwise` (default) or `anticlockwise`. `hints`: offer Hint (needs an answer, which a level has).
 *  - `controls="off"`: only the board. `chips`: the board's twists. `zoom="off"`: a big board is never offered zoom and pan.
 *  - `lang`: `en` or `ja`, or the page's.
 *
 * It fires `suido-change`, `suido-turn`, `suido-hint` and `suido-solve` (see `mountSuido`), and has the methods
 * `restart()` and `hint()`. Nothing in it can be selected, and its box stays one steady shape whatever is drawn.
 */
const ElementBase: typeof HTMLElement = typeof HTMLElement === "undefined" ? (class {} as unknown as typeof HTMLElement) : HTMLElement;

const isOn = (value: string | null): boolean => value !== null && !["false", "off", "0", "no"].includes(value.trim().toLowerCase());
const oneOf = <T extends string>(value: string | null, allowed: readonly T[]): T | undefined => (allowed.includes(value as T) ? (value as T) : undefined);

/** The mounted-board options, checked for completeness by TypeScript and the builder. */
export const SUIDO_EMBED_OPTION_KEYS = Object.keys({ code: true, answer: true, progress: true, shown: true, turning: true, hints: true, controls: true, chips: true, zoom: true, language: true, onChange: true, onTurn: true, onHint: true, onTurning: true, onSolve: true } satisfies Record<keyof SuidoMountOptions, boolean>);
/** Host callbacks; the same actions also emit native events. */
export type SuidoElementOptions = Pick<SuidoMountOptions, "onChange" | "onTurn" | "onHint" | "onTurning" | "onSolve">;

export class SuidoBoard extends ElementBase {
  static observedAttributes = ["size", "level", "code", "answer", "progress", "shown", "turning", "hints", "controls", "chips", "zoom", "lang", "grid", "daily", "theme", "width", "label"];

  #widthBefore: string | null = null;
  #widthOwned = false;
  #labelBefore: { role: string | null; label: string | null } | null = null;
  #write(name: string, value: unknown): void {
    if (value === null || value === undefined) this.removeAttribute(name);
    else this.setAttribute(name, String(value));
  }
  #frame(): void {
    this.setAttribute("data-suido-embed", "");
    const width = Number(this.getAttribute("width"));
    const size = this.getAttribute("size");
    const displaySize = size === null && (this.hasAttribute("grid") || this.hasAttribute("daily")) ? "medium" : size;
    const owned = (this.hasAttribute("width") && Number.isFinite(width) && width > 0) || (displaySize !== null && ["small", "medium", "large"].includes(displaySize));
    if (owned && !this.#widthOwned) { this.#widthBefore = this.style.width; this.#widthOwned = true; }
    if (this.hasAttribute("width") && Number.isFinite(width) && width > 0) this.style.width = `${Math.min(width, 2000)}px`;
    else if (displaySize !== null && ["small", "medium", "large"].includes(displaySize)) this.style.width = `${{ small: 320, medium: 480, large: 640 }[displaySize as "small" | "medium" | "large"]}px`;
    else if (this.#widthOwned) { this.style.width = this.#widthBefore ?? ""; this.#widthOwned = false; }
    this.style.maxWidth = "100%";
    const theme = this.getAttribute("theme"); this.style.colorScheme = theme === "light" || theme === "dark" ? theme : "light dark";
    const root = this.getRootNode();
    const target: ParentNode = typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot ? root : this.ownerDocument.head;
    if (target.querySelector("style[data-suido-embed-style]") === null) {
      const style = this.ownerDocument.createElement("style"); style.setAttribute("data-suido-embed-style", "");
      const rules = (theme: string) => [...SUIDO_PLAY_STYLE.matchAll(new RegExp(`:root\\[data-theme="${theme}"\\] ([^{]+)\\{([^}]+)\\}`, "g"))].map(match => `[data-suido-embed][theme="${theme}"]${match[1].trim() === ".suido-play" ? ".suido-play" : ` ${match[1].trim()}`} {${match[2]}}`).join("\n");
      const light = [...SUIDO_PLAY_STYLE.matchAll(/\.(suido|suido-play) \{([^}]+)\}/g)].filter(match => !match[2].includes("#ece8dc") && !match[2].includes("#171a18"));
      style.textContent = `@media(prefers-color-scheme:dark){${rules("dark").replaceAll('[theme="dark"]', ':not([theme="light"]):not([theme="dark"])')}}\n${rules("dark")}\n${light.map(match => `[data-suido-embed][theme="light"]${match[1] === "suido-play" ? ".suido-play" : " .suido"} {${match[2]}}`).join("\n")}\n[data-suido-embed][label]{outline-offset:2px}`;
      target.append(style);
    }
    if (this.hasAttribute("label")) { this.#labelBefore ??= { role: this.getAttribute("role"), label: this.getAttribute("aria-label") }; this.setAttribute("role", "group"); this.setAttribute("aria-label", this.getAttribute("label")!); }
    else if (this.#labelBefore !== null) { for (const [name, value] of [["role", this.#labelBefore.role], ["aria-label", this.#labelBefore.label]]) { if (value === null) this.removeAttribute(name!); else this.setAttribute(name!, value); } this.#labelBefore = null; }
  }

  /** The `size` attribute, reflected. */
  get size(): string | null { return this.getAttribute("size"); }
  set size(value: string | number | boolean | null | undefined) { this.#write("size", value); }
  /** The `level` attribute, reflected. */
  get level(): string | null { return this.getAttribute("level"); }
  set level(value: string | number | boolean | null | undefined) { this.#write("level", value); }
  /** The `code` attribute, reflected. */
  get code(): string | null { return this.getAttribute("code"); }
  set code(value: string | number | boolean | null | undefined) { this.#write("code", value); }
  /** The `answer` attribute, reflected. */
  get answer(): string | null { return this.getAttribute("answer"); }
  set answer(value: string | number | boolean | null | undefined) { this.#write("answer", value); }
  /** The `shown` attribute, reflected. */
  get shown(): string | null { return this.getAttribute("shown"); }
  set shown(value: string | number | boolean | null | undefined) { this.#write("shown", value); }
  /** The `turning` attribute, reflected. */
  get turning(): string | null { return this.getAttribute("turning"); }
  set turning(value: string | number | boolean | null | undefined) { this.#write("turning", value); }
  /** The `hints` attribute, reflected. */
  get hints(): string | null { return this.getAttribute("hints"); }
  set hints(value: string | number | boolean | null | undefined) { this.#write("hints", value); }
  /** The `controls` attribute, reflected. */
  get controls(): string | null { return this.getAttribute("controls"); }
  set controls(value: string | number | boolean | null | undefined) { this.#write("controls", value); }
  /** The `chips` attribute, reflected. */
  get chips(): string | null { return this.getAttribute("chips"); }
  set chips(value: string | number | boolean | null | undefined) { this.#write("chips", value); }
  /** The `zoom` attribute, reflected. */
  get zoom(): string | null { return this.getAttribute("zoom"); }
  set zoom(value: string | number | boolean | null | undefined) { this.#write("zoom", value); }
  /** The `grid` attribute, reflected. */
  get grid(): string | null { return this.getAttribute("grid"); }
  set grid(value: string | number | boolean | null | undefined) { this.#write("grid", value); }
  /** The `daily` attribute, reflected. */
  get daily(): string | null { return this.getAttribute("daily"); }
  set daily(value: string | number | boolean | null | undefined) { this.#write("daily", value); }
  /** The `theme` attribute, reflected. */
  get theme(): string | null { return this.getAttribute("theme"); }
  set theme(value: string | number | boolean | null | undefined) { this.#write("theme", value); }
  /** The `width` attribute, reflected. */
  get width(): string | null { return this.getAttribute("width"); }
  set width(value: string | number | boolean | null | undefined) { this.#write("width", value); }
  /** The `label` attribute, reflected. */
  get label(): string | null { return this.getAttribute("label"); }
  set label(value: string | number | boolean | null | undefined) { this.#write("label", value); }

  #options: SuidoElementOptions = {};
  /** Host callbacks, read at the time of an event without restarting the puzzle. */
  get options(): SuidoElementOptions { return this.#options; }
  set options(value: SuidoElementOptions) { this.#options = value ?? {}; }
  #problem(message: string): void {
    this.#mount?.destroy(); this.#mount = null; this.#key = "";
    const status = this.ownerDocument.createElement("p"); status.setAttribute("role", "status"); status.textContent = message; this.replaceChildren(status);
    this.dispatchEvent(new CustomEvent("suido-error", { bubbles: true, composed: true, detail: { message } }));
  }

  #mount: SuidoMount | null = null;
  #key = "";
  #asked = 0;
  #queued = false;

  connectedCallback(): void {
    void this.#refresh();
  }

  disconnectedCallback(): void {
    this.#asked += 1;
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

  /** Restore from a kept progress string while the getter still reads the live game. */
  set progress(value: string | null | undefined) { this.#write("progress", value); }

  restart(): void {
    this.#mount?.restart();
  }

  hint(): void {
    this.#mount?.hint();
  }

  async #refresh(): Promise<void> {
    this.#frame();
    const display = this.getAttribute("size");
    const size = this.getAttribute("grid") ?? (display !== null && !["small", "medium", "large"].includes(display) ? display : "7x7");
    let day: string | null;
    try { day = embedDay(this.getAttribute("daily")); } catch { this.#problem("Use a real UTC date written YYYY-MM-DD."); return; }
    if (this.hasAttribute("code")) day = null;
    if (day === null) this.removeAttribute("data-day"); else this.setAttribute("data-day", day);
    const level = day !== null ? dailySuidoLevel(size, day) ?? undefined : this.getAttribute("level") === null ? undefined : Number(this.getAttribute("level"));
    let code = this.getAttribute("code") ?? undefined;
    let answer = this.getAttribute("answer") ?? undefined;
    const turning = oneOf<SuidoTurning>(this.getAttribute("turning"), ["clockwise", "anticlockwise"]);
    const hints = isOn(this.getAttribute("hints"));
    const language = oneOf(this.getAttribute("lang"), ["en", "ja"] as const);
    const key = JSON.stringify([size, level, day, code, answer, this.getAttribute("progress"), this.getAttribute("shown"), this.getAttribute("controls"), this.getAttribute("chips"), this.getAttribute("zoom")]);
    if (key === this.#key && this.#mount !== null) {
      this.#mount.set({ turning, hints, language });
      return;
    }
    const ask = (this.#asked += 1);
    if (code === undefined && size !== null && level !== undefined) {
      const rows = await loadSuidoLevels(size).catch(() => null);
      if (!this.isConnected || ask !== this.#asked) return;
      const row = rows?.[level - 1];
      if (row === undefined) { this.#problem("Choose a valid grid and level."); return; }
      code = row[0];
      answer = levelAnswer(row) ?? undefined;
    }
    if (code === undefined || !this.isConnected || ask !== this.#asked) return;
    this.#mount?.destroy();
    this.#key = key;
    this.#mount = mountSuido(this, {
      code,
      answer,
      onChange: (detail) => this.#options.onChange?.(detail),
      onTurn: (detail) => this.#options.onTurn?.(detail),
      onHint: (detail) => this.#options.onHint?.(detail),
      onTurning: (turning) => this.#options.onTurning?.(turning),
      onSolve: (detail) => this.#options.onSolve?.(detail),
      progress: this.getAttribute("progress") ?? undefined,
      shown: isOn(this.getAttribute("shown")),
      turning,
      hints: hints && answer !== undefined,
      language,
      controls: isOn(this.getAttribute("controls") ?? "on"),
      chips: isOn(this.getAttribute("chips")),
      zoom: isOn(this.getAttribute("zoom") ?? "on") ? "auto" : "off",
    });
    this.#frame();
    this.dispatchEvent(new CustomEvent("suido-load", { bubbles: true, composed: true, detail: { grid: size, level: level ?? null, day, code } }));
  }
}

/** Register a board under its standard tag or a host's own tag, preserving an existing definition. */
export function defineBoard(tag = "suido-board"): void {
  if (typeof customElements === "undefined" || customElements.get(tag) !== undefined) return;
  customElements.define(tag, tag === "suido-board" ? SuidoBoard : class extends SuidoBoard {});
}
