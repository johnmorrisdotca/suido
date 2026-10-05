/**
 * LOOKING AT A BIG BOARD THROUGH A BOX. A board of thirty by thirty is more pieces than a phone's width holds
 * under a thumb, so a board can be zoomed and moved about: the view is the part of the board's drawing shown,
 * which is the drawing's own `viewBox`, so the pipes stay crisp however far in it is.
 *
 * The first half is plain arithmetic on a view (`SuidoView`), in the drawing's units, where a cell is 100
 * across: usable anywhere, a server included. `attachSuidoView` is the second half, and needs a page: it
 * moves the view by a finger, a mouse and the wheel, and keeps a tap on a piece a tap.
 *
 *  - ONE FINGER or the mouse, held down and moved, moves the board once it is zoomed in; a press that did not
 *    move is a tap on the piece under it. At the whole-board view a drag is left to the page, which scrolls.
 *  - TWO FINGERS pinch to zoom about the middle between them and move the view with it.
 *  - THE WHEEL zooms about the pointer when control or command is held (a trackpad's pinch is that), and
 *    moves a zoomed board otherwise.
 *  - `zoomIn`, `zoomOut` and `fit` are for buttons; `show` brings a piece into view, for the keyboard.
 */

/** The part of a board shown: how far in (1 is the whole board), and where its top left corner is, in the drawing's units. */
export type SuidoView = { zoom: number; x: number; y: number };

/** The whole board. */
export const SUIDO_FIT: SuidoView = { zoom: 1, x: 0, y: 0 };

/** The furthest in a view goes: this many times the whole board. */
export const SUIDO_MOST_ZOOM = 6;

/** A board's size in the drawing's units: a hundred across a cell. */
export type SuidoBox = { width: number; height: number };

/** The size of a board in the drawing's units. */
export function boxOf(layout: { width: number; height: number }): SuidoBox {
  return { width: layout.width * 100, height: layout.height * 100 };
}

/** A view kept inside the board, never further in than `most` and never showing past an edge. */
export function clampView(view: SuidoView, box: SuidoBox, most = SUIDO_MOST_ZOOM): SuidoView {
  const zoom = Math.min(most, Math.max(1, view.zoom));
  const across = box.width / zoom;
  const down = box.height / zoom;
  return { zoom, x: Math.min(box.width - across, Math.max(0, view.x)), y: Math.min(box.height - down, Math.max(0, view.y)) };
}

/** The `viewBox` that shows a view. */
export function viewBoxOf(view: SuidoView, box: SuidoBox): string {
  const clamped = clampView(view, box);
  return `${round(clamped.x)} ${round(clamped.y)} ${round(box.width / clamped.zoom)} ${round(box.height / clamped.zoom)}`;
}

const round = (value: number): number => Math.round(value * 100) / 100;

/** A view zoomed by `factor` about the point (`ax`, `ay`) of the board, which stays under the same place in the box. */
export function zoomAbout(view: SuidoView, factor: number, ax: number, ay: number, box: SuidoBox, most = SUIDO_MOST_ZOOM): SuidoView {
  const zoom = Math.min(most, Math.max(1, view.zoom * factor));
  const scale = view.zoom / zoom;
  return clampView({ zoom, x: ax - (ax - view.x) * scale, y: ay - (ay - view.y) * scale }, box, most);
}

/** A view moved by (`dx`, `dy`) in the drawing's units. */
export function panView(view: SuidoView, dx: number, dy: number, box: SuidoBox): SuidoView {
  return clampView({ ...view, x: view.x + dx, y: view.y + dy }, box);
}

/** The view moved the least that shows the whole of a cell (a margin of half a cell round it where there is room), and no further in than it was. */
export function viewShowing(view: SuidoView, box: SuidoBox, width: number, cell: number): SuidoView {
  const left = (cell % width) * 100 - 50;
  const top = Math.floor(cell / width) * 100 - 50;
  const across = box.width / view.zoom;
  const down = box.height / view.zoom;
  let { x, y } = view;
  if (left < x) x = left;
  else if (left + 200 > x + across) x = left + 200 - across;
  if (top < y) y = top;
  else if (top + 200 > y + down) y = top + 200 - down;
  return clampView({ ...view, x, y }, box);
}

