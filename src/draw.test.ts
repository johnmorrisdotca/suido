import { describe, expect, it } from "vitest";

import { decodeLayout } from "./code.ts";
import { cellStates, drawPiece, drawSuido, stepFor } from "./draw.ts";
import { flowOf } from "./flow.ts";
import { makeUnscored } from "./generate.ts";
import { SUIDO_STYLE } from "./style.ts";

/** Every tag opened is closed, in order: a drawing that a browser's parser or a file viewer would take. */
function wellFormed(svg: string): void {
  const stack: string[] = [];
  for (const tag of svg.matchAll(/<(\/?)([a-zA-Z][\w-]*)([^>]*?)(\/?)>/g)) {
    const [, closing, name, , selfClosing] = tag;
    if (selfClosing === "/") continue;
    if (closing === "/") expect(stack.pop(), svg.slice(0, 200)).toBe(name);
    else stack.push(name!);
  }
  expect(stack).toEqual([]);
}

const made = makeUnscored({ size: 6, seed: 7, sources: 2 });

describe("the drawing of a board", () => {
  it("is well formed SVG with a cell for every cell, however it is turned", () => {
    for (const masks of [made.layout.cells, made.solution]) {
      const svg = drawSuido(made.layout, { masks });
      expect(svg.startsWith("<svg ")).toBe(true);
      wellFormed(svg);
      expect(svg.match(/class="sd-cell"/g)).toHaveLength(36);
      expect(svg).toContain('viewBox="0 0 600 600"');
    }
  });

  it("marks the pumps and the drains, once each", () => {
    const svg = drawSuido(made.layout);
    expect(svg.match(/data-role="source"/g)).toHaveLength(2);
    expect(svg.match(/data-role="drain"/g)).toHaveLength(made.layout.drains.length);
    expect(svg.match(/class="sd-src"/g)).toHaveLength(2);
  });

  it("has water exactly where the water is, in the answer and as the board is given", () => {
    for (const masks of [made.layout.cells, made.solution]) {
      const flow = flowOf(made.layout, masks);
      const svg = drawSuido(made.layout, { masks });
      expect(svg.match(/data-wet="true"/g) ?? []).toHaveLength(flow.wetPieces);
      expect(svg).toContain(`data-solved="${flow.solved}"`);
    }
    expect(drawSuido(made.layout, { masks: made.solution })).toContain('data-solved="true"');
    expect(drawSuido(made.layout, { masks: made.solution, water: false })).not.toContain('data-wet="true"');
  });

  it("says, for each arm of a wet piece, where the water comes in, goes out or leaks", () => {
    const flow = flowOf(made.layout);
    const states = cellStates(made.layout, made.layout.cells, undefined, flow);
    const leaking = states.flatMap((state) => state.arms.filter((arm) => arm === "leak"));
    expect(leaking).toHaveLength(flow.spills.length);
    for (const state of states) {
      if (!state.wet) expect(state.arms).toEqual(["", "", "", ""]);
      else if (made.layout.sources.includes(state.cell)) expect(state.arms.filter((arm) => arm === "in")).toHaveLength(0);
      else expect(state.arms.filter((arm) => arm === "in")).toHaveLength(1);
    }
    expect(states.map((state) => state.depth)).toEqual(flow.depth);
  });

  it("turns a piece by the turns it was given, as far as it was tapped, and reads them from the facing when it is not told", () => {
    const solved = cellStates(made.layout, made.solution);
    for (const state of solved) expect([0, 1, 2, 3]).toContain(state.quarters);
    const tapped = cellStates(made.layout, made.solution, made.solution.map(() => 5));
    expect(tapped.every((state) => state.quarters === 5)).toBe(true);
    expect(drawSuido(made.layout, { masks: made.solution, quarters: made.solution.map(() => -3) })).toContain("--q:-3");
  });

  it("carries the arms of the piece as the board gave it and its turn, so a turn is a rotation about the middle", () => {
    const svg = drawSuido(made.layout, { masks: made.solution });
    const first = made.layout.cells.findIndex((mask) => mask !== 0 && mask !== 15 && mask !== 5 && mask !== 10);
    expect(first).toBeGreaterThan(-1);
    expect(svg).toContain(`data-cell="${first}"`);
    expect(svg).toContain("transform=\"translate(");
  });

  it("fills in the style only when asked, and leaves nothing in it that runs", () => {
    expect(drawSuido(made.layout)).not.toContain("<style>");
    const alone = drawSuido(made.layout, { style: true });
    expect(alone).toContain("<style>");
    wellFormed(alone);
    for (const svg of [alone, drawSuido(made.layout), drawPiece(5, { style: true })]) {
      expect(svg).not.toMatch(/<script|javascript:|onload|onclick|<foreignObject|<image|href=/i);
    }
  });

  it("describes itself for a screen reader, and says what it is told to, escaped", () => {
    expect(drawSuido(made.layout)).toContain('aria-label="Suido board, 6 by 6"');
    expect(drawSuido(made.layout, { label: 'A "board" <b>' })).toContain('aria-label="A &quot;board&quot; &lt;b&gt;"');
  });

  it("draws a rim round a board whose edges join, and none round one whose edges do not", () => {
    expect(drawSuido(made.layout)).not.toContain("sd-rim");
    const wrapped = makeUnscored({ size: 5, seed: 1, wrap: true });
    expect(drawSuido(wrapped.layout)).toContain("sd-rim");
  });

  it("can be drawn for a board of any shape", () => {
    const board = makeUnscored({ width: 9, height: 4, seed: 2, kind: "drains" });
    const svg = drawSuido(board.layout, { masks: board.solution });
    wellFormed(svg);
    expect(svg).toContain('viewBox="0 0 900 400"');
    expect(svg.match(/class="sd-cell"/g)).toHaveLength(36);
  });

  it("sets the water's pace so that the deepest cell is reached in about two seconds, and never slower than 90 ms a cell", () => {
    expect(stepFor(0)).toBe(90);
    expect(stepFor(10)).toBe(90);
    expect(stepFor(60)).toBeLessThanOrEqual(33);
    expect(stepFor(60) * 61).toBeLessThanOrEqual(2100);
    expect(stepFor(10_000)).toBeGreaterThanOrEqual(12);
    expect(drawSuido(made.layout, { step: 25 })).toContain("--sd-step:25ms");
  });
});

