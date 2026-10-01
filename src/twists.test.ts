import { describe, expect, it } from "vitest";

import { bruteForce, facingsOf } from "./brute.fixture.ts";
import { checkSuidoAnswer } from "./check.ts";
import { decodeLayout, encodeLayout, isLocked, neighboursOf, type Layout } from "./code.ts";
import { flowOf } from "./flow.ts";
import { canTurnAt, hintFor, newGame, turnAt } from "./game.ts";
import { laySuido, makeSuido, makeUnscored, type MakeOptions } from "./generate.ts";
import { armsOf, SHAPE_MASKS, turn } from "./pieces.ts";
import { seededRandom } from "./random.ts";
import { solve } from "./solve.ts";
import { isTwisted, SUIDO_TWISTS, twistsOf } from "./twists.ts";

describe("the twists a board has", () => {
  const plain: Layout = { width: 3, height: 3, kind: "network", wrap: false, cells: [3, 5, 1, 7, 15, 12, 1, 1, 1], sources: [4], drains: [] };

  it("are none for a plain board, and each is read from what the board says", () => {
    expect(twistsOf(plain)).toEqual([]);
    expect(isTwisted(plain)).toBe(false);
    expect(twistsOf({ ...plain, kind: "drains" })).toEqual(["drains"]);
    expect(twistsOf({ ...plain, sources: [4, 0] })).toEqual(["pumps"]);
    expect(twistsOf({ ...plain, locked: [1] })).toEqual(["locked"]);
    expect(twistsOf({ ...plain, walls: [0] })).toEqual(["walls"]);
    expect(twistsOf({ ...plain, wrap: true })).toEqual(["wrap"]);
    expect(twistsOf({ ...plain, kind: "inlet-outlet" })).toEqual(["inlet-outlet"]);
    expect(twistsOf({ ...plain, locked: [], walls: [] })).toEqual([]);
  });

  it("come in the order the levels teach them, and are kebab case", () => {
    expect(twistsOf({ ...plain, wrap: true, locked: [1], walls: [0], kind: "drains", sources: [0, 4] })).toEqual(["drains", "pumps", "locked", "walls", "wrap"]);
    for (const twist of SUIDO_TWISTS) expect(twist).toMatch(/^[a-z]+(-[a-z]+)*$/);
  });
});

