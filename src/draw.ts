import { blockInfo, blockQuartersBetween, placeAfter, type Block } from "./blocks.ts";
import { isLocked, type Layout } from "./code.ts";
import { flowOf, type Flow } from "./flow.ts";
import { quartersBetween, shapeOf, SIDES } from "./pieces.ts";
import { SUIDO_STYLE } from "./style.ts";

/**
 * DRAWING a board as SVG text: a string, to put in a page, a file or an image,
 * with nothing to load and nothing run. Every cell is a square of ground with
 * its piece laid on it, drawn in a box 100 across and centred, so a turn is a
 * rotation about the cell's middle. Every picture here is made in code.
 *
 * The same drawing is also the page's live board: `cellStates` says what every
 * cell should look like (how far turned, whether wet, which arms the water
 * comes in by, goes out of, or leaks from), and `paintSuido` (in `./paint`)
 * writes that onto the drawing when a piece is turned, so the water is seen to
 * flow along the pipes and to run back out of one that is turned away.
 */

/** What the water does at one opening of a piece. */
export type ArmState = "in" | "out" | "leak" | "";

/** How one cell is to look. */
export type CellState = {
  cell: number;
  /** Quarter turns clockwise from the piece as the board gave it, as the drawing turns it. */
  quarters: number;
  wet: boolean;
  /** Cells the water went through to reach it, 0 for a pump; -1 for a dry cell. */
  depth: number;
  /** What the water does at each of the piece's four sides as drawn (the sides it had as the board gave it, not as it faces now): "in" where it comes in, "out" where it goes on, "leak" where it runs out of an open end, "" for no water or no opening. */
  arms: [ArmState, ArmState, ArmState, ArmState];
};

/** What to draw with. */
export type DrawOptions = {
  /** How every piece faces now; the board's own, if left out. */
  masks?: readonly number[];
  /** How far each piece has been turned in all, so a drawing can keep turning the way it was tapped; found from `masks` if left out. */
  quarters?: readonly number[];
  /** A description for screen readers. */
  label?: string;
  /** Put `SUIDO_STYLE` inside the drawing, so it stands alone as an image. A page with the style in already leaves this off. */
  style?: boolean;
  /** How long the water takes to go through one cell, in milliseconds. Default: fast enough that the whole board fills in about two seconds. */
  step?: number;
  /** Whether to draw the water. Default true. */
  water?: boolean;
};

/** The longest the water is let take to fill a whole board, in milliseconds, when no step is given. */
const FILL_MS = 2000;

/** The milliseconds the water takes through one cell, so that the deepest cell is reached in `FILL_MS` at most. */
export function stepFor(deepest: number): number {
  return Math.max(12, Math.min(90, Math.round(FILL_MS / Math.max(1, deepest + 1))));
}

/**
 * The state of every piece of a board whose pieces face as `masks` say. A piece is named by the cell it was
 * given in, which is where it is unless it is in a block that turns as one (`blocks.ts`): the block carries it
 * round, so its water is read where it is now, and its quarters are the block's.
 */
export function cellStates(layout: Layout, masks: readonly number[] = layout.cells, quarters?: readonly number[], flow: Flow = flowOf(layout, masks)): CellState[] {
  const spills = new Set(flow.spills.map((spill) => spill.cell * 4 + spill.side));
  const info = blockInfo(layout);
  const turnsOfBlock = info.blocks.map((block) => blockQuartersBetween(layout.cells, masks, block) ?? 0);
  return layout.cells.map((base, cell) => {
    const at = info.of[cell] ?? -1;
    const turned = quarters?.[cell] ?? (at >= 0 ? turnsOfBlock[at]! : (quartersBetween(base, masks[cell]!) ?? 0));
    const place = at >= 0 ? placeAfter(info.blocks[at]!, cell, turned) : cell;
    const arms: [ArmState, ArmState, ArmState, ArmState] = ["", "", "", ""];
    if (flow.wet[place] === true) {
      for (let local = 0; local < 4; local += 1) {
        if (((base >> local) & 1) === 0) continue;
        const world = (((local + turned) % 4) + 4) % 4;
        arms[local] = spills.has(place * 4 + world) ? "leak" : world === flow.entry[place] ? "in" : "out";
      }
    }
    return { cell, quarters: turned, wet: flow.wet[place] === true, depth: flow.depth[place]!, arms };
  });
}

