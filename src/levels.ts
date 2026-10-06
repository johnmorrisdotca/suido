import type { LevelRow } from "./levelCounts.ts";
import { SUIDO_SIZES } from "./levelCounts.ts";

export * from "./levelsInfo.ts";

/**
 * EVERY SIZE'S LEVELS, LOADED WHEN ASKED: `@johnmorrisdotca/suido/levels`.
 * Each size is its own module, fetched only when that size is loaded, so a page
 * playing 5×5 never carries the other sizes. A page that wants one size and
 * nothing else can import it directly (`@johnmorrisdotca/suido/levels-5x5`).
 */

const loaded = new Map<string, readonly LevelRow[]>();

async function importSize(size: string): Promise<readonly LevelRow[]> {
  // Named one by one, so a bundler splits each size into its own chunk.
  if (size === "5x5") return (await import("./levels/size5x5.data.ts")).SUIDO_5X5;
  if (size === "6x6") return (await import("./levels/size6x6.data.ts")).SUIDO_6X6;
  if (size === "7x7") return (await import("./levels/size7x7.data.ts")).SUIDO_7X7;
  if (size === "8x8") return (await import("./levels/size8x8.data.ts")).SUIDO_8X8;
  if (size === "9x9") return (await import("./levels/size9x9.data.ts")).SUIDO_9X9;
  if (size === "10x10") return (await import("./levels/size10x10.data.ts")).SUIDO_10X10;
  if (size === "11x11") return (await import("./levels/size11x11.data.ts")).SUIDO_11X11;
  if (size === "12x12") return (await import("./levels/size12x12.data.ts")).SUIDO_12X12;
  if (size === "13x13") return (await import("./levels/size13x13.data.ts")).SUIDO_13X13;
  if (size === "14x14") return (await import("./levels/size14x14.data.ts")).SUIDO_14X14;
  if (size === "5x7") return (await import("./levels/size5x7.data.ts")).SUIDO_5X7;
  if (size === "6x10") return (await import("./levels/size6x10.data.ts")).SUIDO_6X10;
  if (size === "8x14") return (await import("./levels/size8x14.data.ts")).SUIDO_8X14;
  if (size === "20x20") return (await import("./levels/size20x20.data.ts")).SUIDO_20X20;
  if (size === "28x28") return (await import("./levels/size28x28.data.ts")).SUIDO_28X28;
  if (size === "20x50") return (await import("./levels/size20x50.data.ts")).SUIDO_20X50;
  throw new Error(`No Suido at ${size}.`);
}

/** A size's levels, loaded once and kept. */
export async function loadSuidoLevels(size: string): Promise<readonly LevelRow[]> {
  const already = loaded.get(size);
  if (already !== undefined) return already;
  const levels = await importSize(size);
  loaded.set(size, levels);
  return levels;
}

/** Every size's levels, loaded. */
export async function loadEverySuidoLevel(): Promise<void> {
  await Promise.all(SUIDO_SIZES.map((size) => loadSuidoLevels(size)));
}

/** A size already loaded, or a refusal: nothing answers for a list it does not have. */
export function suidoLevelsOf(size: string): readonly LevelRow[] {
  const levels = loaded.get(size);
  if (levels === undefined) throw new Error(`The ${size} Suido levels have not been loaded (loadSuidoLevels).`);
  return levels;
}

/** The level a board is, at a loaded size, or null for a board no level has. */
export function suidoLevelOf(size: string, board: string): number | null {
  const at = suidoLevelsOf(size).findIndex(([code]) => code === board);
  return at === -1 ? null : at + 1;
}

let bigLevels: readonly LevelRow[] | null = null;

/** The sixty-four big-pieces levels (`bigLevels.ts`), loaded once and kept: its own file, fetched only when asked for. */
export async function loadSuidoBigLevels(): Promise<readonly LevelRow[]> {
  if (bigLevels === null) bigLevels = (await import("./levels/big.data.ts")).SUIDO_BIG;
  return bigLevels;
}

/** The big-pieces levels already loaded, or a refusal: nothing answers for a list it does not have. */
export function suidoBigLevelsLoaded(): readonly LevelRow[] {
  if (bigLevels === null) throw new Error("The big-pieces levels have not been loaded (loadSuidoBigLevels).");
  return bigLevels;
}

/** The level a board is in the big-pieces set (1 to 64), once it is loaded, or null for a board no level has. */
export function suidoBigLevelOf(board: string): number | null {
  const at = suidoBigLevelsLoaded().findIndex(([code]) => code === board);
  return at === -1 ? null : at + 1;
}