describe("a board's code with twists", () => {
  const board: Layout = { width: 4, height: 3, kind: "drains", wrap: false, cells: [2, 10, 10, 8, 5, 0, 1, 3, 1, 4, 0, 1], sources: [0], drains: [3], locked: [1, 4], walls: [3, 12] };

  it("writes the locked pieces after the cells and the walls after them, and reads them back", () => {
    const code = encodeLayout(board);
    expect(code).toBe("4x3d:iaaI50131401;l1,4;w3,12");
    expect(decodeLayout(code)).toEqual(board);
    expect(encodeLayout({ ...board, locked: undefined })).toBe("4x3d:iaaI50131401;w3,12");
    expect(encodeLayout({ ...board, walls: [] })).toBe("4x3d:iaaI50131401;l1,4");
  });

  it("writes an inlet-outlet board with the flag i, before the wrap's w", () => {
    const path: Layout = { width: 3, height: 3, kind: "inlet-outlet", wrap: false, cells: [4, 10, 3, 0, 0, 5, 0, 0, 1], sources: [0], drains: [8], locked: [1] };
    expect(decodeLayout(encodeLayout(path))?.kind).toBe("inlet-outlet");
    const ok: Layout = { ...path, cells: [2, 10, 12, 0, 0, 5, 0, 0, 1] };
    const code = encodeLayout(ok);
    expect(code.startsWith("3x3i:")).toBe(true);
    expect(decodeLayout(code)).toEqual(ok);
  });

  it("refuses what is not a board: a list out of order, out of range or in the wrong place, a lock on bare ground, a wall off the board, a path of the wrong shape", () => {
    const bad = [
      "4x3d:iaaI50131401;l4,1",
      "4x3d:iaaI50131401;l1,1",
      "4x3d:iaaI50131401;l1,12",
      "4x3d:iaaI50131401;l",
      "4x3d:iaaI50131401;w24",
      "4x3d:iaaI50131401;w3,2",
      "4x3d:iaaI50131401;w3;l1",
      "4x3d:iaaI50131401;l5",
      // A wall on the east of the last column or the south of the last row is no edge on a board that does not wrap.
      "4x3d:iaaI50131401;w6",
      "4x3d:iaaI50131401;w17",
      "4x3di:gaaF50131401",
      "4x3iw:gaaF50131401",
      "4x3wi:gaaF50131401",
    ];
    for (const code of bad) expect(decodeLayout(code), code).toBeNull();
    // A path has one pump and one drain, each an end.
    expect(decodeLayout("3x3i:h0000000B")?.kind).toBe("inlet-outlet");
    expect(decodeLayout("3x3i:j0000000B")).toBeNull();
    expect(decodeLayout("3x3i:h00h0000B")).toBeNull();
    expect(decodeLayout("3x3i:h0000000D")).toBeNull();
    expect(decodeLayout("3x3i:h000000BB")).toBeNull();
  });

  it("allows a wall at the edge of a board that wraps, which is a real edge there", () => {
    const wrapped = decodeLayout("3x3w:h00000000;w4,5");
    expect(wrapped).not.toBeNull();
    const east = decodeLayout("3x3w:h00000000;w5")!;
    expect(east.walls).toEqual([5]);
    const edge = neighboursOf(east);
    // Edge 5 is the south of cell 2 (top right): the wall stands between cell 2 and cell 5.
    expect(edge[2 * 4 + 2]).toBe(-1);
    expect(edge[5 * 4 + 0]).toBe(-1);
    const lastColumn = decodeLayout("3x3w:h00000000;w4")!;
    expect(neighboursOf(lastColumn)[2 * 4 + 1]).toBe(-1);
    expect(neighboursOf(lastColumn)[0 * 4 + 3]).toBe(-1);
  });
});

describe("walls", () => {
  it("are edges the water does not cross, as the edge of the board is none, so a piece opening on one leaks", () => {
    // Edge 0 is the east of cell 0 and edge 3 the south of cell 1.
    const near = neighboursOf({ width: 3, height: 2, wrap: false, walls: [0, 3] });
    expect(near[0 * 4 + 1]).toBe(-1);
    expect(near[1 * 4 + 3]).toBe(-1);
    expect(near[1 * 4 + 2]).toBe(-1);
    expect(near[4 * 4 + 0]).toBe(-1);
    expect(near[1 * 4 + 1]).toBe(2);
    expect(near[0 * 4 + 2]).toBe(3);
    const cut = neighboursOf({ width: 3, height: 2, wrap: false, walls: [3] });
    expect(cut[1 * 4 + 2]).toBe(-1);
    expect(cut[4 * 4 + 0]).toBe(-1);
  });

  it("make the water run out where a pipe meets one, and stop it going on", () => {
    // A pump facing east into a straight, with a wall between: the pump leaks, the straight stays dry.
    const open: Layout = { width: 3, height: 1 + 1, kind: "network", wrap: false, cells: [2, 10, 8, 0, 0, 0], sources: [0], drains: [2] };
    expect(flowOf(open).solved).toBe(true);
    const walled: Layout = { ...open, walls: [0] };
    const flow = flowOf(walled, [2, 10, 8, 0, 0, 0]);
    expect(flow.solved).toBe(false);
    expect(flow.wet).toEqual([true, false, false, false, false, false]);
    expect(flow.spills).toEqual([{ cell: 0, side: 1 }]);
  });
});

