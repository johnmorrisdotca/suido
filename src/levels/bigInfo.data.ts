/**
 * WHAT IS KNOWN OF EVERY BIG-PIECES LEVEL WITHOUT ITS BOARD: the size of its board, how hard it is across the whole set (1 to 100,
 * `bigDifficulty.ts`), the twists it has and how many big pieces it has among its ordinary ones, in level order, so a page lists the set
 * and a server names a level's size without loading sixty-four boards. Written by `node scripts/suido-big-levels.ts`, never by hand;
 * `bigLevels.test.ts` holds all four to the levels.
 */
export const SUIDO_BIG_SIZES: readonly string[] = ["5x5","5x5","5x5","5x5","5x5","5x5","5x5","5x5","5x5","5x5","5x5","5x5","5x5","5x5","5x5","5x5","5x5","5x5","5x7","6x6","6x6","6x6","7x7","7x7","7x7","8x8","8x8","9x9","9x9","9x9","10x10","10x10","10x10","11x11","11x11","12x12","12x12","14x14","13x13","14x14","14x14","13x13","14x14","14x14","20x20","20x20","20x20","20x20","20x20","20x20","20x20","20x20","20x20","20x20","20x20","20x20","20x20","20x20","20x20","20x20","20x20","20x20","20x20","20x20"];

export const SUIDO_BIG_SCORES: readonly number[] = [1,2,4,6,7,9,10,12,12,15,18,18,18,23,23,25,27,27,29,30,33,34,35,37,40,41,42,44,44,47,48,49,51,53,54,56,57,59,61,63,64,65,67,68,70,72,73,75,75,78,80,82,85,86,87,89,90,92,95,96,98,98,99,100];

export const SUIDO_BIG_TWISTS: readonly string[] = ["big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces block-turns","big-pieces block-turns","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces","big-pieces block-turns","big-pieces","big-pieces","big-pieces block-turns","big-pieces","pumps big-pieces","pumps big-pieces","big-pieces","big-pieces block-turns","big-pieces","pumps big-pieces","big-pieces","big-pieces block-turns","big-pieces","big-pieces","big-pieces block-turns","pumps big-pieces","big-pieces","pumps big-pieces block-turns","big-pieces block-turns","big-pieces","walls big-pieces","walls big-pieces","big-pieces block-turns","big-pieces","pumps big-pieces","walls big-pieces","walls big-pieces","big-pieces","big-pieces block-turns","pumps big-pieces block-turns","pumps big-pieces","walls big-pieces","big-pieces","pumps walls big-pieces","big-pieces","big-pieces","wrap big-pieces","wrap big-pieces"];

export const SUIDO_BIG_PIECES: readonly number[] = [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2,3,2,3,4,4,5,6,4,6,6,6,8,8,10,9,12,11,12,13,11,13,14,31,25,24,25,32,30,20,25,13,30,13,17,24,13,27,10,19,13,14,13];
