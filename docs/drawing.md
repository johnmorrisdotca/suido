# Drawing

```ts
import { cellStates, drawSuido, paintSuido, SUIDO_STYLE } from "@johnmorrisdotca/suido/draw";
```

`drawSuido` returns SVG text: ground, pipes, pumps and drains, and the water in them.
It is a separate entry, so a server that only checks an answer never loads it.
`SUIDO_STYLE` is the CSS that turns it into water. Put it in the page once; every
colour is a custom property on `.suido`, and the board is dark when the device is.
A wall is a bar across its edge, a locked piece a frame and a padlock, and a board that wraps a dashed rim. A big piece has a solid plate under its four cells and a block that turns as one a dashed rim round them, each with a ring and an arrow where its four cells meet; a tap on any of the four turns the whole. A piece in a block is named by the cell it was given in and carried round by the block, so `cellStates` reads its water where it is now.
`drawSuidoThumb(layout, { masks })` draws a board small, in a few dozen elements however big it is, for a page that
shows a whole block of levels at once; with the pieces of the answer as `masks` the water is in it.

The water **flows**. After a tap, call `paintSuido(svg, layout, masks, quarters)` with how the
pieces face now and how far each has been turned in all: it writes what changed onto the
drawing in place, and the style's transitions do the rest. The pipes turn, the water runs
out along the network from the pump one cell after another, and runs back out of a pipe
turned away from it. An open end shows a drip. With reduced motion asked for, it all
happens at once. Only what has changed since the last tap is written, which on a board of a thousand pieces is a few dozen.

Nothing on the board can be selected, dragged or double-tapped, and a piece is a rotation
about the middle of its cell. Everything is drawn in code: no images, no fonts, no
script in the drawing.

