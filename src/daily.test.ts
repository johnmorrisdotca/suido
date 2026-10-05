import { describe, expect, it } from "vitest";

import { dailySuidoLevel, isSuidoDay, SUIDO_DAILY_STRIDE, suidoDay } from "./daily.ts";
import { SUIDO_LEVEL_COUNTS, SUIDO_SIZES } from "./levelCounts.ts";

const dayAfter = (day: string, by: number): string => new Date(Date.parse(`${day}T00:00:00Z`) + by * 86_400_000).toISOString().slice(0, 10);

describe("the level of the day", () => {
  it("is a level the size has, for every size, on any day", () => {
    for (const size of SUIDO_SIZES) for (let by = 0; by < 400; by += 1) {
      const level = dailySuidoLevel(size, dayAfter("2026-10-01", by));
      expect(Number.isInteger(level), `${size} ${by}`).toBe(true);
      expect(level!).toBeGreaterThanOrEqual(1);
      expect(level!).toBeLessThanOrEqual(SUIDO_LEVEL_COUNTS[size]!);
    }
  });

  it("is the same on every call, whether it is given a date's text or a moment of that day", () => {
    expect(dailySuidoLevel("7x7", "2026-10-01")).toBe(dailySuidoLevel("7x7", new Date("2026-10-01T23:59:59Z")));
    expect(dailySuidoLevel("7x7", "2026-10-01")).toBe(dailySuidoLevel("7x7", new Date("2026-10-01T00:00:00Z")));
    expect(dailySuidoLevel("7x7", "2026-10-01")).not.toBe(dailySuidoLevel("7x7", "2026-10-02"));
  });

  it("is pinned: these are the levels of 1 October 2026 at every size, so a change to the rule is a change that is seen", () => {
    expect(SUIDO_SIZES.map((size) => dailySuidoLevel(size, "2026-10-01"))).toEqual([207, 103, 31, 167, 63, 21, 39, 205, 243, 77, 245, 106, 248, 23, 23, 56]);
  });

  it("visits every level of a size once before any comes round again", () => {
    for (const size of SUIDO_SIZES) {
      const count = SUIDO_LEVEL_COUNTS[size]!;
      const seen = new Set(Array.from({ length: count }, (_, by) => dailySuidoLevel(size, dayAfter("2026-01-01", by))));
      expect(seen.size, size).toBe(count);
    }
  });

  it("has a stride that shares no factor with any size's count of levels, which is what makes that so", () => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    for (const count of Object.values(SUIDO_LEVEL_COUNTS)) expect(gcd(SUIDO_DAILY_STRIDE, count)).toBe(1);
  });

  it("says null for a size there are no levels of, and refuses a day that is not one", () => {
    expect(dailySuidoLevel("3x3", "2026-10-01")).toBeNull();
    expect(() => dailySuidoLevel("7x7", "2026-02-30")).toThrow(RangeError);
    expect(() => dailySuidoLevel("7x7", new Date("nope"))).toThrow(RangeError);
    expect(() => suidoDay("tomorrow")).toThrow(RangeError);
  });

  it("reads a day as UTC, and knows a real date from an impossible one", () => {
    expect(suidoDay(new Date("2026-10-01T23:30:00-07:00"))).toBe("2026-10-02");
    expect(isSuidoDay("2028-02-29")).toBe(true);
    expect(isSuidoDay("2027-02-29")).toBe(false);
    expect(isSuidoDay("2026-1-1")).toBe(false);
  });
});