/** Whether the pieces of a board across a box `boxPx` wide are smaller than a thumb is comfortable with, so that a board offers to be zoomed. */
export function needsZoom(layout: { width: number }, boxPx: number, smallest = 22): boolean {
  return boxPx > 0 && boxPx / layout.width < smallest;
}

/** What `attachSuidoView` hands back. */
export type SuidoViewer = {
  /** The view as it is now. */
  get: () => SuidoView;
  zoomIn: () => void;
  zoomOut: () => void;
  /** Back to the whole board. */
  fit: () => void;
  /** Move the view by a share of what it shows: `pan(0.25, 0)` is a quarter of its width to the right. */
  pan: (across: number, down: number) => void;
  /** Move the view, if it has to, to show a piece (by the cell it was given in). */
  show: (cell: number) => void;
  /** Stop listening and put the drawing back as it was. */
  destroy: () => void;
};

/** What a viewer may be asked for. */
export type SuidoViewerOptions = {
  /** Told after every change of view. */
  onChange?: (view: SuidoView) => void;
  /** The most it zooms in. Default `SUIDO_MOST_ZOOM`. */
  most?: number;
};

/** A finger or the mouse has to move this far, in pixels, before a press is a drag and no longer a tap. */
const DRAG_PX = 9;

/**
 * Lets the box `box` move and zoom the board drawn in `svg` (which must have a `viewBox` of the whole board). A
 * press that moves is not a tap: the click that follows a drag is swallowed. Call it once the drawing is in
 * the page; `destroy` removes every listener it added.
 */
