import { drawSuido } from "./draw.ts";
import type { GuidePiece } from "./pieceGuide.ts";

/**
 * A piece of the guide (`SUIDO_PIECE_GUIDE`) as SVG text: its tiny board drawn by `drawSuido`, with the water in it where the guide says
 * the picture has some, and the piece's name as its description for a screen reader. `style` puts the board's style inside the drawing, so it
 * stands alone as an image.
 *
 * @param piece - A guide piece with its example layout and caption.
 * @param options - Drawing, mounting or generator choices specified by the signature.
 * @returns A piece of the guide (`SUIDO_PIECE_GUIDE`) as SVG text: its tiny board drawn by `drawSuido`, with the water in it where the guide says the picture has some, and the piece's name as its description for a screen reader. `style` puts the board's style inside the drawing, so it stands alone as an image.
 * @example
 * ```ts
 * import { drawGuidePiece } from "@johnmorrisdotca/suido/draw";
 * import { SUIDO_PIECE_GUIDE } from "@johnmorrisdotca/suido";
 *
 * console.log(drawGuidePiece(SUIDO_PIECE_GUIDE[0]).startsWith("<svg"));
 * ```
 */
export function drawGuidePiece(piece: GuidePiece, options: { style?: boolean; label?: string } = {}): string {
  return drawSuido(piece.layout, { water: piece.water, label: options.label ?? piece.name, style: options.style });
}
