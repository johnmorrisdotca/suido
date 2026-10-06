import { describe, expect, it } from "vitest";

import { blockInfo, turnBlock } from "./blocks.ts";
import { bruteForce, facingsOf } from "./brute.fixture.ts";
import { checkSuidoAnswer } from "./check.ts";
import { decodeLayout, encodeLayout, type Layout } from "./code.ts";
import { deduce } from "./deduce.ts";
import { cellStates, drawSuido, drawSuidoThumb } from "./draw.ts";
import { flowOf } from "./flow.ts";
import { canTurnAt, turnedToFaceAt, gameCode, gameFromCode, gameFromProgress, gameProgress, hintFor, isGameSolved, newGame, tapsToAnswer, turnAt } from "./game.ts";
import { laySuido, makeSuido, makeUnscored } from "./generate.ts";
import { SHAPE_MASKS, turn } from "./pieces.ts";
import { seededRandom } from "./random.ts";
import { solve } from "./solve.ts";
import { symmetryKey, transformLayout } from "./symmetry.ts";
import { twistsOf } from "./twists.ts";

/** Boards with squares that turn as one, as the generator lays them (so most have more than one answer). */
const laid = (seed: number): Layout =>
  laySuido({ width: 3 + (seed % 3), height: 3 + (seed % 2), seed, bigs: seed % 3 === 0 ? 1 : 0, blocks: seed % 3 === 1 ? 1 + (seed % 2) : seed % 3 === 2 ? 1 : 0, wrap: seed % 5 === 0, bias: (seed % 7) / 7, sources: seed % 11 === 0 ? 2 : 1 }).layout;

describe("the solver, with blocks", () => {
  it("counts answers as trying every way of facing every piece and turning every block does, on boards laid out as the generator lays them", () => {
    let compared = 0;
    const seen: Record<number, number> = {};
    for (let seed = 1; seed <= 3000 && compared < 120; seed += 1) {
      const layout = laid(seed);
      if (facingsOf(layout) > 60_000) continue;
      const expected = bruteForce(layout);
      const found = solve(layout, 1000);
      expect(found.count, JSON.stringify(layout)).toBe(expected);
      expect(found.complete).toBe(true);
      for (const solution of found.solutions) expect(flowOf(layout, solution).solved).toBe(true);
      seen[Math.min(expected, 3)] = (seen[Math.min(expected, 3)] ?? 0) + 1;
      compared += 1;
    }
    expect(compared).toBeGreaterThan(100);
    expect(seen[1] ?? 0).toBeGreaterThan(30);
    expect(Object.keys(seen).length).toBeGreaterThan(1);
  }, 60_000);

  it("counts them on boards of random pieces too, where a block's pieces need not join inside", () => {
    const random = seededRandom(11);
    const shapes = Object.values(SHAPE_MASKS);
    let compared = 0;
    for (let i = 0; i < 6000 && compared < 400; i += 1) {
      const width = 2 + Math.floor(random() * 4);
      const height = 2 + Math.floor(random() * 3);
      const count = width * height;
      const cells = Array.from({ length: count }, () => turn(shapes[1 + Math.floor(random() * 5)]!, Math.floor(random() * 4)));
      const source = Math.floor(random() * count);
      const col = Math.floor(random() * (width - 1));
      const row = Math.floor(random() * (height - 1));
      const anchor = row * width + col;
      if ([anchor, anchor + 1, anchor + width, anchor + width + 1].includes(source)) continue;
      const layout: Layout = { width, height, kind: "network", wrap: width >= 3 && height >= 3 && random() < 0.3, cells, sources: [source], drains: [], blocks: [anchor] };
      if (facingsOf(layout) > 30_000) continue;
      expect(solve(layout, 1000).count, encodeLayout(layout)).toBe(bruteForce(layout));
      compared += 1;
    }
    expect(compared).toBeGreaterThan(200);
  }, 60_000);

  it("is the solver it was without blocks, on boards with none: the same answers, the same search, the same deductions", () => {
    // Pinned from the solver before blocks: a board with none is solved as it always was, so every level keeps its difficulty.
    const made = makeUnscored({ size: 12, seed: 8 });
    const found = solve(made.layout, 2);
    expect([found.count, found.nodes, found.branches, found.forced]).toEqual([1, 21, 10, 138]);
    expect(deduce(made.layout, made.solution)).toEqual({ pieces: 144, glance: 24, settled: 138, rounds: 14 });
  });

  it("refuses a board that is not a network and has blocks", () => {
    const layout = { ...laid(3), kind: "drains" as const };
    expect(() => solve(layout)).toThrow("network");
  });
});