const ARM_PATH = ["M0 0V-50", "M0 0H50", "M0 0V50", "M0 0H-50"];
const DROP = "M0 -42C-5 -35 -7 -31 -7 -27a7 7 0 0 0 14 0c0-4-2-8-7-15z";
const GLYPH = "M0 -17C-9 -4 -12 1 -12 6a12 12 0 0 0 24 0c0-5-3-10-12-23z";

function armSvg(local: number, state: ArmState, water: boolean): string {
  const turn = local * 90;
  return `<g class="sd-arm" data-side="${local}" data-w="${water ? state : ""}" transform="rotate(${turn})"><path class="sd-in" pathLength="1" d="M0 -50V0"/><path class="sd-out" pathLength="1" d="M0 0V-50"/><g class="sd-leak"><path class="sd-cap" d="M-13 -48H13"/><path class="sd-drop" d="${DROP}"/></g></g>`;
}

/** A padlock, drawn about its own middle, 22 across: on the corner of a piece that cannot be turned. */
const LOCK = `<g class="sd-lock" transform="translate(31 -31)"><path class="sd-shackle" d="M-6 -1V-6a6 6 0 0 1 12 0V-1"/><rect class="sd-lockbody" x="-9" y="-2" width="18" height="13" rx="3"/></g>`;

function markSvg(role: "source" | "drain" | "plain"): string {
  if (role === "source") return `<g class="sd-mark"><circle class="sd-src" r="27"/><path class="sd-glyph" d="${GLYPH}"/></g>`;
  if (role === "drain") return `<g class="sd-mark"><circle class="sd-bowl" r="27"/><circle class="sd-fill" r="19"/></g>`;
  return "";
}

/** One cell: its ground, its piece turned as its state says, its mark if it has one, and a box to tap. */
function cellSvg(layout: Layout, state: CellState, x: number, y: number, water: boolean, block: Block | null = null): string {
  const base = layout.cells[state.cell]!;
  const role = layout.sources.includes(state.cell) ? "source" : layout.drains.includes(state.cell) ? "drain" : "plain";
  const local = SIDES.map((_, side) => side).filter((side) => ((base >> side) & 1) === 1);
  const edge = local.map((side) => ARM_PATH[side]!).join("");
  const piece =
    local.length === 0
      ? ""
      : `<path class="sd-edge" d="${edge}"/><circle class="sd-hub-edge" r="17"/><path class="sd-pipe" d="${edge}"/><circle class="sd-hub" r="13"/>${local.map((side) => armSvg(side, state.arms[side]!, water)).join("")}<circle class="sd-hubwater" r="7"/>`;
  const wet = water && state.wet;
  const locked = isLocked(layout, state.cell);
  const frame = locked ? `<rect class="sd-lockframe" x="-45" y="-45" width="90" height="90" rx="7"/>` : "";
  // A piece in a block turns about the middle of the block, so its box is the whole block, as the piece sees it.
  const at = block === null ? -1 : block.cells.indexOf(state.cell);
  const [boxX, boxY, boxSize] = block === null ? [-50, -50, 100] : [-50 - (at === 1 || at === 2 ? 100 : 0), -50 - (at === 2 || at === 3 ? 100 : 0), 200];
  const inBlock = block === null ? "" : ` data-block="${block.index}"`;
  return `<g class="sd-cell" data-cell="${state.cell}"${inBlock} data-shape="${shapeOf(base)}" data-role="${role}" data-locked="${locked}" data-wet="${wet}" style="--k:${wet ? state.depth : 0}" transform="translate(${x} ${y})"><rect class="sd-ground" x="-49" y="-49" width="98" height="98" rx="9"/>${frame}<g class="sd-turn" style="--q:${state.quarters}"><rect class="sd-box" x="${boxX}" y="${boxY}" width="${boxSize}" height="${boxSize}"/>${piece}</g>${markSvg(role)}${locked ? LOCK : ""}<rect class="sd-hit" x="-50" y="-50" width="100" height="100" fill="transparent"/></g>`;
}

