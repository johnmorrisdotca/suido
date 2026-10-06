# How long a board takes to make

The timings of Suido's generator, and how big pieces and blocks are placed. Moved here from [the README](../README.md) to keep it under the length npm shows.

Time to make one board on a laptop (the average of 40 boards, and the slowest one in twenty), with
the default options; the last column asks for a difficulty, which makes about a dozen boards to find
one near it:

| Size | Network | Network, wrap | Drains | Drains, wrap | Network at a difficulty |
| --- | --- | --- | --- | --- | --- |
| 5×5 | 0.2 ms (95%: 0.3) | 1.0 ms (95%: 2.8) | 0.1 ms (95%: 0.4) | 0.3 ms (95%: 0.9) | 1.4 ms (95%: 4.0) |
| 6×6 | 0.1 ms (95%: 0.2) | 5.7 ms (95%: 17) | 0.1 ms (95%: 0.2) | 0.5 ms (95%: 1.9) | 0.8 ms (95%: 1.9) |
| 7×7 | 0.1 ms (95%: 0.2) | 7.2 ms (95%: 22) | 0.3 ms (95%: 0.7) | 1.0 ms (95%: 3.2) | 2.0 ms (95%: 4.2) |
| 8×8 | 0.1 ms (95%: 0.3) | 11 ms (95%: 49) | 0.5 ms (95%: 1.2) | 1.7 ms (95%: 9.8) | 3.2 ms (95%: 8.9) |
| 10×10 | 0.2 ms (95%: 0.4) | 13 ms (95%: 83) | 1.2 ms (95%: 3.6) | 9.5 ms (95%: 18) | 4.6 ms (95%: 13) |
| 12×12 | 0.6 ms (95%: 1.6) | 22 ms (95%: 91) | 1.6 ms (95%: 5.1) | 11 ms (95%: 47) | 22 ms (95%: 75) |
| 14×14 | 8.5 ms (95%: 83) | 35 ms (95%: 110) | 4.7 ms (95%: 24) | 19 ms (95%: 73) | 82 ms (95%: 355) |
| 16×16 | 5.2 ms (95%: 21) | 36 ms (95%: 136) | 16 ms (95%: 122) | 95 ms (95%: 415) | 133 ms (95%: 401) |

Generation is synchronous, so a page makes a big board in a moment's pause (the demo
shows "Making a board…" and lets the page paint first). The huge sizes, on the same laptop (the average of
six boards): a 20×20 network 4 ms and a 28×28 one 135 ms, with wrap about the same; a drains board takes 0.3 s at 20×20 and 2 s at 28×28,
and an inlet-outlet one 55 ms and 0.75 s. A phone is several times slower, so a page that makes a huge drains board
for somebody who asked for one does well to say so first. A network with big pieces or blocks takes about as long as one without.

**Big pieces and blocks.** `bigKinds` says which big pieces are drawn: `"five"` (the default, the five kinds a seed has always made), or `"simple"`, `"more"` or `"all"` of the 699 shapes, a family at random and then a shape of it (`docs/PIECES.md`). The blocks are placed first, apart from each other, each big piece facing a way
that has no opening off the board; the pipes of every big piece (its joins inside, and one pipe out of each opening) are then
fixed, and the forest of pipes grows round them from the pumps with those edges already in it and no pipe
where none may be. The board is scrambled with every block turned as one, and kept only if the solver, which treats a block as one thing with
four facings, proves it has one answer; where it finds a second, a pipe that is not part of a big piece is moved, as before.
