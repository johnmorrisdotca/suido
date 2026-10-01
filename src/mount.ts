import { checkSuidoAnswer } from "./check.ts";
import { decodeLayout } from "./code.ts";
import { drawSuido } from "./draw.ts";
import type { Flow } from "./flow.ts";
import { canTurnAt, flowOfGame, gameCode, gameFromProgress, gameProgress, hintFor, newGame, tapsToAnswer, turnAt, type Game } from "./game.ts";
import { paintSuido } from "./paint.ts";
import { quartersBetween, shapeOf } from "./pieces.ts";
import { SUIDO_PLAY_STYLE } from "./playStyle.ts";
import { suidoLanguageOf, suidoSay, type SuidoLanguage } from "./strings.ts";
import { twistsOf, type Twist } from "./twists.ts";

/**
 * A PLAYABLE SUIDO BOARD IN ANY PAGE: `mountSuido(host, options)` draws a board
 * into an element and plays it by tap, mouse and keyboard, the way the demo does.
 * A tap turns a piece a quarter clockwise (or the other way, as `turning` says);
 * shift with a tap, or a right click, goes the other way; the arrows move between
 * pieces and enter or space turns one. The water is seen to flow along the pipes
 * as they join, and to run back out of one turned away.
 *
 * Under the board are the twists as chips (`chips`), a line saying how far the
 * water has got, a line of turns, par and hints, a line for what a hint says,
 * and the buttons: Start over, Hint (`hints`, which needs an `answer`) and the
 * direction a tap turns. All of it is optional (`controls`), and everything a
 * button does is also a method of the returned handle. What happens is told in
 * events, on the host as DOM events and to the callbacks given: `suido-change`
 * for every change to the board, `suido-turn` for a turn, `suido-hint`,
 * `suido-turning` when the way a tap turns is changed, and `suido-solve` once,
 * with the game as a code ready for `checkSuidoAnswer`.
 *
 * Needs a page. The rules it plays by are `game.ts`'s, the drawing is
 * `drawSuido`'s, and both are usable alone.
 */

/** The way a tap turns a piece. */
export type SuidoTurning = "clockwise" | "anticlockwise";

/** What a mounted board tells of itself in every event. */
export type SuidoEventDetail = {
  /** The game as a code, every piece facing as it does now: what `checkSuidoAnswer` takes, with the board's own code. */
  code: string;
  /** The game as a short string to keep a game half played (`gameFromProgress` and the `progress` option bring it back). */
  progress: string;
  /** Taps that turned a piece. */
  turns: number;
  /** Hints asked for. */
  hints: number;
  solved: boolean;
  /** The piece turned, for `suido-turn`, and the piece lit, for `suido-hint`. */
  cell?: number;
};

export type SuidoMountOptions = {
  /** The board, as its code (`makeSuido(...).code`, or a level's `row[0]`). */
  code: string;
  /** The board's one answer, as a code (`levelAnswer(row)`, `makeSuido(...).answer`). With it Hint is offered if `hints` is on, and the meter says par. Ignored if it is not an answer to the board. */
  answer?: string;
  /** A game half played, as `gameProgress` or an event's `progress` wrote it. */
  progress?: string;
  /** Open on the answer, saying it was solved before, until the next turn. Needs `answer`. */
  shown?: boolean;
  /** Which way a tap turns a piece. Default clockwise. */
  turning?: SuidoTurning;
  /** Offer Hint, which lights a piece to turn. Needs `answer`. Default false. */
  hints?: boolean;
  /** The buttons and the lines of words under the board. Default true. */
  controls?: boolean;
  /** A row of chips under the board: each twist the board has, or Plain, each with the line that explains it as its hover text. Default false. */
  chips?: boolean;
  /** The language the words are in. Left out, the host's own `lang`, or the page's, and it follows the page's. */
  language?: SuidoLanguage;
  onChange?: (detail: SuidoEventDetail) => void;
  onTurn?: (detail: SuidoEventDetail) => void;
  onHint?: (detail: SuidoEventDetail) => void;
  /** Told when the way a tap turns is changed, by the board's own button or by `set`. */
  onTurning?: (turning: SuidoTurning) => void;
  onSolve?: (detail: SuidoEventDetail) => void;
};