describe("a board made with blocks has exactly one answer", () => {
  it("with big pieces, in several sizes, with wrap and with two pumps", () => {
    for (const [size, bigs, wrap, sources] of [[5, 1, false, 1], [6, 2, false, 2], [8, 4, true, 1], [10, 8, false, 1], [12, 12, false, 3]] as const) {
      for (let seed = 1; seed <= 4; seed += 1) {
        const made = makeUnscored({ size, bigs, wrap, sources, seed });
        const layout = decodeLayout(made.code)!;
        expect(layout, made.code).toEqual(made.layout);
        expect(layout.bigs?.length ?? 0, made.code).toBeGreaterThan(0);
        expect(checkSuidoAnswer(made.code, made.answer), made.code).toEqual({ ok: true });
        const found = solve(layout, 2);
        expect(found.complete && found.count, made.code).toBe(1);
        expect(flowOf(layout).solved, made.code).toBe(false);
        expect(twistsOf(layout)).toContain("big-pieces");
      }
    }
  });

  it("with blocks that turn as one, and with both together, and with locked pieces and walls", () => {
    for (const options of [{ size: 6, blocks: 2 }, { size: 8, blocks: 5 }, { size: 9, blocks: 3, bigs: 3 }, { size: 9, blocks: 3, locked: 3, walls: 3 }, { width: 8, height: 12, blocks: 4, bigs: 2, wrap: true }]) {
      for (let seed = 1; seed <= 4; seed += 1) {
        const made = makeUnscored({ ...options, seed });
        const layout = decodeLayout(made.code)!;
        expect(layout, made.code).toEqual(made.layout);
        expect(checkSuidoAnswer(made.code, made.answer), made.code).toEqual({ ok: true });
        const found = solve(layout, 2);
        expect(found.complete && found.count, made.code).toBe(1);
        expect(found.solutions[0]).toEqual(made.solution);
        expect(flowOf(layout).solved, made.code).toBe(false);
        // A block turns as one: what it holds is the answer's block, turned.
        for (const block of blockInfo(layout).blocks) expect(turnBlock(layout.cells, block, 0).length).toBe(layout.cells.length);
      }
    }
  });

  it("the same seed makes the same board, and a seed with no blocks makes the board it always made", () => {
    expect(makeUnscored({ size: 7, bigs: 3, blocks: 2, seed: 9 }).code).toBe(makeUnscored({ size: 7, bigs: 3, blocks: 2, seed: 9 }).code);
    // Pinned from before blocks: the generator draws the same numbers for a board that has none.
    expect(makeUnscored({ size: 6, seed: 7 }).code).toBe("6x6:EbnCIB3b95f3aEIafI66Ead969B353IBb75I");
    expect(makeUnscored({ size: 7, kind: "drains", seed: 3 }).code).toBe("7x7d:akeaa60a0E03f9a566aa595C63a50c557950aB9c6ea36IIcC");
    expect(makeUnscored({ size: 6, wrap: true, locked: 2, walls: 2, seed: 5 }).code).toBe("6x6w:6I953fca75Cab9B5679a6bB6c6Bm3E3556BI;l12,34;w52,59");
  });

  it("asks for a difficulty as any board does, and refuses blocks on a board that is not a network", () => {
    const scored = makeSuido({ size: 8, bigs: 3, difficulty: 50, seed: 3, attempts: 8 });
    expect(scored.difficulty).toBeGreaterThanOrEqual(1);
    expect(scored.layout.bigs?.length).toBeGreaterThan(0);
    expect(() => makeUnscored({ size: 6, kind: "drains", bigs: 1 })).toThrow("network");
    expect(() => makeUnscored({ size: 6, kind: "inlet-outlet", blocks: 1 })).toThrow("network");
  });

  it("can be as big as a board gets", () => {
    const made = makeUnscored({ width: 20, height: 50, bigs: 40, blocks: 10, seed: 2 });
    expect(solve(made.layout, 2).count).toBe(1);
    expect(checkSuidoAnswer(made.code, made.answer)).toEqual({ ok: true });
  });
});

