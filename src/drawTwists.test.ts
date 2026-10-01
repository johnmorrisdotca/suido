import { describe, expect, it } from "vitest";

import { decodeLayout } from "./code.ts";
import { drawSuido, drawSuidoThumb } from "./draw.ts";
import { makeUnscored } from "./generate.ts";

describe("drawing a board with twists", () => {
  it("marks a locked piece with a frame and a padlock, and draws none on a board with no locks", () => {
    const layout = decodeLayout("3x2:hbbB10;l1,5".replace("B10", "B1a"))!;
    const svg = drawSuido(layout);
    expect(svg.match(/data-locked="true"/g)).toHaveLength(2);
    expect(svg.match(/class="sd-lock"/g)).toHaveLength(2);
    expect(svg.match(/class="sd-lockframe"/g)).toHaveLength(2);
    const plain = drawSuido({ ...layout, locked: undefined });
    expect(plain).not.toContain("sd-lock\"");
    expect(plain).toContain('data-locked="false"');
  });

  it("draws each wall as a bar across its edge, and a wall at the edge of a board that wraps at both its sides", () => {
    const board = decodeLayout("3x3:h00000000;w0,3")!;
    const bars = drawSuido(board).match(/<rect class="sd-wall"[^>]*>/g)!;
    expect(bars).toHaveLength(2);
    // The east of cell 0 is the line x = 100; the south of cell 1 is the line y = 100.
    expect(bars[0]).toContain('x="93"');
    expect(bars[1]).toContain('y="93"');
    const wrapped = decodeLayout("3x3w:h00000000;w4,17")!;
    expect(drawSuido(wrapped).match(/<rect class="sd-wall"/g)).toHaveLength(4);
    expect(drawSuido(decodeLayout("3x3:h00000000")!)).not.toContain("sd-wall");
  });

  it("draws a board that is not square in its own shape, at any size", () => {
    for (const [width, height] of [
      [5, 7],
      [6, 10],
      [8, 14],
    ] as const) {
      const made = makeUnscored({ width, height, seed: 2 });
      const svg = drawSuido(made.layout);
      expect(svg).toContain(`viewBox="0 0 ${width * 100} ${height * 100}"`);
      expect(svg.match(/class="sd-cell"/g)).toHaveLength(width * height);
    }
  });
});

describe("a board drawn small", () => {
  it("is a few elements however big the board is, in the board's own shape", () => {
    const made = makeUnscored({ width: 8, height: 14, seed: 3, locked: 3, walls: 4 });
    const small = drawSuidoThumb(made.layout);
    expect(small).toContain('viewBox="0 0 800 1400"');
    expect(small.match(/<(path|rect|circle)/g)!.length).toBeLessThan(60);
    expect(small.length).toBeLessThan(drawSuido(made.layout).length / 5);
    expect(small).toContain("sd-wall");
    expect(small).toContain("sd-lockbody");
  });

  it("shows the water where the answer's pieces carry it, and none when asked for none", () => {
    const made = makeUnscored({ size: 6, seed: 4 });
    const solved = drawSuidoThumb(made.layout, { masks: made.solution });
    expect(solved).toContain('data-solved="true"');
    expect(solved).toMatch(/class="sd-thumbwater" d="M/);
    const dry = drawSuidoThumb(made.layout, { masks: made.solution, water: false });
    expect(dry).toContain('class="sd-thumbwater" d=""');
    expect(drawSuidoThumb(made.layout)).toContain('data-solved="false"');
  });

  it("can carry its own style, and says what it is for a screen reader", () => {
    const made = makeUnscored({ size: 5, seed: 5 });
    expect(drawSuidoThumb(made.layout, { style: true })).toContain("<style>");
    expect(drawSuidoThumb(made.layout, { label: "Level 3" })).toContain('aria-label="Level 3"');
    expect(drawSuidoThumb(made.layout)).toContain('aria-label="Suido board, 5 by 5"');
  });
});
