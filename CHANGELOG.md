# Changelog

## 1.0.0 — 2026-10-01

The first release: Suido, a pipe puzzle, with its rules, solver, generator and
drawing, and a demo to play.

- Boards as short codes (size, flags and a character a cell), answers in the
  same code, and a check a server can trust in O(cells).
- The water: where it reaches from the pumps, in what order, and where it runs
  out of an open end.
- Two kinds: a network, where every piece must carry water, and drains, where
  every drain must be reached and spare pieces may stay dry. Boards that wrap,
  with up to several pumps, from 2×2 to 40×40 and not only square.
- A solver that counts answers (arc consistency and search for a network,
  growing a network for drains), held to trying every way on small boards.
- A seeded generator whose every board has exactly one answer, proved by the
  solver; a difficulty from 1 to 100 within each size, measured and ranked
  against a reference set made by the generator, and boards made to a
  difficulty asked for.
- The drawing as SVG text, the style that makes the water flow along the pipes
  as they join and run back out of one turned away, and a painter that updates
  a board in place.
- A demo in English and Japanese, with the family's cloth patches, a hint, a
  timer, and keyboard play.