describe("a locked piece", () => {
  const board: Layout = { width: 3, height: 2, kind: "network", wrap: false, cells: [2, 10, 8, 0, 0, 0], sources: [0], drains: [2], locked: [1] };

  it("is one whose cell is in the board's list", () => {
    expect(isLocked(board, 1)).toBe(true);
    expect(isLocked(board, 0)).toBe(false);
    expect(isLocked({}, 0)).toBe(false);
  });

  it("cannot be turned: a tap leaves the game as it was", () => {
    const game = newGame(encodeLayout(board))!;
    expect(canTurnAt(game, 1)).toBe(false);
    expect(turnAt(game, 1)).toBe(game);
    expect(turnAt(game, 1, -1)).toBe(game);
    expect(canTurnAt(game, 0)).toBe(true);
    expect(turnAt(game, 0).masks[0]).toBe(turn(2, 1));
    expect(turnAt(game, 0).turns).toBe(1);
  });

  it("is never what a hint points at, since it already faces its answer", () => {
    const game = newGame(encodeLayout({ ...board, cells: [4, 10, 8, 0, 0, 0] }))!;
    expect(hintFor(game, [2, 10, 8, 0, 0, 0])).toBe(0);
  });

  it("makes an answer wrong that turns it, and an answer that moves a wall or a lock wrong too", () => {
    const code = encodeLayout({ ...board, cells: [4, 5, 8, 0, 0, 0] });
    // The straight is locked facing north-south, where the water cannot go: no answer exists, and turning it is refused by name.
    expect(checkSuidoAnswer(code, encodeLayout({ ...board, cells: [2, 10, 8, 0, 0, 0] }))).toEqual({ ok: false, reason: "a locked piece was turned" });
    const free = encodeLayout({ ...board, cells: [4, 10, 8, 0, 0, 0] });
    expect(checkSuidoAnswer(free, encodeLayout({ ...board, cells: [2, 10, 8, 0, 0, 0] }))).toEqual({ ok: true });
    expect(checkSuidoAnswer(free, encodeLayout({ ...board, cells: [2, 10, 8, 0, 0, 0], locked: [] }))).toMatchObject({ ok: false });
    expect(checkSuidoAnswer(free, encodeLayout({ ...board, cells: [2, 10, 8, 0, 0, 0], walls: [5] }))).toMatchObject({ ok: false });
  });
});

describe("an inlet-outlet board", () => {
  it("is solved by one path from the pump to the drain with nothing open", () => {
    // The pump at the top left faces east, a straight and an elbow carry the water down the right side to the drain.
    const path: Layout = { width: 3, height: 3, kind: "inlet-outlet", wrap: false, cells: [2, 10, 6, 0, 7, 5, 0, 0, 1], sources: [0], drains: [8] };
    expect(flowOf(path).solved).toBe(false);
    const down = [2, 10, 12, 0, 0, 5, 0, 0, 1];
    expect(flowOf(path, down).solved).toBe(true);
    expect(flowOf(path, down).wet.filter(Boolean)).toHaveLength(5);
    expect(checkSuidoAnswer(encodeLayout({ ...path, cells: [4, 5, 6, 0, 7, 5, 0, 0, 1] }), encodeLayout({ ...path, cells: down }))).toMatchObject({ ok: false });
  });

  it("is not solved by a path that branches, however it ends", () => {
    // 4 cells in a row with a T in the middle whose third arm meets an end: the water reaches the drain and nothing leaks, but it branches.
    const row: Layout = { width: 3, height: 2, kind: "inlet-outlet", wrap: false, cells: [2, 14, 8, 0, 1, 0], sources: [0], drains: [2] };
    // The middle piece opens east, west and south, and the end below faces up.
    const tee = [2, 14, 8, 0, 1, 0];
    expect(flowOf(row, tee).wetDrains).toBe(1);
    expect(flowOf(row, tee).spills).toEqual([]);
    expect(flowOf(row, tee).solved).toBe(false);
    // The same water on a drains board is a solution: branches are fine there.
    expect(flowOf({ ...row, kind: "drains" }, tee).solved).toBe(true);
    // Without the branch it is solved.
    expect(flowOf(row, [2, 10, 8, 0, 1, 0]).solved).toBe(true);
    expect(checkSuidoAnswer(encodeLayout({ ...row, cells: [2, 7, 8, 0, 1, 0] }), encodeLayout({ ...row, cells: [2, 14, 8, 0, 1, 0] }))).toEqual({ ok: false, reason: "the water branches: it must run in one path from the inlet to the outlet" });
    expect(checkSuidoAnswer(encodeLayout({ ...row, cells: [2, 7, 8, 0, 1, 0] }), encodeLayout({ ...row, cells: [2, 10, 8, 0, 1, 0] }))).toEqual({ ok: false, reason: "a piece is not the piece the board has there" });
    expect(armsOf(14)).toBe(3);
  });
});

