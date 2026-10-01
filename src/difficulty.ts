import type { Kind, Layout } from "./code.ts";
import { deduce } from "./deduce.ts";
import { DIFFICULTY_REFERENCE, DIFFICULTY_SIDES } from "./difficulty.reference.ts";
import { flowOf } from "./flow.ts";
import { solve } from "./solve.ts";

/**
 * HOW HARD A BOARD IS, MEASURED, 1 to 100 among boards of its own size.
 * A board is measured five ways, each a thing a player meets:
 *
 *  - OBSCURE: how little is plain at the first look. Of the pieces, the share
 *    whose facing is forced at once (by the edge, bare ground, a cross or a
 *    straight beside them), taken from 1.
 *  - ROUNDS: how many looks it takes. Each look fixes every piece that is now
 *    forced, and the next look has more to go on; a board that needs thirty
 *    looks is a long chain of "this forces that".
 *  - UNSETTLED: the share of the pieces left when looking forces nothing more.
 *    Where it is 0 the board can be worked out with no guess at all.
 *  - GUESSING: how much the solver had to try: the positions where it had more
 *    than one way on, and then how many positions it looked at. Every board that
 *    never needed a guess counts as no guessing alike.
 *  - SPARES: in a drains board, the share of the pieces that are spare: more
 *    pieces to see are not needed, and none of them says which.
 *
 * Each is turned into a percentile among a reference set of boards of the same
 * size, kind and wrap (`DIFFICULTY_REFERENCE`, made by `scripts/suido-reference.ts`
 * from boards of the package's own generator), and the percentiles are blended
 * by `DIFFICULTY_WEIGHTS`. That blend is itself ranked among the reference
 * set's blends, so the score is a board's place among its size's boards:
 * about one in a hundred boards is each score, and 50 is a middling board.
 * It does not compare across sizes.
 */

/** What is measured of one board. */
export type Measure = {
  kind: Kind;
  wrap: boolean;
  /** The pieces the water goes through in the answer. */
  pieces: number;
  /** 1 less the share of pieces plain at the first look. */
  obscure: number;
  /** Looks that changed something. */
  rounds: number;
  /** The share of the pieces still open when looking forces nothing more. */
  unsettled: number;
  /** 0 for no guessing; otherwise positions that branched, then positions looked at, as one number. */
  guessing: number;
  /** In a drains board, the share of the pieces the water does not go through; 0 for a network. */
  spares: number;
};

/** The measures, by name. */
export type MeasureName = "obscure" | "rounds" | "unsettled" | "guessing" | "spares";

/** The weights of the measures in the blend, for each kind. */
export const DIFFICULTY_WEIGHTS: Record<Kind, Record<MeasureName, number>> = {
  network: { obscure: 0.25, rounds: 0.3, unsettled: 0.2, guessing: 0.25, spares: 0 },
  drains: { obscure: 0.2, rounds: 0.25, unsettled: 0.15, guessing: 0.2, spares: 0.2 },
  // Spares are the decoys of an inlet-outlet board, so it is measured as a drains board is.
  "inlet-outlet": { obscure: 0.2, rounds: 0.25, unsettled: 0.15, guessing: 0.2, spares: 0.2 },
};

/** The measures, in the order the reference lists them. */
export const MEASURE_NAMES: readonly MeasureName[] = ["obscure", "rounds", "unsettled", "guessing", "spares"];

/** A reference set of boards, as quantiles: every measure at 21 even steps from its least to its greatest, and the blend of the five at 101. */
export type Reference = Record<MeasureName, number[]> & { blend: number[] };