/**
 * The plates under the blocks of a board, each the ground of its four cells: a big piece is one solid plate with a heavy
 * rim, and a block of four pieces that turn together a plate with a dashed rim. Drawn before every cell, so a piece
 * turned into the place of one drawn after it is still seen.
 */
function platesSvg(layout: Layout): string {
  return blockInfo(layout)
    .blocks.map((block) => {
      const col = block.anchor % layout.width;
      const row = Math.floor(block.anchor / layout.width);
      return `<rect class="sd-plate" data-kind="${block.big ? "big" : "turn"}" data-block="${block.index}" x="${col * 100 + 2}" y="${row * 100 + 2}" width="196" height="196" rx="13"/>`;
    })
    .join("");
}

/** The marks that say where each block turns: a ring with an arrow in it at the corner where its four cells meet. Drawn over the cells, and never pressed: a tap goes through to the cells under it. */
function pivotsSvg(layout: Layout): string {
  return blockInfo(layout)
    .blocks.map((block) => {
      const col = block.anchor % layout.width;
      const row = Math.floor(block.anchor / layout.width);
      return `<g class="sd-pivot" data-kind="${block.big ? "big" : "turn"}" data-block="${block.index}" transform="translate(${col * 100 + 100} ${row * 100 + 100})"><circle class="sd-pivot-disc" r="17"/><path class="sd-pivot-arrow" d="M-6.5 -4.2A7.7 7.7 0 1 1 -6.5 4.2"/><path class="sd-pivot-head" d="M-10.6 3.4L-5.4 8.4L-3.6 1.4Z"/></g>`;
    })
    .join("");
}

/** The bars drawn for a board's walls, each across the edge it is on; on a board that wraps, a wall at the edge of the board is shown at both its sides. */
function wallsSvg(layout: Layout): string {
  const bars: string[] = [];
  const bar = (x: number, y: number, across: boolean): string => `<rect class="sd-wall" x="${across ? x : x - 7}" y="${across ? y - 7 : y}" width="${across ? 88 : 14}" height="${across ? 14 : 88}" rx="5"/>`;
  for (const edge of layout.walls ?? []) {
    const cell = edge >> 1;
    const col = cell % layout.width;
    const row = Math.floor(cell / layout.width);
    if ((edge & 1) === 0) {
      bars.push(bar((col + 1) * 100, row * 100 + 6, false));
      if (col === layout.width - 1) bars.push(bar(0, row * 100 + 6, false));
    } else {
      bars.push(bar(col * 100 + 6, (row + 1) * 100, true));
      if (row === layout.height - 1) bars.push(bar(col * 100 + 6, 0, true));
    }
  }
  return bars.join("");
}

const escape = (text: string): string => text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * A board as SVG text. The pieces face as `options.masks` say, with the water
 * in them as it runs from the pumps through every opening that meets another.
 * The drawing is `class="suido"`; its colours and its flowing are `SUIDO_STYLE`.
 */
export function drawSuido(layout: Layout, options: DrawOptions = {}): string {
  const masks = options.masks ?? layout.cells;
  const flow = flowOf(layout, masks);
  const water = options.water !== false;
  const step = options.step ?? stepFor(Math.max(0, ...flow.depth));
  const width = layout.width * 100;
  const height = layout.height * 100;
  const states = cellStates(layout, masks, options.quarters, flow);
  const info = blockInfo(layout);
  const cells = states.map((state) => cellSvg(layout, state, (state.cell % layout.width) * 100 + 50, Math.floor(state.cell / layout.width) * 100 + 50, water, info.of[state.cell]! >= 0 ? info.blocks[info.of[state.cell]!]! : null)).join("");
  const solved = flow.solved;
  const label = options.label ?? `Suido board, ${layout.width} by ${layout.height}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" class="suido" viewBox="0 0 ${width} ${height}" role="group" aria-label="${escape(label)}" data-solved="${solved}" style="--sd-step:${step}ms">${options.style === true ? `<style>${SUIDO_STYLE}</style>` : ""}<rect class="sd-board" width="${width}" height="${height}" rx="12"/>${platesSvg(layout)}${cells}${pivotsSvg(layout)}${wallsSvg(layout)}${layout.wrap ? `<rect class="sd-rim" x="3" y="3" width="${width - 6}" height="${height - 6}" rx="10"/>` : ""}</svg>`;
}