export function attachSuidoView(box: HTMLElement, svg: SVGSVGElement, layout: { width: number; height: number }, options: SuidoViewerOptions = {}): SuidoViewer {
  const size = boxOf(layout);
  const most = options.most ?? SUIDO_MOST_ZOOM;
  const whole = svg.getAttribute("viewBox");
  let view: SuidoView = SUIDO_FIT;
  const pointers = new Map<number, { x: number; y: number }>();
  let drag: { x: number; y: number; moved: boolean } | null = null;
  let pinch: { distance: number } | null = null;
  let swallow = false;

  const apply = (next: SuidoView): void => {
    const was = view;
    view = clampView(next, size, most);
    svg.setAttribute("viewBox", viewBoxOf(view, size));
    // At the whole board a drag is the page's to scroll; zoomed in it is the board's, and a pinch is always the board's.
    box.style.touchAction = view.zoom > 1 ? "none" : "pan-x pan-y";
    box.dataset.zoom = view.zoom.toFixed(2);
    box.dataset.zoomed = String(view.zoom > 1);
    if (view.zoom !== was.zoom || view.x !== was.x || view.y !== was.y) options.onChange?.(view);
  };
  /** The drawing's units under one pixel of the box. */
  const unitsPerPx = (): number => size.width / view.zoom / Math.max(1, box.getBoundingClientRect().width);
  /** A point of the box, in pixels from its top left, as a point of the board. */
  const boardPoint = (clientX: number, clientY: number): { x: number; y: number } => {
    const rect = box.getBoundingClientRect();
    const per = size.width / view.zoom / Math.max(1, rect.width);
    return { x: view.x + (clientX - rect.left) * per, y: view.y + (clientY - rect.top) * per };
  };

  const onDown = (event: PointerEvent): void => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1) drag = { x: event.clientX, y: event.clientY, moved: false };
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()] as [{ x: number; y: number }, { x: number; y: number }];
      pinch = { distance: Math.hypot(a.x - b.x, a.y - b.y) };
      if (drag !== null) drag.moved = true;
      swallow = true;
    }
  };
  const onMove = (event: PointerEvent): void => {
    const before = pointers.get(event.pointerId);
    if (before === undefined) return;
    const now = { x: event.clientX, y: event.clientY };
    pointers.set(event.pointerId, now);
    if (pointers.size >= 2 && pinch !== null) {
      const [a, b] = [...pointers.values()] as [{ x: number; y: number }, { x: number; y: number }];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      const middle = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      // The point of the board under the middle stays under it: zoom about it, then move by how far the middle itself went.
      const about = boardPoint(middle.x, middle.y);
      const moved = { x: (now.x - before.x) / 2, y: (now.y - before.y) / 2 };
      let next = pinch.distance > 0 ? zoomAbout(view, distance / pinch.distance, about.x, about.y, size, most) : view;
      const per = size.width / next.zoom / Math.max(1, box.getBoundingClientRect().width);
      next = panView(next, -moved.x * per, -moved.y * per, size);
      pinch.distance = distance;
      apply(next);
      return;
    }
    if (drag === null || view.zoom <= 1) return;
    if (!drag.moved && Math.hypot(now.x - drag.x, now.y - drag.y) < DRAG_PX) return;
    if (!drag.moved) {
      drag.moved = true;
      swallow = true;
      try {
        box.setPointerCapture(event.pointerId);
      } catch {
        // A pointer that has gone is not captured.
      }
    }
    const per = unitsPerPx();
    apply(panView(view, -(now.x - before.x) * per, -(now.y - before.y) * per, size));
  };
  const onUp = (event: PointerEvent): void => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
    if (pointers.size === 0) {
      drag = null;
      // The click a drag ends with is not a tap on a piece. It comes straight after, or not at all.
      if (swallow) setTimeout(() => (swallow = false), 0);
    }
  };
  const onClick = (event: MouseEvent): void => {
    if (!swallow) return;
    swallow = false;
    event.preventDefault();
    event.stopImmediatePropagation();
  };
  const onWheel = (event: WheelEvent): void => {
    if (event.ctrlKey || event.metaKey) {
      event.preventDefault();
      const about = boardPoint(event.clientX, event.clientY);
      apply(zoomAbout(view, Math.exp(-event.deltaY * (event.ctrlKey ? 0.01 : 0.004)), about.x, about.y, size, most));
    } else if (view.zoom > 1) {
      event.preventDefault();
      const per = unitsPerPx();
      apply(panView(view, event.deltaX * per, event.deltaY * per, size));
    }
  };

  box.addEventListener("pointerdown", onDown);
  box.addEventListener("pointermove", onMove);
  box.addEventListener("pointerup", onUp);
  box.addEventListener("pointercancel", onUp);
  box.addEventListener("click", onClick, true);
  box.addEventListener("wheel", onWheel, { passive: false });
  apply(SUIDO_FIT);

  const middle = (): { x: number; y: number } => ({ x: view.x + size.width / view.zoom / 2, y: view.y + size.height / view.zoom / 2 });
  return {
    get: () => view,
    zoomIn: () => apply(zoomAbout(view, 1.6, middle().x, middle().y, size, most)),
    zoomOut: () => apply(zoomAbout(view, 1 / 1.6, middle().x, middle().y, size, most)),
    fit: () => apply(SUIDO_FIT),
    pan: (across, down) => apply(panView(view, (across * size.width) / view.zoom, (down * size.height) / view.zoom, size)),
    show: (cell) => apply(viewShowing(view, size, layout.width, cell)),
    destroy: () => {
      box.removeEventListener("pointerdown", onDown);
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerup", onUp);
      box.removeEventListener("pointercancel", onUp);
      box.removeEventListener("click", onClick, true);
      box.removeEventListener("wheel", onWheel);
      box.style.removeProperty("touch-action");
      delete box.dataset.zoom;
      delete box.dataset.zoomed;
      if (whole !== null) svg.setAttribute("viewBox", whole);
    },
  };
}