/** Every measure of one board, from the board as given and one of its answers. */
export function measureSuido(layout: Layout, solution: readonly number[]): Measure {
  const flow = flowOf(layout, solution);
  const found = solve(layout, 2);
  const looked = deduce(layout, solution);
  const spare = layout.kind !== "network" ? layout.cells.filter((mask) => mask !== 0).length - flow.wetPieces : 0;
  const pieces = Math.max(1, looked.pieces);
  return {
    kind: layout.kind,
    wrap: layout.wrap,
    pieces: looked.pieces,
    obscure: 1 - looked.glance / pieces,
    rounds: looked.rounds,
    unsettled: 1 - looked.settled / pieces,
    guessing: found.branches === 0 ? 0 : found.branches * 1_000_000 + found.nodes,
    spares: layout.kind !== "network" ? spare / Math.max(1, layout.cells.filter((mask) => mask !== 0).length) : 0,
  };
}

/** Where `value` stands among sorted quantiles, 0 to 1: how far through them it is, by the share of the way between neighbours. */
export function percentileIn(quantiles: readonly number[], value: number): number {
  const last = quantiles.length - 1;
  if (last <= 0 || value <= quantiles[0]!) return 0;
  if (value > quantiles[last]!) return 1;
  let at = 1;
  while (quantiles[at]! < value) at += 1;
  const below = quantiles[at - 1]!;
  const above = quantiles[at]!;
  return (at - 1 + (above === below ? 0 : (value - below) / (above - below))) / last;
}

/** The blend of a board's five percentiles against `reference`, 0 to 1, before it is ranked among the blends. */
export function blendOf(measure: Measure, reference: Reference): number {
  const weights = DIFFICULTY_WEIGHTS[measure.kind];
  return MEASURE_NAMES.reduce((sum, name) => sum + weights[name] * percentileIn(reference[name], measure[name]), 0);
}

/** The score of a measure against a reference set before it is rounded, from 1 to 100: what boards are put in order by, so that two boards of one whole score still have an order. */
export function exactScoreOf(measure: Measure, reference: Reference): number {
  return 1 + 99 * percentileIn(reference.blend, blendOf(measure, reference));
}

/** The score of a measure against a reference set: 1 (the plainest of its size) to 100. */
export function scoreOf(measure: Measure, reference: Reference): number {
  return Math.min(100, Math.max(1, Math.round(exactScoreOf(measure, reference))));
}

/** The key a reference set is kept under. */
export function referenceKey(side: number, kind: Kind, wrap: boolean): string {
  return `${side}${kind === "network" ? "" : kind === "drains" ? "d" : "i"}${wrap ? "w" : ""}`;
}

/**
 * The reference set a board is scored against: that of the board's side (the
 * square root of its cells, to the nearest size there is a set for), kind and
 * wrap. A board of a size no set was made for is scored among the nearest. A
 * board's walls and locked pieces are not part of its set: they make it easier
 * than the boards of its set, and its score says so.
 */
export function referenceFor(layout: Pick<Layout, "width" | "height" | "kind" | "wrap">): Reference {
  const side = Math.sqrt(layout.width * layout.height);
  const nearest = DIFFICULTY_SIDES.reduce((best, one) => (Math.abs(one - side) < Math.abs(best - side) ? one : best));
  return DIFFICULTY_REFERENCE[referenceKey(nearest, layout.kind, layout.wrap)]!;
}

/** How hard a board is, 1 to 100 among boards of its size, from the board as given and one of its answers. */
export function difficultyOf(layout: Layout, solution: readonly number[]): number {
  return scoreOf(measureSuido(layout, solution), referenceFor(layout));
}

/** The same before it is rounded to a whole number, from 1 to 100: the order boards are put in. */
export function exactDifficultyOf(layout: Layout, solution: readonly number[]): number {
  return exactScoreOf(measureSuido(layout, solution), referenceFor(layout));
}

/** Quantiles of a list of numbers, at `points` even steps from least to greatest, for a reference set. */
export function quantilesOf(values: readonly number[], points: number): number[] {
  const sorted = [...values].sort((a, b) => a - b);
  return Array.from({ length: points }, (_, step) => {
    const at = (step / (points - 1)) * (sorted.length - 1);
    const low = Math.floor(at);
    const high = Math.ceil(at);
    const value = sorted[low]! + (sorted[high]! - sorted[low]!) * (at - low);
    return Math.round(value * 10000) / 10000;
  });
}
