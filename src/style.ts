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
 * Walls are bars across the edges they are on (`--sd-wall`) and a locked piece
 * has a frame and a padlock (`--sd-lock`). A block that turns as one has a plate
 * that is the ground of all four of its cells (`--sd-plate`: solid for a big piece, a
 * dashed rim for four pieces that turn together), drawn under every piece so that a
 * piece turned into the next cell is seen on it, and a ring with an arrow where its
 * four cells meet (`--sd-pivot`). A hint on a block lights its plate (`data-hint`). Every colour is a custom property on
 * `.suido` (`--sd-ground`, `--sd-edge`, `--sd-pipe`, `--sd-water`, `--sd-source`,
 * `--sd-bowl`, `--sd-leak`, ...), so a
 * page's own style needs only to set the ones it wants different.
 */
export const SUIDO_STYLE = `
.suido {
  --sd-step: 80ms;
  --sd-line: #d9d1bf; --sd-ground: #fbf8f1; --sd-edge: #3b4148; --sd-pipe: #aeb7c0; --sd-water: #1b8fe3;
  --sd-source: #1b5fa6; --sd-bowl: #3b6a7e; --sd-leak: #e04a2f; --sd-focus: #b5452c; --sd-hint: #f6dc8a; --sd-solved: #e8f3ec;
  --sd-wall: #7a4f2c; --sd-lock: #8a6a2e; --sd-plate: #ebe2cc; --sd-plate-edge: #8d8467; --sd-plate-solved: #dcebdc; --sd-pivot: #b5452c;
  display: block; width: 100%; height: auto;
  user-select: none; -webkit-user-select: none; -webkit-touch-callout: none; touch-action: manipulation; -webkit-tap-highlight-color: transparent;
  overflow: visible;
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) .suido {
    --sd-line: #171a18; --sd-ground: #262a27; --sd-edge: #0c0f11; --sd-pipe: #838c95; --sd-water: #4db6ff;
    --sd-source: #2f7fcf; --sd-bowl: #6aa4bd; --sd-leak: #ff6a4d; --sd-focus: #ffb199; --sd-hint: #5a4a1a; --sd-solved: #20332a;
    --sd-wall: #c99a64; --sd-lock: #d9b565; --sd-plate: #323830; --sd-plate-edge: #7d8a75; --sd-plate-solved: #2b4034; --sd-pivot: #ff8a6b;
  }
}
:root[data-theme="dark"] .suido {
  --sd-line: #171a18; --sd-ground: #262a27; --sd-edge: #0c0f11; --sd-pipe: #838c95; --sd-water: #4db6ff;
  --sd-source: #2f7fcf; --sd-bowl: #6aa4bd; --sd-leak: #ff6a4d; --sd-focus: #ffb199; --sd-hint: #5a4a1a; --sd-solved: #20332a;
  --sd-wall: #c99a64; --sd-lock: #d9b565; --sd-plate: #323830; --sd-plate-edge: #7d8a75; --sd-plate-solved: #2b4034; --sd-pivot: #ff8a6b;
}
.suido * { user-select: none; -webkit-user-select: none; }
.suido .sd-board { fill: var(--sd-line); }
.suido .sd-rim { fill: none; stroke: var(--sd-leak); stroke-width: 3; stroke-dasharray: 10 8; opacity: .55; pointer-events: none; }
.suido .sd-cell { outline: none; cursor: pointer; --sd-half: calc(var(--sd-step) / 2); --sd-lead: calc(var(--sd-step) / 2); --sd-arrive: calc(var(--k, 0) * var(--sd-step)); }
.suido .sd-cell[data-role="source"] { --sd-lead: 0ms; }
.suido .sd-cell[data-shape="blank"], .suido .sd-cell[data-locked="true"] { cursor: default; }
.suido .sd-lockframe { fill: none; stroke: var(--sd-lock); stroke-width: 3; opacity: .75; pointer-events: none; }
.suido .sd-shackle { fill: none; stroke: var(--sd-lock); stroke-width: 3.5; stroke-linecap: round; }
.suido .sd-lockbody { fill: var(--sd-lock); }
.suido .sd-wall { fill: var(--sd-wall); stroke: var(--sd-edge); stroke-width: 1.5; pointer-events: none; }
.suido .sd-ground { fill: var(--sd-ground); stroke: none; transition: fill .2s; }
.suido[data-solved="true"] .sd-ground { fill: var(--sd-solved); }
.suido .sd-cell[data-block] .sd-ground { fill: none; }
.suido .sd-plate { fill: var(--sd-plate); stroke: var(--sd-plate-edge); stroke-width: 4; pointer-events: none; transition: fill .2s; }
.suido .sd-plate[data-kind="turn"] { fill: var(--sd-ground); stroke-width: 3; stroke-dasharray: 10 7; }
.suido[data-solved="true"] .sd-plate[data-kind="turn"] { fill: var(--sd-solved); }
.suido[data-solved="true"] .sd-plate[data-kind="big"] { fill: var(--sd-plate-solved); }
.suido .sd-cell[data-hint="true"] .sd-ground, .suido[data-solved="true"] .sd-cell[data-hint="true"] .sd-ground, .suido .sd-plate[data-hint="true"], .suido[data-solved="true"] .sd-plate[data-hint="true"] { fill: var(--sd-hint); }
.suido .sd-pivot { pointer-events: none; }
.suido .sd-pivot-disc { fill: var(--sd-ground); stroke: var(--sd-pivot); stroke-width: 3; opacity: .94; }
.suido .sd-pivot-arrow { fill: none; stroke: var(--sd-pivot); stroke-width: 3.2; stroke-linecap: round; }
.suido .sd-pivot-head { fill: var(--sd-pivot); }
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
.suido .sd-thumbwater { fill: none; stroke: var(--sd-water); stroke-width: 14; stroke-linecap: butt; }
.suido .sd-hubwater { fill: var(--sd-water); opacity: 0; transition: opacity .12s; }
.suido .sd-cell[data-wet="true"] .sd-hubwater { opacity: 1; transition: opacity calc(var(--sd-half) / 2) linear calc(var(--sd-arrive) + var(--sd-lead)); }
.suido .sd-leak { opacity: 0; transition: opacity .12s; }
/* What cannot be seen is not painted. A board of a thousand pieces has two thousand arms and as many drips, almost all of them dry, and painting them all
   (a piece of the page each) was most of a frame on a phone. They are hidden a moment after the water leaves them, so it is still seen to run back. */
.suido .sd-cell:not([data-wet="true"]) .sd-arm { visibility: hidden; transition: visibility 0s linear .45s; }
.suido .sd-arm:not([data-w="leak"]) .sd-leak { visibility: hidden; transition: opacity .12s, visibility 0s linear .45s; }
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
  .suido .sd-turn, .suido .sd-in, .suido .sd-out, .suido .sd-hubwater, .suido .sd-fill, .suido .sd-leak, .suido .sd-ground, .suido .sd-plate { transition: none !important; }
}
`;
