import { describe, expect, it } from "vitest";

import { armsOf, EAST, NORTH, opposite, quartersBetween, rotationsOf, SHAPE_MASKS, shapeOf, SOUTH, tapsBetween, turn, WEST } from "./pieces.ts";

describe("the pieces", () => {
  it("name each of the sixteen masks by shape", () => {
    const names = [...Array(16).keys()].map(shapeOf);
    expect(names.filter((name) => name === "blank")).toHaveLength(1);
    expect(names.filter((name) => name === "end")).toHaveLength(4);
    expect(names.filter((name) => name === "straight")).toHaveLength(2);
    expect(names.filter((name) => name === "elbow")).toHaveLength(4);
    expect(names.filter((name) => name === "tee")).toHaveLength(4);
    expect(names.filter((name) => name === "cross")).toHaveLength(1);
    for (const [shape, mask] of Object.entries(SHAPE_MASKS)) expect(shapeOf(mask)).toBe(shape);
  });

  it("turn a quarter clockwise: north to east to south to west and round", () => {
    expect(turn(NORTH)).toBe(EAST);
    expect(turn(EAST)).toBe(SOUTH);
    expect(turn(SOUTH)).toBe(WEST);
    expect(turn(WEST)).toBe(NORTH);
    expect(turn(NORTH | EAST)).toBe(EAST | SOUTH);
    expect(turn(NORTH, -1)).toBe(WEST);
    expect(turn(NORTH, 4)).toBe(NORTH);
    expect(turn(NORTH, 5)).toBe(EAST);
    expect(turn(15, 1)).toBe(15);
  });

  it("turn four times to where they began, and keep their shape and their number of arms", () => {
    for (let mask = 0; mask < 16; mask += 1) {
      expect(turn(mask, 4)).toBe(mask);
      for (let quarters = 0; quarters < 4; quarters += 1) {
        expect(shapeOf(turn(mask, quarters))).toBe(shapeOf(mask));
        expect(armsOf(turn(mask, quarters))).toBe(armsOf(mask));
      }
    }
  });

  it("have as many facings as they look different: one for a cross, two for a straight, four for the rest", () => {
    expect(rotationsOf(0)).toEqual([0]);
    expect(rotationsOf(15)).toEqual([15]);
    expect(rotationsOf(NORTH | SOUTH)).toEqual([5, 10]);
    expect(rotationsOf(NORTH)).toEqual([1, 2, 4, 8]);
    expect(rotationsOf(NORTH | EAST)).toHaveLength(4);
    expect(rotationsOf(NORTH | EAST | SOUTH)).toHaveLength(4);
  });

  it("know the fewest turns between two facings, and refuse two that are not the same shape", () => {
    expect(quartersBetween(NORTH, NORTH)).toBe(0);
    expect(quartersBetween(NORTH, EAST)).toBe(1);
    expect(quartersBetween(NORTH, WEST)).toBe(3);
    expect(quartersBetween(NORTH, NORTH | EAST)).toBeNull();
    expect(quartersBetween(5, 10)).toBe(1);
    expect(tapsBetween(NORTH, WEST)).toBe(1);
    expect(tapsBetween(NORTH, WEST, false)).toBe(3);
    expect(tapsBetween(NORTH, SOUTH)).toBe(2);
    expect(tapsBetween(NORTH, 3)).toBeNull();
  });

  it("have an opposite side", () => {
    expect([0, 1, 2, 3].map(opposite)).toEqual([2, 3, 0, 1]);
  });
});
