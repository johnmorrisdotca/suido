/**
 * THE LEVEL OF THE DAY. Suido's levels are fixed, so "today's level" needs no
 * seed and no server: it is a pure function of the date and the size, the same
 * board for everybody on every machine, which is what lets two people compare
 * a time on it.
 *
 * A day is written `YYYY-MM-DD` and counted in UTC, so the level turns over at
 * the same moment worldwide. Each size has a level of its own for the day. A
 * size steps through its levels by a fixed stride that shares no factor with
 * its count of levels, so every level of a size comes up once before any comes
 * up again (256 days), and two neighbouring days are far apart in the ladder
 * rather than creeping up it.
 */
import { SUIDO_LEVEL_COUNTS } from "./levelCounts.ts";

/** A calendar date, `YYYY-MM-DD`.
 *
 * @example
 * ```ts
 * import type { SuidoDay } from "@johnmorrisdotca/suido/levels";
 * import { suidoDay } from "@johnmorrisdotca/suido/levels";
 *
 * const value: SuidoDay = suidoDay("2026-10-12");
 * console.log(value);
 * ```
 */
export type SuidoDay = string;

const DAY_MS = 86_400_000;

/** Each day moves this many levels along a size's ladder, round to the start when it runs out. It is prime, and no size's count of levels is a multiple of it.
 *
 * @example
 * ```ts
 * import { SUIDO_DAILY_STRIDE } from "@johnmorrisdotca/suido/levels";
 * console.log(SUIDO_DAILY_STRIDE);
 * ```
 */
export const SUIDO_DAILY_STRIDE = 97;

/** Whether a text is a real date written `YYYY-MM-DD`: 2026-02-30 is not.
 *
 * @param text - The calendar date text to validate.
 * @returns Whether a text is a real date written `YYYY-MM-DD`: 2026-02-30 is not.
 * @example
 * ```ts
 * import { isSuidoDay } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(isSuidoDay("2026-10-12"));
 * ```
 */
export function isSuidoDay(text: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false;
  const at = Date.parse(`${text}T00:00:00Z`);
  return !Number.isNaN(at) && new Date(at).toISOString().slice(0, 10) === text;
}

/** The day a moment falls on, in UTC, or the same day if it is already written as one. Throws on a date that is not one.
 *
 * @param date - A UTC Date or valid YYYY-MM-DD string.
 * @returns The day a moment falls on, in UTC, or the same day if it is already written as one. Throws on a date that is not one.
 * @example
 * ```ts
 * import { suidoDay } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(suidoDay("2026-10-12"));
 * ```
 */
export function suidoDay(date: string | Date): SuidoDay {
  const day = typeof date === "string" ? date : Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
  if (!isSuidoDay(day)) throw new RangeError(`suido: ${typeof date === "string" ? date : "an invalid Date"} is not a day`);
  return day;
}

/** A number made from a size's name, so each size starts its ladder from a place of its own: FNV-1a, which is stable on every machine. */
function startOf(size: string): number {
  let hash = 2_166_136_261;
  for (const letter of size) hash = Math.imul(hash ^ letter.charCodeAt(0), 16_777_619) >>> 0;
  return hash;
}

/**
 * The level of the day at a size: a whole number from 1 to that size's count of levels, or null for a size there are
 * no levels of. It ignores which blocks a player has opened: today's level is open to everybody.
 *
 * @param size - The native widthxheight size string, such as 5x5.
 * @param date - A UTC Date or valid YYYY-MM-DD string.
 * @returns The level of the day at a size: a whole number from 1 to that size's count of levels, or null for a size there are no levels of. It ignores which blocks a player has opened: today's level is open to everybody.
 * @example
 * ```ts
 * import { dailySuidoLevel } from "@johnmorrisdotca/suido/levels";
 *
 * console.log(dailySuidoLevel("5x5","2026-10-12"));
 * ```
 */
export function dailySuidoLevel(size: string, date: string | Date): number | null {
  const count = SUIDO_LEVEL_COUNTS[size];
  if (count === undefined) return null;
  const days = Date.parse(`${suidoDay(date)}T00:00:00Z`) / DAY_MS;
  return ((days * SUIDO_DAILY_STRIDE + startOf(size)) % count) + 1;
}
