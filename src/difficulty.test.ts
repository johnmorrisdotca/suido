import { describe, expect, it } from "vitest";

import { blendOf, DIFFICULTY_WEIGHTS, difficultyOf, MEASURE_NAMES, measureSuido, percentileIn, quantilesOf, referenceFor, referenceKey, scoreOf } from "./difficulty.ts";
import { DIFFICULTY_REFERENCE, DIFFICULTY_SIDES } from "./difficulty.reference.ts";
import { makeUnscored } from "./generate.ts";

describe("percentiles", () => {
  const q = [0, 0, 0, 2, 4, 10];
  it("are 0 for a value no greater than the least, 1 for one beyond the greatest, and between for the rest", () => {
    expect(percentileIn(q, 0)).toBe(0);
    expect(percentileIn(q, -5)).toBe(0);
    expect(percentileIn(q, 11)).toBe(1);
    expect(percentileIn(q, 10)).toBeCloseTo(1);
    expect(percentileIn(q, 3)).toBeCloseTo((3 + 0.5) / 5);
    expect(percentileIn([5], 9)).toBe(0);
  });

  it("rise with the value", () => {
    let last = -1;
    for (let value = 0; value <= 12; value += 0.5) {
      const here = percentileIn(q, value);
      expect(here).toBeGreaterThanOrEqual(last);
      last = here;
    }
  });

  it("are made from the quantiles a set of values has", () => {
    expect(quantilesOf([1, 2, 3, 4, 5], 5)).toEqual([1, 2, 3, 4, 5]);
    expect(quantilesOf([5, 1, 3], 3)).toEqual([1, 3, 5]);
    expect(quantilesOf([0, 10], 3)).toEqual([0, 5, 10]);
  });
});

describe("the reference sets", () => {
  it("are there for every size, kind and wrap, each sorted, with a blend of a hundred and one", () => {
    expect(DIFFICULTY_SIDES.length).toBeGreaterThanOrEqual(10);
    expect(Math.min(...DIFFICULTY_SIDES)).toBeLessThanOrEqual(5);
    expect(Math.max(...DIFFICULTY_SIDES)).toBeGreaterThanOrEqual(12);
    for (const side of DIFFICULTY_SIDES) {
      for (const kind of ["network", "drains"] as const) {
        for (const wrap of [false, true]) {
          const set = DIFFICULTY_REFERENCE[referenceKey(side, kind, wrap)]!;
          expect(set, `${side} ${kind} ${wrap}`).toBeDefined();
          for (const name of MEASURE_NAMES) {
            expect(set[name]).toHaveLength(21);
            expect([...set[name]].sort((a, b) => a - b)).toEqual(set[name]);
          }
          expect(set.blend).toHaveLength(101);
          expect([...set.blend].sort((a, b) => a - b)).toEqual(set.blend);
        }
      }
    }
  });

  it("are found for a board by the nearest size, its kind and its wrap", () => {
    expect(referenceFor({ width: 8, height: 8, kind: "network", wrap: false })).toBe(DIFFICULTY_REFERENCE[referenceKey(8, "network", false)]);
    expect(referenceFor({ width: 8, height: 8, kind: "drains", wrap: true })).toBe(DIFFICULTY_REFERENCE[referenceKey(8, "drains", true)]);
    // The huge sides have sets of their own: 20×20 and 28×28 by their side, and a 20×50, whose side is the square root of its cells, among the 32s.
    expect(referenceFor({ width: 20, height: 20, kind: "network", wrap: false })).toBe(DIFFICULTY_REFERENCE[referenceKey(20, "network", false)]);
    expect(referenceFor({ width: 28, height: 28, kind: "drains", wrap: true })).toBe(DIFFICULTY_REFERENCE[referenceKey(28, "drains", true)]);
    expect(referenceFor({ width: 20, height: 50, kind: "network", wrap: false })).toBe(DIFFICULTY_REFERENCE[referenceKey(32, "network", false)]);
    expect(referenceFor({ width: 17, height: 17, kind: "network", wrap: false })).toBe(DIFFICULTY_REFERENCE[referenceKey(16, "network", false)]);
    // A side too big for any set is ranked among the biggest there is.
    expect(referenceFor({ width: 60, height: 60, kind: "inlet-outlet", wrap: false })).toBe(DIFFICULTY_REFERENCE[referenceKey(32, "inlet-outlet", false)]);
    expect(referenceFor({ width: 2, height: 3, kind: "network", wrap: false })).toBe(DIFFICULTY_REFERENCE[referenceKey(4, "network", false)]);
    expect(referenceFor({ width: 4, height: 16, kind: "network", wrap: false })).toBe(DIFFICULTY_REFERENCE[referenceKey(8, "network", false)]);
  });

  it("weigh every kind's measures to one", () => {
    for (const kind of ["network", "drains"] as const) expect(Object.values(DIFFICULTY_WEIGHTS[kind]).reduce((a, b) => a + b, 0)).toBeCloseTo(1);
    expect(DIFFICULTY_WEIGHTS.network.spares).toBe(0);
  });
});