describe("the check, with blocks", () => {
  const made = makeUnscored({ size: 7, bigs: 3, blocks: 2, seed: 4 });
  const answer = decodeLayout(made.answer)!;
  const info = blockInfo(made.layout);

  it("accepts every block as the answer has it, and nothing else of the blocks", () => {
    expect(checkSuidoAnswer(made.code, made.answer)).toEqual({ ok: true });
    // Any other turn of a block is a block the board has, but it leaves the water open somewhere.
    const block = info.blocks[0]!;
    for (const by of [1, 2, 3]) {
      const turned = turnBlock(answer.cells, block, by);
      const same = blockInfo(made.layout).blocks.length > 0 && turned.join() === answer.cells.join();
      const result = checkSuidoAnswer(made.code, encodeLayout({ ...answer, cells: turned }));
      expect(result.ok, `block turned ${by}`).toBe(same);
    }
  });

  it("refuses a piece of a block turned alone, and a block that is another block", () => {
    const block = info.blocks[0]!;
    const cell = block.cells.find((one) => answer.cells[one] !== 15 && answer.cells[one] !== 0)!;
    const alone = answer.cells.map((mask, at) => (at === cell ? turn(mask, 1) : mask));
    const refused = checkSuidoAnswer(made.code, encodeLayout({ ...answer, cells: alone }));
    expect(refused.ok).toBe(false);
    const other = answer.cells.map((mask, at) => (at === block.cells[0] ? 15 : mask));
    expect(checkSuidoAnswer(made.code, encodeLayout({ ...answer, cells: other })).ok).toBe(false);
  });

  it("refuses an answer that has another set of blocks", () => {
    const missing = encodeLayout({ ...answer, blocks: [] });
    expect(checkSuidoAnswer(made.code, missing).ok).toBe(false);
  });
});

describe("a game, with blocks", () => {
  const made = makeUnscored({ size: 7, bigs: 3, blocks: 2, seed: 4 });
  const layout = made.layout;
  const info = blockInfo(layout);
  const block = info.blocks.find((one) => layout.blocks?.includes(one.anchor)) ?? info.blocks[0]!;

  it("turns the whole block on a tap on any of its cells, each piece moving round and turning with it", () => {
    const game = newGame(made.code)!;
    for (const cell of block.cells) {
      expect(canTurnAt(game, cell)).toBe(true);
      const next = turnAt(game, cell);
      expect(next.masks).toEqual(turnBlock(game.masks, block, 1));
      expect(next.turns).toBe(1);
      for (const inside of block.cells) expect(next.quarters[inside]).toBe(1);
      expect(next.quarters.filter((quarters) => quarters !== 0)).toHaveLength(4);
      expect(game.masks).toEqual(layout.cells);
    }
    const back = turnAt(turnAt(game, block.cells[0]!), block.cells[2]!, -1);
    expect(back.masks).toEqual(game.masks);
    expect(back.quarters.every((quarters) => quarters === 0)).toBe(true);
  });

  it("is solved when every block is turned to the answer's, counts the taps that takes, and lights a block's anchor for a hint", () => {
    let game = newGame(made.code)!;
    const solution = made.solution;
    const fewest = tapsToAnswer(game, solution);
    expect(fewest).toBeGreaterThan(0);
    while (!isGameSolved(game)) {
      const cell = hintFor(game, solution)!;
      expect(cell).not.toBeNull();
      const lit = blockInfo(game.start).blocks.find((one) => one.cells.includes(cell));
      if (lit !== undefined) expect(cell).toBe(lit.anchor);
      const before = tapsToAnswer(game, solution);
      game = turnAt(game, cell);
      // The piece the hint names is now closer to the answer, or the block is as far round again from it as it was.
      expect(tapsToAnswer(game, solution)).toBeLessThanOrEqual(before + 2);
      if (game.turns > 400) throw new Error("hints never solve it");
    }
    expect(checkSuidoAnswer(made.code, gameCode(game))).toEqual({ ok: true });
    expect(hintFor(game, solution)).toBeNull();
    expect(tapsToAnswer(game, solution)).toBe(0);
  });

  it("turns what a hint names to face the answer, the whole block for a block, and solves the board in as many hints as there are pieces and blocks out of place", () => {
    let game = newGame(made.code)!;
    let hints = 0;
    for (let cell = hintFor(game, made.solution); cell !== null; cell = hintFor(game, made.solution)) {
      const next = turnedToFaceAt(game, cell, made.solution);
      expect(next).not.toBe(game);
      game = next;
      hints += 1;
      if (hints > 200) throw new Error("hints never finish");
    }
    expect(isGameSolved(game)).toBe(true);
    expect(turnedToFaceAt(game, 0, made.solution)).toBe(game);
  });

  it("keeps a game half played as progress and as a code, and brings each back", () => {
    let game = newGame(made.code)!;
    game = turnAt(turnAt(game, block.cells[1]!), block.cells[3]!);
    const progress = gameProgress(game);
    expect(gameFromProgress(made.code, progress)).toEqual(game);
    const from = gameFromCode(made.code, gameCode(game))!;
    expect(from.masks).toEqual(game.masks);
    expect(from.quarters).toEqual(game.quarters);
    // A block turned unevenly, or one piece of it alone, is not a game of this board.
    expect(gameFromProgress(made.code, progress.replace(/^./, (digit) => String((Number(digit) + 1) % 4)))).toSatisfy((one) => one === null || block.cells.every((cell) => one.quarters[cell] === one.quarters[block.cells[0]!]));
    const bad = [...game.masks];
    bad[block.cells[0]!] = turn(bad[block.cells[0]!]!, 1);
    expect(gameFromCode(made.code, encodeLayout({ ...layout, cells: bad }))).toBeNull();
  });
});