/**
 * A board as a small picture, in a few dozen elements however big the board is: for a page that shows a
 * whole block of levels at once. The pipes are one path, the water in them (where the pieces face as
 * `masks` say and the water reaches) another, with the pumps, the drains, the padlocks and the walls on
 * them. It carries no cells to tap and nothing that moves; it is `class="suido"` so it takes the same colours.
 */
export function drawSuidoThumb(layout: Layout, options: { masks?: readonly number[]; label?: string; style?: boolean; water?: boolean } = {}): string {
  const masks = options.masks ?? layout.cells;
  const flow = flowOf(layout, masks);
  const width = layout.width * 100;
  const height = layout.height * 100;
  const dry: string[] = [];
  const wet: string[] = [];
  const marks: string[] = [];
  const sources = new Set(layout.sources);
  const drains = new Set(layout.drains);
  masks.forEach((mask, cell) => {
    if (mask === 0) return;
    const x = (cell % layout.width) * 100 + 50;
    const y = Math.floor(cell / layout.width) * 100 + 50;
    const into = options.water !== false && flow.wet[cell] === true ? wet : dry;
    for (const side of SIDES.map((_, at) => at)) if (((mask >> side) & 1) === 1) (into === wet ? wet : dry).push(`M${x} ${y}${["v-50", "h50", "v50", "h-50"][side]}`);
    if (sources.has(cell)) marks.push(`<circle class="sd-src" cx="${x}" cy="${y}" r="27"/>`);
    else if (drains.has(cell)) marks.push(`<circle class="sd-bowl" cx="${x}" cy="${y}" r="27"/>${options.water !== false && flow.wet[cell] === true ? `<circle class="sd-fill" style="transform:none" cx="${x}" cy="${y}" r="19"/>` : ""}`);
    if (isLocked(layout, cell)) marks.push(`<rect class="sd-lockbody" x="${x + 22}" y="${y - 40}" width="18" height="18" rx="4"/>`);
  });
  const label = options.label ?? `Suido board, ${layout.width} by ${layout.height}`;
  const all = [...dry, ...wet].join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" class="suido" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escape(label)}" data-solved="${flow.solved}">${options.style === true ? `<style>${SUIDO_STYLE}</style>` : ""}<rect class="sd-board" width="${width}" height="${height}" rx="12"/>${platesSvg(layout)}<path class="sd-edge" d="${all}"/><path class="sd-pipe" d="${all}"/><path class="sd-thumbwater" d="${wet.join("")}"/>${marks.join("")}${wallsSvg(layout)}${layout.wrap ? `<rect class="sd-rim" x="3" y="3" width="${width - 6}" height="${height - 6}" rx="10"/>` : ""}</svg>`;
}

/** One piece on its own, as SVG text: for a legend, an icon, or a page that shows how the pieces look. `wet` fills it with water. */
export function drawPiece(mask: number, options: { wet?: boolean; label?: string; style?: boolean } = {}): string {
  const base = { width: 1, height: 1, kind: "network" as const, wrap: false, cells: [mask], sources: [], drains: [] };
  const arms = [0, 1, 2, 3].map((side) => (((mask >> side) & 1) === 1 && options.wet === true ? "out" : "")) as CellState["arms"];
  const state: CellState = { cell: 0, quarters: 0, wet: options.wet === true, depth: 0, arms };
  const label = options.label ?? shapeOf(mask);
  return `<svg xmlns="http://www.w3.org/2000/svg" class="suido" viewBox="0 0 100 100" role="img" aria-label="${escape(label)}" style="--sd-step:0ms">${options.style === true ? `<style>${SUIDO_STYLE}</style>` : ""}${cellSvg(base, state, 50, 50, true)}</svg>`;
}