export type SuidoMount = {
  readonly host: HTMLElement;
  /** The game as it stands. */
  game: () => Game;
  /** The water as it runs now. */
  flow: () => Flow;
  /** The game half played, as a short string to keep. */
  progress: () => string;
  /** Play another board (or the same one again, fresh). `progress` carries on a kept game and `shown` opens on the answer. */
  load: (board: { code: string; answer?: string; progress?: string; shown?: boolean }) => void;
  /** Change how it is played: the turning, whether Hint is offered, the language. */
  set: (changes: { turning?: SuidoTurning; hints?: boolean; language?: SuidoLanguage }) => void;
  /** Turn the piece on a cell, a quarter clockwise or (`back`) the other way, as a tap does. */
  turn: (cell: number, back?: boolean) => void;
  /** Start the board over: every piece as given, no turns, no hints. */
  restart: () => void;
  /** Light a piece to turn, as the Hint button does. */
  hint: () => void;
  /** Take the board down: its listeners, its frames and everything it put in the host. */
  destroy: () => void;
};

/** Put the style in the page once: in the document's head, or in the shadow root the host is in. */
export function ensureSuidoPlayStyle(host: Element): void {
  const root = host.getRootNode();
  const target: ParentNode = typeof ShadowRoot !== "undefined" && root instanceof ShadowRoot ? root : host.ownerDocument.head;
  if (target.querySelector("style[data-suido-play]") !== null) return;
  const style = host.ownerDocument.createElement("style");
  style.setAttribute("data-suido-play", "");
  style.textContent = SUIDO_PLAY_STYLE;
  target.append(style);
}

function create<K extends keyof HTMLElementTagNameMap>(document: Document, tag: K, className: string, text?: string): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  element.className = className;
  if (text !== undefined) element.textContent = text;
  return element;
}

/** The answer's pieces, if `answer` is an answer to `code`; null otherwise. */
function solutionOf(code: string, answer: string | undefined): number[] | null {
  if (answer === undefined || !checkSuidoAnswer(code, answer).ok) return null;
  return decodeLayout(answer)?.cells ?? null;
}

