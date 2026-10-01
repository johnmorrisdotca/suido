import { describe, expect, it } from "vitest";

import { checkSuidoAnswer } from "./check.ts";
import { canTurn, flowOfGame, gameCode, hintFor, isGameSolved, newGame, tapsToAnswer, turnAt } from "./game.ts";
import { makeUnscored } from "./generate.ts";
import { quartersBetween, shapeOf, turn } from "./pieces.ts";

const made = makeUnscored({ size: 6, seed: 7 });

describe("a game", () => {
  it("starts with every piece as given, no turns, and no board that is not a board", () => {
    const game = newGame(made.code)!;
    expect(game.masks).toEqual(made.layout.cells);
    expect(game.quarters.every((quarters) => quarters === 0)).toBe(true);
    expect(game.turns).toBe(0);
    expect(newGame("nonsense")).toBeNull();
  });

  it("turns a piece a quarter on a tap, and counts it, leaving the game it was given alone", () => {
    const game = newGame(made.code)!;
    const index = made.layout.cells.findIndex((mask) => shapeOf(mask) === "elbow");
    const next = turnAt(game, index);
    expect(next.masks[index]).toBe(turn(game.masks[index]!, 1));
    expect(next.quarters[index]).toBe(1);
    expect(next.turns).toBe(1);
    expect(game.masks[index]).toBe(made.layout.cells[index]);
    expect(game.turns).toBe(0);
    const back = turnAt(next, index, -1);
    expect(back.masks).toEqual(game.masks);
    expect(back.quarters[index]).toBe(0);
    expect(back.turns).toBe(2);
  });

  it("will not turn what cannot be turned, bare ground and a cross, and ignores a cell that is not there", () => {
    const board = makeUnscored({ size: 9, seed: 4, kind: "drains" });
    const game = newGame(board.code)!;
    const blank = board.layout.cells.indexOf(0);
    expect(canTurn(0)).toBe(false);
    expect(canTurn(15)).toBe(false);
    expect(canTurn(5)).toBe(true);
    expect(turnAt(game, blank)).toBe(game);
    expect(turnAt(game, 999)).toBe(game);
    expect(turnAt(game, -1)).toBe(game);
  });

  it("is solved when every piece faces the answer, and says the same as the check", () => {
    let game = newGame(made.code)!;
    expect(isGameSolved(game)).toBe(false);
    for (let cell = 0; cell < game.masks.length; cell += 1) {
      for (let n = quartersBetween(game.masks[cell]!, made.solution[cell]!)!; n > 0; n -= 1) game = turnAt(game, cell);
    }
    expect(isGameSolved(game)).toBe(true);
    expect(checkSuidoAnswer(made.code, gameCode(game))).toEqual({ ok: true });
    expect(flowOfGame(game).solved).toBe(true);
  });

  it("is kept as a code that checks like an answer", () => {
    const game = turnAt(newGame(made.code)!, 1);
    expect(gameCode(game)).toMatch(/^6x6:/);
    expect(checkSuidoAnswer(made.code, gameCode(game)).ok).toBe(false);
  });

  it("knows how many taps are left to the answer, either way round or clockwise only", () => {
    const game = newGame(made.code)!;
    const both = tapsToAnswer(game, made.solution);
    const clockwise = tapsToAnswer(game, made.solution, false);
    expect(both).toBeGreaterThan(0);
    expect(clockwise).toBeGreaterThanOrEqual(both);
    expect(tapsToAnswer({ ...game, masks: made.solution }, made.solution)).toBe(0);
    expect(tapsToAnswer(game, made.solution.map(() => 3))).toBe(Number.POSITIVE_INFINITY);
  });

  it("gives a hint: the piece nearest the pump that does not face its answer, and none when all do", () => {
    let game = newGame(made.code)!;
    const first = hintFor(game, made.solution)!;
    expect(game.masks[first]).not.toBe(made.solution[first]);
    for (let cell = 0; cell < game.masks.length; cell += 1) for (let n = quartersBetween(game.masks[cell]!, made.solution[cell]!)!; n > 0; n -= 1) game = turnAt(game, cell);
    expect(hintFor(game, made.solution)).toBeNull();
  });

  it("never hints at a spare piece in a drains board", () => {
    const board = makeUnscored({ size: 9, seed: 4, kind: "drains" });
    const game = newGame(board.code)!;
    const wet = flowOfGame({ ...game, masks: board.solution }).wet;
    for (let tries = 0, now = game; tries < 200; tries += 1) {
      const cell = hintFor(now, board.solution);
      if (cell === null) break;
      expect(wet[cell]).toBe(true);
      now = turnAt(now, cell);
      for (let n = quartersBetween(now.masks[cell]!, board.solution[cell]!)!; n > 0; n -= 1) now = turnAt(now, cell);
    }
  });
});
