import { SUIDO_STYLE } from "./style.ts";

/**
 * THE STYLE a playable Suido board wears (`mountSuido`, `<suido-board>`): the
 * drawing's own (`SUIDO_STYLE`) and the board's box, its chips, its lines of
 * words and its buttons. Colours are custom properties on `.suido-play`
 * (`--sdp-ink`, `--sdp-muted`, `--sdp-rule`, `--sdp-surface`, `--sdp-accent`,
 * `--sdp-good`) so a page sets only what it wants different.
 *
 * Nothing moves when something is chosen: the board is one box in the board's
 * own shape, the lines of words keep the room their longest wording takes, and
 * the buttons are one size.
 */
export const SUIDO_PLAY_STYLE = `${SUIDO_STYLE}
.suido-play {
  --sdp-ink: #1f2320; --sdp-muted: #6b6f68; --sdp-rule: #ddd6c6; --sdp-surface: #fbf8f1; --sdp-accent: #b5452c; --sdp-good: #2f7a4f;
  display: block; max-width: 100%; box-sizing: border-box; color: var(--sdp-ink); font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .suido-play { --sdp-ink: #ece8dc; --sdp-muted: #a09d93; --sdp-rule: #3a3d38; --sdp-surface: #1d201e; --sdp-accent: #ff8a6b; --sdp-good: #6fcf97; }
}
:root[data-theme="dark"] .suido-play { --sdp-ink: #ece8dc; --sdp-muted: #a09d93; --sdp-rule: #3a3d38; --sdp-surface: #1d201e; --sdp-accent: #ff8a6b; --sdp-good: #6fcf97; }
.suido-play *, .suido-play *::before, .suido-play *::after { box-sizing: border-box; }
.suido-play .sdp-board { position: relative; width: 100%; aspect-ratio: var(--sdp-ratio, 1); }
.suido-play .sdp-board .suido { transition: opacity .15s; }
.suido-play[aria-busy="true"] .sdp-board .suido { opacity: .45; }
.suido-play .sdp-chips { list-style: none; margin: 10px 0 0; padding: 0; display: flex; flex-wrap: wrap; align-content: flex-start; gap: 6px; min-height: 4.4rem; }
.suido-play .sdp-chip { border: 1px solid var(--sdp-rule); background: var(--sdp-surface); color: var(--sdp-ink); border-radius: 999px; min-height: 32px; padding: 0 12px; font-size: .8rem; font-weight: 600; display: inline-flex; align-items: center; cursor: help; }
.suido-play .sdp-chip[data-twist="plain"] { color: var(--sdp-muted); font-weight: 500; }
.suido-play .sdp-status { margin: 8px 0 0; font-weight: 600; text-align: center; height: 2.9em; overflow: hidden; display: flex; align-items: center; justify-content: center; }
.suido-play .sdp-status[data-solved="true"] { color: var(--sdp-good); }
.suido-play .sdp-meter { margin: 6px 0 0; text-align: center; color: var(--sdp-muted); font-size: .9rem; font-variant-numeric: tabular-nums; line-height: 1.4; height: 1.4em; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.suido-play .sdp-note { margin: 4px 0 0; text-align: center; color: var(--sdp-accent); line-height: 1.4; height: 1.4em; overflow: hidden; font-weight: 600; }
.suido-play .sdp-controls { display: flex; flex-wrap: wrap; justify-content: center; gap: 6px; margin-top: 10px; }
.suido-play button { font: inherit; color: inherit; user-select: none; -webkit-user-select: none; touch-action: manipulation; }
.suido-play .sdp-button { border: 1px solid var(--sdp-rule); background: var(--sdp-surface); color: var(--sdp-ink); border-radius: 999px; min-height: 44px; min-width: 44px; padding: 0 14px; font-size: .85rem; font-weight: 600; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
.suido-play .sdp-button:hover:not(:disabled) { border-color: var(--sdp-ink); }
.suido-play .sdp-button:disabled { opacity: .32; cursor: default; }
.suido-play [hidden] { display: none !important; }
@media (min-width: 700px) {
  .suido-play .sdp-chips { min-height: 2.4rem; }
}
@media (max-width: 520px) {
  .suido-play .sdp-status { height: 4.4em; }
  /* Three buttons can take one row or two, by the width of a font and a language: room for two, so nothing below moves. */
  .suido-play .sdp-controls { min-height: 5.9rem; align-content: flex-start; }
}
`;
