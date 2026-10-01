/**
 * THE STYLE a Suido board is drawn with: colours as custom properties, the
 * water's flow as transitions, and the one rule that matters for a game played
 * with fingers: nothing on the board can be selected, dragged or double-tapped.
 *
 * The drawing (`drawSuido`) and the painting (`paintSuido`) only set data
 * attributes and two custom properties, and this is what turns them into
 * water: `data-w` on each arm of a pipe says whether the water comes in by it,
 * goes out by it, or runs out of it (a leak); `--k` on a cell is how many cells
 * the water went through to get there, and each cell's water starts a step
 * after the one before, so it is seen to flow from the pump out along the pipes.
 * It runs backwards, quickly, when a pipe is broken. With reduced motion asked
 * for, it all happens at once.
 *
 * Every colour is a custom property on `.suido` (`--sd-ground`, `--sd-edge`,
 * `--sd-pipe`, `--sd-water`, `--sd-source`, `--sd-bowl`, `--sd-leak`, ...), so a
 * page's own style needs only to set the ones it wants different.
 */
export const SUIDO_STYLE = `
.suido {
  --sd-step: 80ms;
  --sd-line: #d9d1bf; --sd-ground: #fbf8f1; --sd-edge: #3b4148; --sd-pipe: #aeb7c0; --sd-water: #1b8fe3;
  --sd-source: #1b5fa6; --sd-bowl: #3b6a7e; --sd-leak: #e04a2f; --sd-focus: #b5452c; --sd-hint: #f6dc8a; --sd-solved: #e8f3ec;
  display: block; width: 100%; height: auto;
  user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  overflow: visible;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .suido {
    --sd-line: #171a18; --sd-ground: #262a27; --sd-edge: #0c0f11; --sd-pipe: #838c95; --sd-water: #4db6ff;
    --sd-source: #2f7fcf; --sd-bowl: #6aa4bd; --sd-leak: #ff6a4d; --sd-focus: #ffb199; --sd-hint: #5a4a1a; --sd-solved: #20332a;
  }
}
:root[data-theme="dark"] .suido {
  --sd-line: #171a18; --sd-ground: #262a27; --sd-edge: #0c0f11; --sd-pipe: #838c95; --sd-water: #4db6ff;
  --sd-source: #2f7fcf; --sd-bowl: #6aa4bd; --sd-leak: #ff6a4d; --sd-focus: #ffb199; --sd-hint: #5a4a1a; --sd-solved: #20332a;
}
.suido * { user-select: none; -webkit-user-select: none; }
.suido .sd-board { fill: var(--sd-line); }
.suido .sd-rim { fill: none; stroke: var(--sd-leak); stroke-width: 3; stroke-dasharray: 10 8; opacity: .55; pointer-events: none; }
.suido .sd-cell { outline: none; cursor: pointer; --sd-half: calc(var(--sd-step) / 2); --sd-lead: calc(var(--sd-step) / 2); --sd-arrive: calc(var(--k, 0) * var(--sd-step)); }
.suido .sd-cell[data-role="source"] { --sd-lead: 0ms; }
.suido .sd-cell[data-shape="blank"] { cursor: default; }
.suido .sd-ground { fill: var(--sd-ground); stroke: none; transition: fill .2s; }
.suido[data-solved="true"] .sd-ground { fill: var(--sd-solved); }
.suido .sd-cell[data-hint="true"] .sd-ground { fill: var(--sd-hint); }
.suido .sd-cell:focus-visible .sd-ground { stroke: var(--sd-focus); stroke-width: 4; }
.suido .sd-turn { transform-box: fill-box; transform-origin: center; transform: rotate(calc(var(--q, 0) * 90deg)); transition: transform .16s ease-out; }
.suido .sd-box { fill: none; stroke: none; }
.suido .sd-edge { fill: none; stroke: var(--sd-edge); stroke-width: 34; stroke-linecap: butt; }
.suido .sd-hub-edge { fill: var(--sd-edge); }
.suido .sd-pipe { fill: none; stroke: var(--sd-pipe); stroke-width: 26; stroke-linecap: butt; }
.suido .sd-hub { fill: var(--sd-pipe); }
.suido .sd-in, .suido .sd-out { fill: none; stroke: var(--sd-water); stroke-width: 14; stroke-linecap: butt; stroke-dasharray: 1 1; stroke-dashoffset: 1; transition: stroke-dashoffset .12s ease-in; }
.suido .sd-arm[data-w="in"] .sd-in { stroke-dashoffset: 0; transition: stroke-dashoffset var(--sd-half) linear var(--sd-arrive); }
.suido .sd-arm[data-w="out"] .sd-out, .suido .sd-arm[data-w="leak"] .sd-out { stroke-dashoffset: 0; transition: stroke-dashoffset var(--sd-half) linear calc(var(--sd-arrive) + var(--sd-lead)); }
.suido .sd-cell[data-role="source"] .sd-arm[data-w="out"] .sd-out, .suido .sd-cell[data-role="source"] .sd-arm[data-w="leak"] .sd-out { transition-duration: var(--sd-step); }
.suido .sd-hubwater { fill: var(--sd-water); opacity: 0; transition: opacity .12s; }
.suido .sd-cell[data-wet="true"] .sd-hubwater { opacity: 1; transition: opacity calc(var(--sd-half) / 2) linear calc(var(--sd-arrive) + var(--sd-lead)); }
.suido .sd-leak { opacity: 0; transition: opacity .12s; }
.suido .sd-arm[data-w="leak"] .sd-leak { opacity: 1; transition: opacity .15s linear calc(var(--sd-arrive) + var(--sd-lead) + var(--sd-half)); }
.suido .sd-leak .sd-cap { stroke: var(--sd-leak); stroke-width: 6; fill: none; stroke-linecap: round; }
.suido .sd-leak .sd-drop { fill: var(--sd-water); stroke: var(--sd-leak); stroke-width: 2.5; }
.suido .sd-src { fill: var(--sd-source); stroke: var(--sd-edge); stroke-width: 3; }
.suido .sd-glyph { fill: #fff; }
.suido .sd-bowl { fill: var(--sd-ground); stroke: var(--sd-bowl); stroke-width: 6; }
.suido .sd-fill { fill: var(--sd-water); transform-box: fill-box; transform-origin: center; transform: scale(0); transition: transform .12s ease-in; }
.suido .sd-cell[data-wet="true"] .sd-fill { transform: scale(1); transition: transform calc(var(--sd-half) * 2) ease-out calc(var(--sd-arrive) + var(--sd-lead)); }
@media (prefers-reduced-motion: reduce) {
  .suido { --sd-step: 0ms; }
  .suido .sd-turn, .suido .sd-in, .suido .sd-out, .suido .sd-hubwater, .suido .sd-fill, .suido .sd-leak, .suido .sd-ground { transition: none !important; }
}
`;