/** A board of random pieces with the twists asked for, small enough to try every way of facing it. */
function randomBoard(random: () => number, kind: Layout["kind"]): Layout {
  const width = 2 + Math.floor(random() * 3);
  const height = 2 + Math.floor(random() * 2);
  const count = width * height;
  const shapes = [SHAPE_MASKS.end, SHAPE_MASKS.straight, SHAPE_MASKS.elbow, SHAPE_MASKS.tee, SHAPE_MASKS.cross];
  const cells = Array.from({ length: count }, () => turn(shapes[Math.floor(random() * shapes.length)]!, Math.floor(random() * 4)));
  if (random() < 0.3) cells[Math.floor(random() * count)] = 0;
  const source = Math.floor(random() * count);
  let drain = Math.floor(random() * count);
  if (drain === source) drain = (drain + 1) % count;
  if (kind === "inlet-outlet") {
    cells[source] = turn(SHAPE_MASKS.end, Math.floor(random() * 4));
    cells[drain] = turn(SHAPE_MASKS.end, Math.floor(random() * 4));
  } else if (cells[source] === 0) cells[source] = 5;
  const layout: Layout = { width, height, kind, wrap: false, cells, sources: [source], drains: kind === "network" ? [] : cells[drain] === 0 ? [] : [drain] };
  if (kind === "inlet-outlet" && layout.drains.length === 0) return randomBoard(random, kind);
  // Half the boards have locked pieces and walls, so the others can still have many answers.
  const furnished = random() < 0.5;
  const locked = cells.flatMap((mask, cell) => (furnished && mask !== 0 && random() < 0.25 ? [cell] : []));
  if (locked.length > 0) layout.locked = locked;
  const walls: number[] = [];
  for (let cell = 0; cell < count && furnished; cell += 1) {
    if (cell % width !== width - 1 && random() < 0.12) walls.push(cell * 2);
    if (cell < count - width && random() < 0.12) walls.push(cell * 2 + 1);
  }
  if (walls.length > 0) layout.walls = walls;
  return layout;
}

describe("the solver counts answers as trying every way does, with locks, walls and an inlet and outlet", () => {
  it("on random small boards of every kind, with locked pieces and walls on some of them", () => {
    const random = seededRandom(11);
    const seen = { locked: 0, walls: 0, "inlet-outlet": 0, one: 0, many: 0, none: 0 };
    let compared = 0;
    for (let i = 0; i < 4000 && compared < 600; i += 1) {
      const kind = (["network", "drains", "inlet-outlet"] as const)[i % 3]!;
      const layout = randomBoard(random, kind);
      if (decodeLayout(encodeLayout(layout)) === null || facingsOf(layout) > 30_000) continue;
      const expected = bruteForce(layout);
      const found = solve(layout, 1000);
      expect(found.count, encodeLayout(layout)).toBe(expected);
      expect(found.complete).toBe(true);
      for (const solution of found.solutions) expect(flowOf(layout, solution).solved).toBe(true);
      compared += 1;
      if (layout.locked !== undefined) seen.locked += 1;
      if (layout.walls !== undefined) seen.walls += 1;
      if (kind === "inlet-outlet") seen["inlet-outlet"] += 1;
      if (expected === 0) seen.none += 1;
      else if (expected === 1) seen.one += 1;
      else seen.many += 1;
    }
    expect(compared).toBeGreaterThan(400);
    expect(seen.locked).toBeGreaterThan(100);
    expect(seen.walls).toBeGreaterThan(100);
    expect(seen["inlet-outlet"]).toBeGreaterThan(100);
    // The comparison is not only of boards with no answer.
    expect(seen.one).toBeGreaterThan(10);
    expect(seen.none).toBeGreaterThan(10);
    console.log(JSON.stringify(seen));
  }, 120_000);
});

