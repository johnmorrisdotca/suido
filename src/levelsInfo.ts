/**
 * EVERYTHING ABOUT SUIDO'S LEVELS BUT THE LEVELS: `@johnmorrisdotca/suido/levels-info`. The sizes and how many levels each has, the
 * blocks, which levels are open, a row read, what a level teaches and how hard it is marked, and the level of the day: all of it
 * read without loading a board, and with no way to load one. `/levels` is this and the loader that fetches a size's boards, and
 * a bundle that carries the loader carries every size's data with it, so a server that only needs to know how many levels there
 * are, or which block opens next, imports this instead.
 */
export * from "./levelCounts.ts";
export * from "./levelBlocks.ts";
export * from "./bigLevels.ts";
export * from "./levelRow.ts";
export * from "./ladder.ts";
export * from "./daily.ts";
