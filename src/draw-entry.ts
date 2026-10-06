/**
 * Suido's drawing: SVG text for a board and a piece, the style that turns the
 * drawing into flowing water, and the function that paints a board in play.
 * A separate entry (`@johnmorrisdotca/suido/draw`), so a server that only
 * checks an answer never loads any of it.
 */
export * from "./draw.ts";
export * from "./paint.ts";
export { SUIDO_STYLE } from "./style.ts";
export * from "./view.ts";
export * from "./drawGuide.ts";
