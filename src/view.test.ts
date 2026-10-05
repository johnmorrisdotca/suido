import { describe, expect, it } from "vitest";

import { boxOf, clampView, needsZoom, panView, SUIDO_FIT, SUIDO_MOST_ZOOM, viewBoxOf, viewShowing, zoomAbout } from "./view.ts";

const box = boxOf({ width: 28, height: 28 });

describe("the view of a big board", () => {
  it("is the whole board at first, and is never past an edge or further in than the most", () => {
    expect(viewBoxOf(SUIDO_FIT, box)).toBe("0 0 2800 2800");
    expect(clampView({ zoom: 99, x: -50, y: 9999 }, box)).toEqual({ zoom: SUIDO_MOST_ZOOM, x: 0, y: 2800 - 2800 / SUIDO_MOST_ZOOM });
    expect(clampView({ zoom: 0.2, x: 40, y: 40 }, box)).toEqual(SUIDO_FIT);
    expect(viewBoxOf({ zoom: 2, x: 100, y: 200 }, box)).toBe("100 200 1400 1400");
  });

  it("zooms about a point, which stays where it was in the box", () => {
    const view = zoomAbout(SUIDO_FIT, 2, 700, 1400, box);
    expect(view.zoom).toBe(2);
    // The point (700, 1400) was 25% across and half way down the box; it still is.
    expect((700 - view.x) / (box.width / view.zoom)).toBeCloseTo(0.25, 5);
    expect((1400 - view.y) / (box.height / view.zoom)).toBeCloseTo(0.5, 5);
    // Zooming back out about it returns the whole board.
    expect(zoomAbout(view, 0.5, 700, 1400, box)).toEqual(SUIDO_FIT);
  });

  it("moves, and stops at the edges", () => {
    const view = { zoom: 4, x: 0, y: 0 };
    expect(panView(view, 300, 0, box).x).toBe(300);
    expect(panView(view, -300, -300, box)).toEqual(view);
    expect(panView(view, 99999, 99999, box)).toEqual({ zoom: 4, x: 2800 - 700, y: 2800 - 700 });
  });

  it("brings a cell into view by the least move, and leaves a cell already in view alone", () => {
    const view = { zoom: 4, x: 0, y: 0 };
    expect(viewShowing(view, box, 28, 0)).toEqual(view);
    const far = viewShowing(view, box, 28, 28 * 20 + 20);
    // The cell (column 20, row 20: 2000 to 2100) is wholly inside what is shown, with half a cell to spare where there is room.
    expect(far.x).toBe(2150 - 700);
    expect(far.y).toBe(2150 - 700);
    expect(viewShowing(far, box, 28, 28 * 20 + 20)).toEqual(far);
  });

  it("offers zoom where a piece would be under 22 pixels across, and nowhere else", () => {
    expect(needsZoom({ width: 28 }, 358)).toBe(true);
    expect(needsZoom({ width: 20 }, 358)).toBe(true);
    expect(needsZoom({ width: 14 }, 358)).toBe(false);
    expect(needsZoom({ width: 28 }, 700)).toBe(false);
    expect(needsZoom({ width: 28 }, 0)).toBe(false);
  });
});
