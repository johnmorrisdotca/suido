import { SUIDO_BLOCK } from "./levelBlocks.ts";
import type { LevelRow } from "./levelCounts.ts";
import { declaredTwists } from "./levelRow.ts";
import { SUIDO_MARKS, SUIDO_ROLES } from "./levels/marks.data.ts";
import type { Twist } from "./twists.ts";

/**
 * WHAT A SUIDO LEVEL ASKS OF A PLAYER: the twists on it, where it sits in its
 * block's lesson, and how hard it measured. The 15th level of a block teaches
 * the block's twist and the 16th tests it; the other fourteen are plain in the
 * early blocks and mix twists in later.
 */

/** Where a level sits in its block's lesson: its 15th teaches the twist, its 16th tests it. `newOnes` are the twists no earlier level of the size has. */
export type TwistRole = { role: "teaches" | "tests"; twists: Twist[]; newOnes: Twist[] };

/** A level's part in its block's lesson, or null for a level that has none (1 to 14 of a block, or a 15th or 16th with no twist). */
export function twistRole(rows: readonly LevelRow[], level: number): TwistRole | null {
  const slot = ((level - 1) % SUIDO_BLOCK) + 1;
  const row = rows[level - 1];
  if (row === undefined || slot < SUIDO_BLOCK - 1) return null;
  const twists = declaredTwists(row);
  if (twists.length === 0) return null;
  const before = new Set(rows.slice(0, level - 1).flatMap(declaredTwists));
  return { role: slot === SUIDO_BLOCK - 1 ? "teaches" : "tests", twists, newOnes: twists.filter((each) => !before.has(each)) };
}

/** A level's measured difficulty, 1 (easiest) to 5, or null for a level the marks do not have: read without loading the size's boards. */
export function suidoMarks(size: string, level: number): number | null {
  const digit = SUIDO_MARKS[size]?.[level - 1];
  return digit === undefined ? null : Number(digit);
}

/** A level's part in its block's lesson, from the data the level script wrote (`marks.data.ts`), without its size's boards; null for none. */
export function suidoRole(size: string, level: number): TwistRole | null {
  return SUIDO_ROLES[size]?.[level] ?? null;
}
