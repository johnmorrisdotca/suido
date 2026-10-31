/**
 * Suido, played in a page: `mountSuido` draws a board into any element and
 * plays it by tap, mouse and keyboard, with the water flowing as pipes join, a
 * hint, Start over, and the words in English and Japanese. A separate entry
 * (`@johnmorrisdotca/suido/play`), so a server never loads any of it.
 */

export type { SuidoEventDetail, SuidoMount, SuidoMountOptions, SuidoTurning } from "./mount.ts";
export { ensureSuidoPlayStyle, mountSuido } from "./mount.ts";
export { SUIDO_PLAY_STYLE } from "./playStyle.ts";
export type { SuidoLanguage } from "./strings.ts";
export { SUIDO_STRINGS, suidoLanguageOf, suidoSay } from "./strings.ts";