describe("a board's difficulty", () => {
  it("is a whole number from 1 to 100", () => {
    for (let seed = 1; seed <= 20; seed += 1) {
      const made = makeUnscored({ size: 7, seed });
      const score = difficultyOf(made.layout, made.solution);
      expect(Number.isInteger(score)).toBe(true);
      expect(score).toBeGreaterThanOrEqual(1);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it("is spread over the whole range among boards the generator makes, as it is ranked among them", () => {
    for (const [size, kind] of [
      [6, "network"],
      [9, "drains"],
      [12, "network"],
    ] as const) {
      const scores = Array.from({ length: 150 }, (_, i) => {
        const made = makeUnscored({ size, kind, seed: 50_000 + i });
        return difficultyOf(made.layout, made.solution);
      });
      const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
      expect(mean, `${size} ${kind}`).toBeGreaterThan(40);
      expect(mean).toBeLessThan(60);
      expect(Math.min(...scores)).toBeLessThan(15);
      expect(Math.max(...scores)).toBeGreaterThan(85);
      const bands = [0, 0, 0, 0];
      for (const score of scores) bands[Math.min(3, Math.floor((score - 1) / 25))] += 1;
      for (const count of bands) expect(count).toBeGreaterThan(15);
    }
  });

  it("is higher for a board that needs more looking, with the other measures alike", () => {
    const made = makeUnscored({ size: 8, seed: 3 });
    const set = referenceFor(made.layout);
    const measure = measureSuido(made.layout, made.solution);
    const harder = { ...measure, rounds: measure.rounds + 20, unsettled: Math.min(1, measure.unsettled + 0.3), obscure: Math.min(1, measure.obscure + 0.2) };
    const easier = { ...measure, rounds: 0, unsettled: 0, obscure: 0, guessing: 0 };
    expect(scoreOf(harder, set)).toBeGreaterThan(scoreOf(measure, set));
    expect(scoreOf(easier, set)).toBeLessThan(scoreOf(measure, set));
    expect(blendOf(easier, set)).toBeLessThan(blendOf(harder, set));
  });

  it("counts guessing as nothing for a board that never needed any, and more the more the solver tried", () => {
    const set = referenceFor({ width: 12, height: 12, kind: "network", wrap: true });
    const base = measureSuido(makeUnscored({ size: 12, seed: 2, wrap: true }).layout, makeUnscored({ size: 12, seed: 2, wrap: true }).solution);
    const none = { ...base, guessing: 0 };
    const some = { ...base, guessing: 40 * 1_000_000 + 900 };
    expect(blendOf(some, set)).toBeGreaterThanOrEqual(blendOf(none, set));
  });

  it("measures a drains board's spares and a network's none", () => {
    const drains = makeUnscored({ size: 9, seed: 3, kind: "drains", spares: 1 });
    expect(measureSuido(drains.layout, drains.solution).spares).toBeGreaterThan(0.1);
    const bare = makeUnscored({ size: 9, seed: 3, kind: "drains", spares: 0 });
    expect(measureSuido(bare.layout, bare.solution).spares).toBe(0);
    const network = makeUnscored({ size: 9, seed: 3 });
    expect(measureSuido(network.layout, network.solution).spares).toBe(0);
  });
});