/** Draw a board into `host` and play it. Returns the handle that drives it, or null for a code that is no board. */
export function mountSuido(host: HTMLElement, options: SuidoMountOptions): SuidoMount | null {
  const document = host.ownerDocument;
  if (newGame(options.code) === null) return null;
  ensureSuidoPlayStyle(host);

  let code = options.code;
  let answerCode = options.answer;
  let solution = solutionOf(code, answerCode);
  let game: Game = newGame(code)!;
  let flow: Flow = flowOfGame(game);
  let par = 0;
  let hints = 0;
  let said: "hinted" | "noHint" | null = null;
  let shown = false;
  let solvedTold = false;
  let turning: SuidoTurning = options.turning ?? "clockwise";
  let offerHints = options.hints === true;
  let explicitLanguage = options.language;
  let language: SuidoLanguage = explicitLanguage ?? suidoLanguageOf(host.closest("[lang]")?.getAttribute("lang") ?? document.documentElement.lang);
  const withControls = options.controls !== false;
  const withChips = options.chips === true;
  const callbacks = options;
  let svg: SVGSVGElement | null = null;
  let frame = 0;
  let generation = 0;

  // The parts.
  host.classList.add("suido-play");
  host.replaceChildren();
  const boardBox = create(document, "div", "sdp-board");
  const chips = create(document, "ul", "sdp-chips");
  const status = create(document, "p", "sdp-status");
  status.setAttribute("aria-live", "polite");
  const meter = create(document, "p", "sdp-meter");
  const note = create(document, "p", "sdp-note");
  note.setAttribute("aria-live", "polite");
  const controls = create(document, "div", "sdp-controls");
  host.append(boardBox);
  if (withChips) host.append(chips);
  if (withControls) host.append(status, meter, note, controls);

  const button = (name: string, onPress: () => void): HTMLButtonElement => {
    const one = create(document, "button", "sdp-button");
    one.type = "button";
    one.dataset.action = name;
    one.addEventListener("click", onPress);
    controls.append(one);
    return one;
  };
  const restartButton = button("restart", () => api.restart());
  const hintButton = button("hint", () => api.hint());
  const turningButton = button("turning", () => api.set({ turning: turning === "clockwise" ? "anticlockwise" : "clockwise" }));

  const say = (key: string, values: Record<string, string | number> = {}): string => suidoSay(language, key, values);
  const detail = (extra: Partial<SuidoEventDetail> = {}): SuidoEventDetail => ({ code: gameCode(game), progress: gameProgress(game), turns: game.turns, hints, solved: flow.solved, ...extra });
  const tell = (name: string, info: SuidoEventDetail, callback?: (detail: SuidoEventDetail) => void): void => {
    callback?.(info);
    host.dispatchEvent(new CustomEvent(name, { detail: info, bubbles: true }));
  };
  const cells = (): SVGGElement[] => (svg === null ? [] : [...svg.querySelectorAll<SVGGElement>(".sd-cell")]);

  function renderChips(): void {
    if (!withChips) return;
    const twists: readonly (Twist | "plain")[] = (() => {
      const own = twistsOf(game.start);
      return own.length === 0 ? ["plain"] : own;
    })();
    chips.replaceChildren(
      ...twists.map((twist) => {
        const key = twist === "plain" ? "plain" : `twist${twist.replace(/(^|-)(\w)/g, (_, __, letter: string) => letter.toUpperCase())}`;
        const one = create(document, "li", "sdp-chip", say(key));
        one.dataset.twist = twist;
        one.title = say(`${key}Says`);
        return one;
      }),
    );
  }

  /** The words for every cell, for a screen reader. */
  function label(): void {
    const { width } = game.start;
    const join = language === "ja" ? "、" : ", ";
    cells().forEach((cell, index) => {
      const role = cell.dataset.role;
      const locked = cell.dataset.locked === "true";
      const what = [role === "source" ? say("cellPump") : role === "drain" ? say("cellDrain") : "", say(`shape${shapeOf(game.masks[index]!).replace(/^./, (letter) => letter.toUpperCase())}`), locked ? say("cellLocked") : "", flow.wet[index] === true ? say("cellWet") : ""].filter((word) => word !== "");
      cell.setAttribute("aria-label", say("cell", { row: Math.floor(index / width) + 1, col: (index % width) + 1, what: what.join(join) }));
      if (locked) cell.setAttribute("aria-disabled", "true");
    });
  }

  function words(): void {
    host.dataset.solved = String(flow.solved);
    host.dataset.turns = String(game.turns);
    host.dataset.hints = String(hints);
    label();
    if (!withControls) return;
    restartButton.textContent = say("restart");
    hintButton.textContent = say("hint");
    hintButton.hidden = !(offerHints && solution !== null);
    turningButton.textContent = say(turning === "clockwise" ? "turningClockwise" : "turningAnticlockwise");
    turningButton.setAttribute("aria-pressed", String(turning === "anticlockwise"));
    const kind = game.start.kind;
    const progress = kind === "drains" ? say("progressDrains", { wet: flow.wetDrains, of: flow.drains }) : kind === "inlet-outlet" ? say(flow.wetPieces <= 1 ? "progressPathNone" : "progressPath", { wet: flow.wetPieces }) : say("progressNetwork", { wet: flow.wetPieces, of: flow.pieces });
    const solvedKey = kind === "drains" ? "solvedDrains" : kind === "inlet-outlet" ? "solvedPath" : "solved";
    const leaks = flow.spills.length;
    status.textContent = flow.solved ? (shown ? say("solvedBefore") : say(solvedKey, { n: game.turns })) : `${progress} · ${leaks === 0 ? say("leaksNone") : say("leaks", { n: leaks })}`;
    status.dataset.solved = String(flow.solved);
    const bits = [say("turns", { n: game.turns })];
    if (solution !== null) bits.push(say("par", { n: par }));
    if (offerHints && solution !== null) bits.push(say("hints", { n: hints }));
    meter.textContent = bits.join(" · ");
    note.textContent = said === null ? "" : say(said);
  }

  /** Draw the board dry, then paint the water onto it on the next frame, so the first flow is seen. */
  function show(): void {
    const mine = (generation += 1);
    window.cancelAnimationFrame(frame);
    host.style.setProperty("--sdp-ratio", String(game.start.width / game.start.height));
    boardBox.innerHTML = drawSuido(game.start, { masks: game.masks, quarters: game.quarters, water: false, label: say("board", { width: game.start.width, height: game.start.height }) });
    svg = boardBox.firstElementChild as SVGSVGElement;
    cells().forEach((cell, index) => {
      cell.setAttribute("role", "button");
      cell.setAttribute("tabindex", index === 0 ? "0" : "-1");
    });
    host.removeAttribute("aria-busy");
    host.dataset.painted = "false";
    flow = paintSuido(svg, game.start, game.masks, game.quarters);
    svg.setAttribute("data-solved", "false");
    cells().forEach((cell) => cell.setAttribute("data-wet", "false"));
    words();
    frame = window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => {
        if (mine !== generation || svg === null) return;
        flow = paintSuido(svg, game.start, game.masks, game.quarters);
        host.dataset.painted = "true";
        words();
      }),
    );
  }

  function begin(next: { code: string; answer?: string; progress?: string; shown?: boolean }): boolean {
    const fresh = newGame(next.code);
    if (fresh === null) return false;
    code = next.code;
    answerCode = next.answer;
    solution = solutionOf(code, answerCode);
    game = fresh;
    shown = false;
    if (solution !== null && next.shown === true) {
      game = { ...fresh, masks: [...solution], quarters: fresh.start.cells.map((mask, cell) => quartersBetween(mask, solution![cell]!) ?? 0), turns: 0 };
      shown = true;
    } else if (next.progress !== undefined) game = gameFromProgress(code, next.progress) ?? fresh;
    par = solution === null ? 0 : tapsToAnswer(newGame(code)!, solution);
    flow = flowOfGame(game);
    hints = 0;
    said = null;
    solvedTold = flow.solved;
    renderChips();
    show();
    return true;
  }

  function turnCell(index: number, back: boolean): void {
    if (host.getAttribute("aria-busy") === "true" || svg === null || !canTurnAt(game, index)) return;
    shown = false;
    game = turnAt(game, index, back ? -1 : 1);
    cells().forEach((cell) => cell.removeAttribute("data-hint"));
    said = null;
    flow = paintSuido(svg, game.start, game.masks, game.quarters);
    words();
    tell("suido-turn", detail({ cell: index }), callbacks.onTurn);
    tell("suido-change", detail(), callbacks.onChange);
    if (flow.solved && !solvedTold) {
      solvedTold = true;
      tell("suido-solve", detail(), callbacks.onSolve);
    }
  }

  const reverse = (): boolean => turning === "anticlockwise";
  // Taps, as a finger or a mouse makes them; a right click, or shift, or the turning button, goes the other way.
  const onClick = (event: MouseEvent): void => {
    const cell = (event.target as Element | null)?.closest?.(".sd-cell");
    if (cell === null || cell === undefined) return;
    turnCell(Number((cell as SVGElement).dataset.cell), event.shiftKey !== reverse());
  };
  const onContext = (event: MouseEvent): void => {
    const cell = (event.target as Element | null)?.closest?.(".sd-cell");
    if (cell === null || cell === undefined) return;
    event.preventDefault();
    turnCell(Number((cell as SVGElement).dataset.cell), !reverse());
  };
  // The keyboard: the arrows move between pieces, enter or space turns one (with shift, the other way).
  const onKey = (event: KeyboardEvent): void => {
    const cell = (event.target as Element | null)?.closest?.(".sd-cell") as SVGGElement | null | undefined;
    if (cell === null || cell === undefined) return;
    const index = Number(cell.dataset.cell);
    const { width, height } = game.start;
    const move = ({ ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] } as Record<string, [number, number]>)[event.key];
    if (move !== undefined) {
      event.preventDefault();
      const col = (index % width) + move[0];
      const row = Math.floor(index / width) + move[1];
      if (col < 0 || row < 0 || col >= width || row >= height) return;
      const next = cells()[row * width + col];
      if (next === undefined) return;
      cell.setAttribute("tabindex", "-1");
      next.setAttribute("tabindex", "0");
      next.focus();
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      turnCell(index, event.shiftKey !== reverse());
    }
  };
  boardBox.addEventListener("click", onClick);
  boardBox.addEventListener("contextmenu", onContext);
  boardBox.addEventListener("keydown", onKey);

  const watching = typeof MutationObserver === "undefined" ? null : new MutationObserver(() => {
    if (explicitLanguage !== undefined) return;
    const next = suidoLanguageOf(host.closest("[lang]")?.getAttribute("lang") ?? document.documentElement.lang);
    if (next === language) return;
    language = next;
    svg?.setAttribute("aria-label", say("board", { width: game.start.width, height: game.start.height }));
    renderChips();
    words();
  });
  watching?.observe(document.documentElement, { attributes: true, attributeFilter: ["lang"] });

  const api: SuidoMount = {
    host,
    game: () => game,
    flow: () => flow,
    progress: () => gameProgress(game),
    load: (next) => {
      if (begin(next)) tell("suido-change", detail(), callbacks.onChange);
    },
    set: (changes) => {
      if (changes.turning !== undefined && changes.turning !== turning) {
        turning = changes.turning;
        callbacks.onTurning?.(turning);
        host.dispatchEvent(new CustomEvent("suido-turning", { detail: { turning }, bubbles: true }));
      }
      if (changes.hints !== undefined) offerHints = changes.hints;
      if (changes.language !== undefined) {
        explicitLanguage = changes.language;
        language = changes.language;
        svg?.setAttribute("aria-label", say("board", { width: game.start.width, height: game.start.height }));
        renderChips();
      }
      words();
    },
    turn: (cell, back = false) => turnCell(cell, back),
    restart: () => {
      begin({ code, answer: answerCode });
      tell("suido-change", detail(), callbacks.onChange);
    },
    hint: () => {
      if (solution === null || svg === null) return;
      const cell = hintFor(game, solution);
      cells().forEach((one) => one.removeAttribute("data-hint"));
      if (cell === null) said = "noHint";
      else {
        hints += 1;
        said = "hinted";
        cells()[cell]?.setAttribute("data-hint", "true");
      }
      words();
      tell("suido-hint", detail(cell === null ? {} : { cell }), callbacks.onHint);
    },
    destroy: () => {
      generation += 1;
      window.cancelAnimationFrame(frame);
      boardBox.removeEventListener("click", onClick);
      boardBox.removeEventListener("contextmenu", onContext);
      boardBox.removeEventListener("keydown", onKey);
      watching?.disconnect();
      host.replaceChildren();
      host.classList.remove("suido-play");
      host.style.removeProperty("--sdp-ratio");
      for (const name of ["solved", "turns", "hints", "painted"]) delete host.dataset[name];
    },
  };

  begin({ code, answer: options.answer, progress: options.progress, shown: options.shown });
  return api;
}