describe("the drawing of one piece", () => {
  it("is well formed for every piece, wet or dry", () => {
    for (let mask = 0; mask < 16; mask += 1) {
      wellFormed(drawPiece(mask));
      wellFormed(drawPiece(mask, { wet: true }));
    }
    expect(drawPiece(3, { wet: true }).match(/data-w="out"/g)).toHaveLength(2);
    expect(drawPiece(3).match(/data-w="out"/g)).toBeNull();
    expect(drawPiece(0)).not.toContain("sd-arm");
    expect(drawPiece(5, { label: "A straight" })).toContain('aria-label="A straight"');
  });
});

describe("the style", () => {
  it("lets nothing on the board be selected, dragged or double-tapped", () => {
    expect(SUIDO_STYLE).toContain("user-select: none");
    expect(SUIDO_STYLE).toContain("-webkit-user-select: none");
    expect(SUIDO_STYLE).toContain("touch-action: manipulation");
    expect(SUIDO_STYLE).toContain("-webkit-touch-callout: none");
  });

  it("stills the water for anybody who asks for less motion", () => {
    const reduced = SUIDO_STYLE.slice(SUIDO_STYLE.indexOf("prefers-reduced-motion"));
    expect(reduced).toContain("--sd-step: 0ms");
    expect(reduced).toContain("transition: none");
  });

  it("is dark when the device is, or the page says, and light otherwise", () => {
    expect(SUIDO_STYLE).toContain("prefers-color-scheme: dark");
    expect(SUIDO_STYLE).toContain(':root[data-theme="dark"]');
    expect(SUIDO_STYLE).toContain(':root:not([data-theme="light"])');
  });

  it("is balanced", () => {
    expect(SUIDO_STYLE.split("{").length).toBe(SUIDO_STYLE.split("}").length);
    expect(decodeLayout(made.code)).not.toBeNull();
  });
});