describe("the drawing, with blocks", () => {
  const made = makeUnscored({ size: 7, bigs: 3, blocks: 2, seed: 4 });
  const layout = made.layout;
  const info = blockInfo(layout);

  it("has a plate under each block and a ring where it turns, a cell for every cell in order, and the same pieces inside", () => {
    const svg = drawSuido(layout);
    expect(svg.match(/class="sd-plate"/g)).toHaveLength(info.blocks.length);
    expect(svg.match(/class="sd-pivot"/g)).toHaveLength(info.blocks.length);
    expect(svg.match(/class="sd-cell"/g)).toHaveLength(49);
    const order = [...svg.matchAll(/class="sd-cell" data-cell="(\d+)"/g)].map((match) => Number(match[1]));
    expect(order).toEqual(Array.from({ length: 49 }, (_, cell) => cell));
    expect(drawSuidoThumb(layout)).toContain('class="sd-plate"');
  });

  it("reads the water of a piece where its block has carried it, and turns every piece of a block by the block's quarters", () => {
    const game = turnAt(newGame(made.code)!, info.blocks[0]!.anchor);
    const flow = flowOf(layout, game.masks);
    const states = cellStates(layout, game.masks, game.quarters, flow);
    const block = info.blocks[0]!;
    block.cells.forEach((cell, at) => {
      const place = block.cells[(at + 1) % 4]!;
      expect(states[cell]!.quarters).toBe(1);
      expect(states[cell]!.wet, `piece ${cell} now at ${place}`).toBe(flow.wet[place]);
      expect(states[cell]!.depth).toBe(flow.depth[place]);
    });
    // Without the quarters given, they are read from the pieces: the same.
    expect(cellStates(layout, game.masks, undefined, flow).map((state) => state.quarters)).toEqual(states.map((state) => state.quarters));
  });
});

describe("turning and mirroring a board with blocks", () => {
  it("keeps the blocks: every one of the eight is a board that reads back, with its answer", () => {
    for (let seed = 1; seed <= 6; seed += 1) {
      const made = makeUnscored({ width: 5 + (seed % 3), height: 6, bigs: 1 + (seed % 2), blocks: 1 + (seed % 3), seed });
      const keys = new Set<string>();
      for (let op = 0; op < 8; op += 1) {
        const turned = transformLayout({ ...made.layout, cells: made.solution }, op);
        const code = encodeLayout(turned);
        expect(decodeLayout(code), `${op} of ${made.code}`).not.toBeNull();
        expect(turned.bigs?.length ?? 0).toBe(made.layout.bigs?.length ?? 0);
        expect(turned.blocks?.length ?? 0).toBe(made.layout.blocks?.length ?? 0);
        expect(flowOf(turned).solved).toBe(true);
        keys.add(symmetryKey(turned, turned.cells));
      }
      expect(keys.size).toBe(1);
    }
  });
});