describe("the solver counts as trying every way does, on boards laid out the way the generator lays them with locks and walls", () => {
  it("with every number of answers, in all three kinds", () => {
    let compared = 0;
    const seen: Record<number, number> = {};
    for (let seed = 1; seed <= 600 && compared < 90; seed += 1) {
      const kind = (["network", "drains", "inlet-outlet"] as const)[seed % 3]!;
      const layout = laySuido({ width: 3 + (seed % 2), height: 3, seed, kind, locked: seed % 5 === 0 ? 1 : 0, walls: seed % 4 === 0 ? 2 : 0, ...(kind === "drains" ? { drains: 2 } : {}), bias: (seed % 7) / 7 }).layout;
      if (facingsOf(layout) > 70_000) continue;
      const expected = bruteForce(layout);
      expect(solve(layout, 1000).count, encodeLayout(layout)).toBe(expected);
      seen[Math.min(expected, 3)] = (seen[Math.min(expected, 3)] ?? 0) + 1;
      compared += 1;
    }
    expect(compared).toBeGreaterThan(60);
    expect(seen[1] ?? 0).toBeGreaterThan(5);
    expect((seen[2] ?? 0) + (seen[3] ?? 0)).toBeGreaterThan(5);
  }, 120_000);
});

describe("makeSuido with twists", () => {
  /** Every board a generator makes is held to the same things: it decodes, its answer checks, the solver proves its one answer, and nothing starts solved. */
  function holds(options: MakeOptions): Layout {
    const made = makeUnscored(options);
    const layout = decodeLayout(made.code)!;
    expect(layout, made.code).toEqual(made.layout);
    expect(checkSuidoAnswer(made.code, made.answer), made.code).toEqual({ ok: true });
    const found = solve(layout, 2);
    expect(found.complete, made.code).toBe(true);
    expect(found.count, made.code).toBe(1);
    expect(flowOf(layout).solved, `${made.code} starts solved`).toBe(false);
    for (const cell of layout.locked ?? []) expect(layout.cells[cell], `locked ${cell} faces its answer`).toBe(made.solution[cell]);
    return layout;
  }

  it("makes boards with the locked pieces asked for, each facing as its answer has it", () => {
    for (const [size, locked] of [
      [5, 3],
      [8, 6],
      [12, 9],
    ] as const) {
      for (let seed = 1; seed <= 6; seed += 1) {
        const layout = holds({ size, locked, seed });
        expect(layout.locked?.length, `${size} ${seed}`).toBe(locked);
        expect(twistsOf(layout)).toEqual(["locked"]);
      }
    }
  });

  it("makes boards with the walls asked for, none across a pipe of the answer", () => {
    for (const [size, walls] of [
      [5, 3],
      [8, 6],
      [12, 9],
    ] as const) {
      for (let seed = 1; seed <= 6; seed += 1) {
        const layout = holds({ size, walls, seed });
        expect(layout.walls?.length, `${size} ${seed}`).toBe(walls);
        expect(twistsOf(layout)).toEqual(["walls"]);
      }
    }
  });

  it("makes inlet-outlet boards: the pump at the top left, the drain at the bottom right, and one path between", () => {
    for (const size of [4, 5, 8, 12]) {
      for (let seed = 1; seed <= 6; seed += 1) {
        const made = makeUnscored({ size, kind: "inlet-outlet", seed });
        const layout = holds({ size, kind: "inlet-outlet", seed });
        expect(layout.sources).toEqual([0]);
        expect(layout.drains).toEqual([size * size - 1]);
        expect(armsOf(layout.cells[0]!)).toBe(1);
        expect(armsOf(layout.cells[size * size - 1]!)).toBe(1);
        const flow = flowOf(layout, made.solution);
        expect(flow.solved).toBe(true);
        for (const cell of flow.order) expect(armsOf(made.solution[cell]!)).toBeLessThanOrEqual(2);
        expect(flow.wetPieces).toBeGreaterThanOrEqual(size * 2 - 1);
        expect(twistsOf(layout)).toEqual(["inlet-outlet"]);
      }
    }
  });

  it("makes boards that combine twists, on any shape of board", () => {
    holds({ size: 7, wrap: true, locked: 3, walls: 3, seed: 2 });
    holds({ size: 8, kind: "drains", locked: 2, walls: 4, sources: 2, seed: 3 });
    holds({ size: 9, kind: "inlet-outlet", locked: 2, walls: 3, seed: 4 });
    holds({ width: 8, height: 14, walls: 5, locked: 3, seed: 5 });
    holds({ width: 5, height: 7, kind: "inlet-outlet", seed: 6 });
    expect(twistsOf(holds({ size: 8, kind: "drains", locked: 2, walls: 4, sources: 2, seed: 3 }))).toEqual(["drains", "pumps", "locked", "walls"]);
  });

  it("makes the same board for the same seed and options, and a different one for a different seed", () => {
    const options: MakeOptions = { size: 8, kind: "drains", locked: 3, walls: 3 };
    expect(makeSuido({ ...options, seed: 5 }).code).toBe(makeSuido({ ...options, seed: 5 }).code);
    expect(makeSuido({ ...options, seed: 5 }).code).not.toBe(makeSuido({ ...options, seed: 6 }).code);
    expect(makeSuido({ size: 8, kind: "inlet-outlet", seed: 5 }).code).toBe(makeSuido({ size: 8, kind: "inlet-outlet", seed: 5 }).code);
  });

  it("scores a board of a twist against the boards of its size, and walls and locks make it easier", () => {
    const aimed = makeSuido({ size: 9, kind: "inlet-outlet", difficulty: 80, seed: 3 });
    expect(aimed.difficulty).toBeGreaterThanOrEqual(1);
    expect(aimed.difficulty).toBeLessThanOrEqual(100);
    expect(Math.abs(aimed.difficulty - 80)).toBeLessThan(25);
    const plain = Array.from({ length: 30 }, (_, i) => makeSuido({ size: 9, seed: 900 + i }).difficulty);
    const locked = Array.from({ length: 30 }, (_, i) => makeSuido({ size: 9, locked: 6, seed: 900 + i }).difficulty);
    expect(locked.reduce((a, b) => a + b, 0)).toBeLessThan(plain.reduce((a, b) => a + b, 0));
  });

  it("refuses an inlet-outlet board that wraps, has more pumps, or is too small to have a way", () => {
    expect(() => makeUnscored({ size: 6, kind: "inlet-outlet", wrap: true })).toThrow(/does not wrap/);
    expect(() => makeUnscored({ size: 6, kind: "inlet-outlet", sources: 2 })).toThrow(/one pump/);
    expect(() => makeUnscored({ size: 2, kind: "inlet-outlet" })).toThrow();
  });

  it("lays out boards with twists too, with no promise of one answer", () => {
    const laid = laySuido({ size: 6, locked: 4, walls: 4, seed: 9 });
    expect(decodeLayout(laid.code)).toEqual(laid.layout);
    expect(laid.layout.locked?.length ?? 0).toBeGreaterThanOrEqual(0);
  });
});
